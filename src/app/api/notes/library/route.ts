/**
 * BMAD Phase 4: Feature 10 - Notes Library API
 * GET /api/notes/library - Browse ready-to-use notes (like Unacademy)
 * POST /api/notes/library - Create new library notes (admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { normalizeUPSCInput } from '@/lib/agents/normalizer-agent';

export const dynamic = 'force-dynamic';

export interface LibraryNotesQuery {
  subject?: string;
  topic?: string;
  brevityLevel?: string;
  isPremium?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface LibraryNotesResponse {
  success: boolean;
  notes?: Array<{
    id: string;
    title: string;
    topic: string;
    subject: string;
    brevityLevel: string;
    wordCount: number;
    viewsCount: number;
    downloadsCount: number;
    likesCount: number;
    isPremium: boolean;
    thumbnailUrl?: string;
    createdAt: string;
  }>;
  total?: number;
  error?: string;
}

/**
 * GET /api/notes/library
 * Browse ready-to-use notes library (like Unacademy)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const query: LibraryNotesQuery = {
      subject: searchParams.get('subject') || undefined,
      topic: searchParams.get('topic') || undefined,
      brevityLevel: searchParams.get('brevityLevel') || undefined,
      isPremium: searchParams.get('isPremium') ? searchParams.get('isPremium') === 'true' : undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    // Best-effort UPSC input normalization
    let normalized = null;
    try {
      normalized = query.topic ? await normalizeUPSCInput(query.topic) : null;
    } catch (e) { /* non-blocking enrichment */ }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Build query
    let dbQuery = supabase
      .from('notes_library')
      .select('*, notes_tags(tag)', {
        count: 'exact',
      })
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    // Apply filters
    if (query.subject) {
      dbQuery = dbQuery.eq('subject', query.subject);
    }

    if (query.brevityLevel) {
      dbQuery = dbQuery.eq('brevity_level', query.brevityLevel);
    }

    if (query.isPremium !== undefined) {
      dbQuery = dbQuery.eq('is_premium', query.isPremium);
    }

    if (query.topic) {
      dbQuery = dbQuery.ilike('topic', `%${query.topic}%`);
    }

    if (query.search) {
      // Full-text search on topic and content
      dbQuery = dbQuery.or(`topic.ilike.%${query.search}%,content_markdown.ilike.%${query.search}%`);
    }

    // Pagination
    const from = (query.page! - 1) * query.limit!;
    const to = from + query.limit! - 1;
    dbQuery = dbQuery.range(from, to);

    const { data, error, count } = await dbQuery;

    if (error) {
      console.error('Notes library query error:', error);
      return NextResponse.json<LibraryNotesResponse>({
        success: false,
        error: 'Failed to fetch notes',
      }, { status: 500 });
    }

    // Format response
    const notes = (data || []).map((note: any) => ({
      id: note.id,
      title: note.title,
      topic: note.topic,
      subject: note.subject,
      brevityLevel: note.brevity_level,
      wordCount: note.word_count,
      viewsCount: note.views_count,
      downloadsCount: note.downloads_count,
      likesCount: note.likes_count,
      isPremium: note.is_premium,
      thumbnailUrl: note.thumbnail_url,
      createdAt: note.created_at,
      tags: note.notes_tags?.map((t: any) => t.tag) || [],
    }));

    return NextResponse.json<LibraryNotesResponse>({
      success: true,
      notes,
      total: count || 0,
    });

  } catch (error) {
    console.error('Notes library error:', error);
    return NextResponse.json<LibraryNotesResponse>({
      success: false,
      error: 'Failed to fetch notes library',
    }, { status: 500 });
  }
}

/**
 * POST /api/notes/library
 * Create new library note (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['title', 'topic', 'subject', 'content_markdown'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Insert note
    const { data, error } = await supabase
      .from('notes_library')
      .insert({
        title: body.title,
        topic: body.topic,
        subject: body.subject,
        sub_subject: body.sub_subject,
        content_markdown: body.content_markdown,
        content_html: body.content_html,
        brevity_level: body.brevity_level || 'comprehensive',
        word_count: body.word_count,
        is_premium: body.is_premium || false,
        is_published: body.is_published ?? true,
        has_manim_diagrams: body.has_manim_diagrams || false,
        has_video_summary: body.has_video_summary || false,
        thumbnail_url: body.thumbnail_url,
      })
      .select()
      .single();

    if (error) {
      console.error('Insert note error:', error);
      return NextResponse.json(
        { error: 'Failed to create note', details: error.message },
        { status: 500 }
      );
    }

    // Insert tags if provided
    if (body.tags && Array.isArray(body.tags) && body.tags.length > 0) {
      const tagInserts = body.tags.map((tag: string) => ({
        note_id: data.id,
        tag,
      }));

      await supabase.from('notes_tags').insert(tagInserts);
    }

    // Insert sources if provided
    if (body.sources && Array.isArray(body.sources) && body.sources.length > 0) {
      const sourceInserts = body.sources.map((source: any) => ({
        note_id: data.id,
        source_name: source.name,
        source_url: source.url,
        source_type: source.type,
      }));

      await supabase.from('notes_sources').insert(sourceInserts);
    }

    // Insert syllabus mapping if provided
    if (body.syllabus_mapping && Array.isArray(body.syllabus_mapping)) {
      const mappingInserts = body.syllabus_mapping.map((mapping: any) => ({
        note_id: data.id,
        syllabus_code: mapping.code,
        syllabus_topic: mapping.topic,
      }));

      await supabase.from('notes_syllabus_mapping').insert(mappingInserts);
    }

    return NextResponse.json({
      success: true,
      note: data,
    });

  } catch (error) {
    console.error('Create note error:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}
