/**
 * Notes API Route - User Content Studio (Feature F4)
 * 
 * Handles CRUD operations for user notes
 * Master Prompt v8.0 - READ Mode
 * 
 * Endpoints:
 * - GET: List user notes with filters
 * - POST: Create new note
 * 
 * AI Provider: 9Router → Groq → Ollama
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { z } from 'zod';
import { getAuthUser } from '@/lib/security/auth';
import { checkSubscriptionAccess } from '@/lib/trial/subscription-checker';
import { normalizeUPSCInput } from '@/lib/agents/normalizer-agent';

export const dynamic = 'force-dynamic';

// ============================================================================
// CONFIGURATION
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const NoteSchema = z.object({
  title: z.object({
    en: z.string().min(1).max(200),
    hi: z.string().min(1).max(200).optional(),
  }),
  content: z.string().min(1),
  contentHtml: z.string().optional(),
  subject: z.enum(['GS1', 'GS2', 'GS3', 'GS4', 'Essay', 'Optional', 'General']),
  folderId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).optional(),
  isPinned: z.boolean().default(false),
  wordLimit: z.number().int().positive().optional(),
  metadata: z.object({
    source: z.string().optional(),
    linkedQuestionId: z.string().optional(),
    linkedLectureId: z.string().optional(),
  }).optional(),
});

const UpdateNoteSchema = NoteSchema.partial();

const ListNotesSchema = z.object({
  folderId: z.string().uuid().optional(),
  subject: z.enum(['GS1', 'GS2', 'GS3', 'GS4', 'Essay', 'Optional', 'General']).optional(),
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(['created_at', 'updated_at', 'title', 'word_count']).default('updated_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// GET - List Notes
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      folderId: searchParams.get('folderId') || undefined,
      subject: searchParams.get('subject') as any || undefined,
      isPinned: searchParams.get('isPinned') === 'true',
      isArchived: searchParams.get('isArchived') === 'true',
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: (searchParams.get('sortBy') as any) || 'updated_at',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
    };

    // Validate
    const validated = ListNotesSchema.parse(queryParams);

    // Subscription check for premium features
    const subscription = await checkSubscriptionAccess(authUser.id, 'content_studio');

    // Build query
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let query = supabase
      .from('user_notes')
      .select('*', { count: 'exact' })
      .eq('user_id', authUser.id);

    // Apply filters
    if (validated.folderId) {
      query = query.eq('folder_id', validated.folderId);
    }
    if (validated.subject) {
      query = query.eq('subject', validated.subject);
    }
    if (validated.isPinned !== undefined) {
      query = query.eq('is_pinned', validated.isPinned);
    }
    if (validated.isArchived !== undefined) {
      query = query.eq('is_archived', validated.isArchived);
    }
    if (validated.search) {
      // Full-text search on title and content
      query = query.or(
        `title_en.ilike.%${validated.search}%,title_hi.ilike.%${validated.search}%,content.ilike.%${validated.search}%`
      );
    }

    // Apply sorting
    const orderColumn = validated.sortBy === 'title' ? 'title_en' : validated.sortBy;
    query = query.order(orderColumn, { ascending: validated.sortOrder === 'asc' });

    // Pagination
    const from = (validated.page - 1) * validated.limit;
    const to = from + validated.limit - 1;
    query = query.range(from, to);

    // Execute
    const { data: notes, error, count } = await query;

    if (error) {
      console.error('Failed to fetch notes:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch notes' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        notes,
        pagination: {
          page: validated.page,
          limit: validated.limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / validated.limit),
        },
      },
    });
  } catch (error) {
    console.error('Notes list error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create Note
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse body
    const body = await request.json();
    const validated = NoteSchema.parse(body);

    // Subscription check
    const subscription = await checkSubscriptionAccess(authUser.id, 'content_studio');
    
    // Free tier limit: 50 notes
    if (subscription.tier !== 'premium' && subscription.tier !== 'premium_plus') {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { count } = await supabase
        .from('user_notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', authUser.id)
        .eq('is_archived', false);

      if ((count || 0) >= 50) {
        return NextResponse.json(
          {
            success: false,
            error: 'Free tier limit reached. Upgrade to Premium for unlimited notes.',
            upgradeRequired: true,
          },
          { status: 403 }
        );
      }
    }

    // Best-effort KG normalization for the note's subject + title
    let normalizedNodeId: string | undefined;
    try {
      const normalized = await normalizeUPSCInput(`${validated.subject} ${validated.title.en}`);
      normalizedNodeId = normalized?.nodeId ?? undefined;
    } catch { /* best-effort */ }

    // Calculate word count
    const wordCount = validated.content.split(/\s+/).filter(w => w.length > 0).length;
    const characterCount = validated.content.length;

    // Create note
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: note, error } = await supabase
      .from('user_notes')
      .insert({
        user_id: authUser.id,
        title_en: validated.title.en,
        title_hi: validated.title.hi || validated.title.en,
        content: validated.content,
        content_html: validated.contentHtml || null,
        subject: validated.subject,
        folder_id: validated.folderId,
        tags: validated.tags || [],
        is_pinned: validated.isPinned,
        word_count: wordCount,
        character_count: characterCount,
        word_limit: validated.wordLimit || null,
        metadata: validated.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create note:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create note' },
        { status: 500 }
      );
    }

    // Award XP for creating note (Gamification F13)
    try {
      await supabase.rpc('award_xp', {
        p_user_id: authUser.id,
        p_xp_amount: 10,
        p_reason: 'note_created',
      });
    } catch (xpError) {
      console.warn('Failed to award XP:', xpError);
    }

    return NextResponse.json({
      success: true,
      data: note,
      message: 'Note created successfully',
    });
  } catch (error) {
    console.error('Create note error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
