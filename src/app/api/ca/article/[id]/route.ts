/**
 * Current Affairs Article Detail API
 * 
 * GET /api/ca/article/[id]
 * Returns single article with full content, syllabus mapping, related notes
 * 
 * Master Prompt v8.0 - Feature F2 (READ Mode)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

let _sb: ReturnType<typeof createClient> | null = null;
function getSupabase() { if (!_sb) _sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!); return _sb; }

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get article by ID with all related data
 */
async function getArticle(articleId: string) {
  const { data, error } = await getSupabase()
    .from('ca_articles')
    .select(`
      *,
      digest:daily_ca_digest(
        id,
        date,
        title
      ),
      source:ca_sources(
        id,
        name,
        category
      ),
      syllabus_mappings:ca_syllabus_mapping(
        id,
        subject,
        topic,
        relevance_score
      ),
      related_notes:content_library(
        id,
        title,
        syllabus_node_id
      )
    `)
    .eq('id', articleId)
    .eq('is_published', true)
    .single();

  if (error) {
    console.error('Failed to fetch article:', error);
    return null;
  }

  return data;
}

/**
 * Get MCQs for article
 */
async function getArticleMCQs(articleId: string) {
  const { data, error } = await getSupabase()
    .from('ca_mcqs')
    .select('*')
    .eq('article_id', articleId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch MCQs:', error);
    return [];
  }

  return data || [];
}

/**
 * Find related notes based on syllabus mapping
 */
async function findRelatedNotes(syllabusMappings: any[]) {
  if (!syllabusMappings || syllabusMappings.length === 0) {
    return [];
  }

  const syllabusNodeIds = syllabusMappings
    .map(m => m.syllabus_node_id)
    .filter((id): id is string => id !== null);

  if (syllabusNodeIds.length === 0) {
    return [];
  }

  const { data } = await getSupabase()
    .from('content_library')
    .select('id, title, summary, syllabus_node_id')
    .in('syllabus_node_id', syllabusNodeIds)
    .eq('status', 'published')
    .limit(5);

  return data || [];
}

/**
 * Track article read
 */
async function trackArticleRead(articleId: string, userId: string | null) {
  if (!userId) return; // Don't track anonymous reads

  try {
    await getSupabase()
      .from('ca_user_reads')
      .insert({
        article_id: articleId,
        user_id: userId,
        read_at: new Date().toISOString(),
      });
  } catch (error) {
    console.error('Failed to track article read:', error);
    // Don't fail the request for tracking errors
  }
}

/**
 * Transform article for response
 */
function transformArticle(article: any) {
  return {
    id: article.id,
    digest: {
      id: article.digest?.id,
      date: article.digest?.date,
      title: article.digest?.title,
    },
    source: {
      id: article.source?.id,
      name: article.source?.name,
      category: article.source?.category,
    },
    title: {
      en: article.title,
      hi: article.title_hindi,
    },
    summary: {
      en: article.summary,
      hi: article.summary_hindi,
    },
    fullContent: article.full_content,
    url: article.url,
    imageUrl: article.image_url,
    category: article.category,
    importance: article.importance,
    wordCount: article.word_count,
    readTimeMin: article.read_time_min,
    publishedAt: article.published_at,
    syllabus: article.syllabus_mappings?.map((m: any) => ({
      id: m.id,
      subject: m.subject,
      topic: m.topic,
      relevanceScore: m.relevance_score,
    })) || [],
  };
}

/**
 * Transform MCQ for response
 */
function transformMCQ(mcq: any) {
  return {
    id: mcq.id,
    question: {
      en: mcq.question,
      hi: mcq.question_hindi,
    },
    options: JSON.parse(mcq.options).map((opt: any, index: number) => ({
      id: String.fromCharCode(65 + index), // A, B, C, D
      text: {
        en: opt.text,
        hi: opt.text_hindi,
      },
      isCorrect: opt.is_correct,
    })),
    correctAnswer: String.fromCharCode(65 + mcq.correct_answer), // A, B, C, D
    explanation: {
      en: mcq.explanation,
      hi: mcq.explanation_hindi,
    },
    difficulty: mcq.difficulty,
    bloomTaxonomy: mcq.bloom_taxonomy,
  };
}

// ============================================================================
// GET HANDLER
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id: articleId } = await params;

  try {
    // Get user from auth header (optional)
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await getSupabase().auth.getUser(token);
      userId = user?.id || null;
    }

    // Fetch article
    const article = await getArticle(articleId);

    if (!article) {
      return NextResponse.json(
        {
          success: false,
          error: 'Article not found',
        },
        { status: 404 }
      );
    }

    // Fetch MCQs
    const mcqs = await getArticleMCQs(articleId);

    // Find related notes
    const relatedNotes = await findRelatedNotes(article.syllabus_mappings || []);

    // Track read (if authenticated)
    await trackArticleRead(articleId, userId);

    // Prepare response
    const response = {
      success: true,
      data: {
        article: transformArticle(article),
        mcqs: mcqs.map(transformMCQ),
        mcqCount: mcqs.length,
        relatedNotes: relatedNotes.map((note: any) => ({
          id: note.id,
          title: note.title,
          summary: note.summary,
        })),
        readTimeMin: article.read_time_min,
        wordCount: article.word_count,
      },
      meta: {
        processingTime: Date.now() - startTime,
        isAuthenticated: userId !== null,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Article detail API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch article',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// CORS HEADERS
// ============================================================================

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
