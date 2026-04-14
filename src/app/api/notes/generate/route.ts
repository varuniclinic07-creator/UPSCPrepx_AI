/**
 * BMAD Phase 4: Feature 10 - Notes Generation API
 * POST /api/notes/generate - Generate notes using Agentic Intelligence
 * AI Providers: 9Router → Groq → Ollama (NOT A4F)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAgenticNotesGenerator, NotesGenerationOptions } from '@/lib/notes/agentic-notes-generator';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { requireSession } from '@/lib/auth/session';
import { checkAccess } from '@/lib/auth/check-access';
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rate-limiter';
import { normalizeUPSCInput } from '@/lib/agents/normalizer-agent';

export const dynamic = 'force-dynamic';

export interface GenerateNotesRequest {
  topic: string;
  subject?: 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'CSAT' | 'Essay' | 'Prelims' | 'Optional';
  brevityLevel: '100' | '250' | '500' | '1000' | 'comprehensive';
  includeCurrentAffairs?: boolean;
  includeStaticMaterials?: boolean;
  includeDiagrams?: boolean;
  includeVideoSummary?: boolean;
}

export interface GenerateNotesResponse {
  success: boolean;
  note?: {
    id: string;
    topic: string;
    subject: string;
    content: string;
    contentHtml: string;
    wordCount: number;
    brevityLevel: string;
    sources: Array<{ name: string; url?: string; type: string }>;
    agenticSystemsUsed: string[];
    aiProviderUsed: string;
    processingTimeMs: number;
  };
  error?: string;
}

/**
 * POST /api/notes/generate
 * Generate notes on a topic using Agentic Intelligence
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await requireSession();
    const userId = session.id;

    const body: GenerateNotesRequest = await request.json();

    // Validate required fields
    if (!body.topic || !body.brevityLevel) {
      return NextResponse.json<GenerateNotesResponse>({
        success: false,
        error: 'Topic and brevity level are required',
      }, { status: 400 });
    }

    // Rate limit check
    const rateLimit = await checkRateLimit(userId, RATE_LIMITS.notesGen);
    if (!rateLimit.success) {
      return NextResponse.json<GenerateNotesResponse>(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter || 60) } }
      );
    }

    // Check entitlement (free: 2 notes/day)
    const access = await checkAccess(userId, 'notes_generate');
    if (!access.allowed) {
      return NextResponse.json<GenerateNotesResponse>(
        { success: false, error: access.reason },
        { status: 403 }
      );
    }

    // Normalize topic to KG node (best-effort enrichment)
    let resolvedSubject = body.subject;
    try {
      const normalized = await normalizeUPSCInput(body.topic);
      resolvedSubject = body.subject || normalized.subject as any;
    } catch (e) {
      console.warn('Normalizer failed, using raw input:', e);
    }

    // Generate notes using Agentic Intelligence
    const notesGenerator = getAgenticNotesGenerator();

    const options: NotesGenerationOptions = {
      topic: body.topic,
      subject: resolvedSubject,
      brevityLevel: body.brevityLevel,
      includeCurrentAffairs: body.includeCurrentAffairs ?? true,
      includeStaticMaterials: body.includeStaticMaterials ?? true,
      includeDiagrams: body.includeDiagrams ?? false,
      includeVideoSummary: body.includeVideoSummary ?? false,
      userId,
    };

    const generatedNotes = await notesGenerator.generateNotes(options);

    // Save to database (if authenticated)
    if (userId !== 'anonymous') {
      try {
        const supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data, error } = await supabase
          .from('user_generated_notes')
          .insert({
            user_id: userId,
            topic: generatedNotes.topic,
            brevity_level: generatedNotes.brevityLevel,
            content_markdown: generatedNotes.content,
            content_html: generatedNotes.contentHtml,
            word_count: generatedNotes.wordCount,
            status: 'completed',
            agentic_sources: {
              systemsUsed: generatedNotes.agenticSystemsUsed,
              aiProvider: generatedNotes.aiProviderUsed,
              sources: generatedNotes.sources,
            },
            ai_provider_used: generatedNotes.aiProviderUsed,
            has_manim_diagrams: generatedNotes.hasDiagrams,
            has_video_summary: generatedNotes.hasVideoSummary,
            processing_completed_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (data) {
          generatedNotes.id = data.id;
        }
      } catch (dbError) {
        console.error('Failed to save notes to database:', dbError);
        // Continue anyway - notes are still returned to user
      }
    }

    // Return generated notes
    return NextResponse.json<GenerateNotesResponse>({
      success: true,
      note: {
        id: generatedNotes.id,
        topic: generatedNotes.topic,
        subject: generatedNotes.subject,
        content: generatedNotes.content,
        contentHtml: generatedNotes.contentHtml,
        wordCount: generatedNotes.wordCount,
        brevityLevel: generatedNotes.brevityLevel,
        sources: generatedNotes.sources,
        agenticSystemsUsed: generatedNotes.agenticSystemsUsed,
        aiProviderUsed: generatedNotes.aiProviderUsed,
        processingTimeMs: generatedNotes.processingTimeMs,
      },
    });

  } catch (error) {
    console.error('Notes generation error:', error);

    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json<GenerateNotesResponse>(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to generate notes';

    return NextResponse.json<GenerateNotesResponse>({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}

/**
 * GET /api/notes/generate
 * Get generation status or list of user's generated notes
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const session = await requireSession();
    const userId = session.id;

    const searchParams = request.nextUrl.searchParams;
    const noteId = searchParams.get('id');

    if (noteId) {
      // Get specific note - scoped to authenticated user
      const supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data, error } = await supabase
        .from('user_generated_notes')
        .select('*')
        .eq('id', noteId)
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Note not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, note: data });
    }

    // Get authenticated user's notes
    const supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('user_generated_notes')
      .select('id, topic, subject, brevity_level, word_count, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }

    return NextResponse.json({ success: true, notes: data });

  } catch (error) {
    console.error('Get notes error:', error);

    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to get notes' }, { status: 500 });
  }
}
