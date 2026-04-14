/**
 * Daily Current Affairs API - Get Today's Digest
 * 
 * GET /api/ca/daily?date=YYYY-MM-DD
 * Returns daily digest with articles, syllabus mapping, and MCQs
 * 
 * Master Prompt v8.0 - Feature F2 (READ Mode)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

let _sb: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() { if (!_sb) _sb = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!); return _sb; }

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const queryParamsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get user subscription status
 */
async function getUserSubscription(userId: string) {
  const { data } = await getSupabase()
    .from('user_subscriptions')
    .select('status, plan_id, trial_ends_at, current_period_end')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return data;
}

/**
 * Check if user has access to current affairs
 */
function hasAccess(subscription: any): boolean {
  if (!subscription) return false;
  
  // Free users get access to current affairs (it's a core feature)
  // Premium features: PDF download, advanced filters, unlimited MCQs
  return true;
}

/**
 * Get digest for a specific date
 */
async function getDigest(date: string) {
  const { data, error } = await getSupabase()
    .from('daily_ca_digest')
    .select(`
      *,
      articles:ca_articles(
        id,
        title,
        title_hindi,
        summary,
        summary_hindi,
        url,
        image_url,
        category,
        importance,
        word_count,
        read_time_min,
        published_at,
        syllabus_mappings:ca_syllabus_mapping(
          subject,
          topic,
          relevance_score
        ),
        mcq_count:ca_mcqs(count)
      )
    `)
    .eq('date', date)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Failed to fetch digest:', error);
    return null;
  }

  return data;
}

/**
 * Get latest published digest (if no date specified)
 */
async function getLatestDigest() {
  const { data, error } = await getSupabase()
    .from('daily_ca_digest')
    .select(`
      *,
      articles:ca_articles(
        id,
        title,
        title_hindi,
        summary,
        summary_hindi,
        url,
        image_url,
        category,
        importance,
        word_count,
        read_time_min,
        published_at,
        syllabus_mappings:ca_syllabus_mapping(
          subject,
          topic,
          relevance_score
        ),
        mcq_count:ca_mcqs(count)
      )
    `)
    .eq('is_published', true)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Failed to fetch latest digest:', error);
    return null;
  }

  return data;
}

/**
 * Calculate subject distribution from articles
 */
function calculateSubjectDistribution(articles: any[]) {
  const distribution = {
    GS1: 0,
    GS2: 0,
    GS3: 0,
    GS4: 0,
    Essay: 0,
  };

  articles.forEach(article => {
    if (article.syllabus_mappings) {
      article.syllabus_mappings.forEach((mapping: any) => {
        if (mapping.subject in distribution) {
          distribution[mapping.subject as keyof typeof distribution]++;
        }
      });
    }
  });

  return distribution;
}

/**
 * Transform article data for response
 */
function transformArticle(article: any) {
  return {
    id: article.id,
    title: {
      en: article.title,
      hi: article.title_hindi,
    },
    summary: {
      en: article.summary,
      hi: article.summary_hindi,
    },
    url: article.url,
    imageUrl: article.image_url,
    category: article.category,
    importance: article.importance,
    wordCount: article.word_count,
    readTimeMin: article.read_time_min,
    publishedAt: article.published_at,
    syllabus: article.syllabus_mappings?.map((m: any) => ({
      subject: m.subject,
      topic: m.topic,
      relevanceScore: m.relevance_score,
    })) || [],
    mcqCount: Array.isArray(article.mcq_count) ? article.mcq_count[0]?.count || 0 : 0,
  };
}

// ============================================================================
// GET HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Validate date
    const validation = queryParamsSchema.safeParse({ date });
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD',
        },
        { status: 400 }
      );
    }

    // Get user from auth header (optional for public access)
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;
    let subscription: any = null;

    if (authHeader) {
      // Extract user ID from token (simplified - in production use proper JWT verification)
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await getSupabase().auth.getUser(token);
      userId = user?.id || null;

      if (userId) {
        subscription = await getUserSubscription(userId);
      }
    }

    // Check access (current affairs is free for all users)
    // Premium features: PDF download, unlimited MCQs, advanced filters
    const isPremium = subscription?.plan_id === 'premium' || subscription?.plan_id === 'premium_plus';

    // Fetch digest
    let digest;
    if (date === new Date().toISOString().split('T')[0]) {
      // Today's digest
      digest = await getLatestDigest();
    } else {
      // Historical digest
      digest = await getDigest(date);
    }

    if (!digest) {
      return NextResponse.json(
        {
          success: true,
          data: {
            date,
            title: `Daily Current Affairs - ${new Date(date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}`,
            articles: [],
            totalArticles: 0,
            subjectDistribution: { GS1: 0, GS2: 0, GS3: 0, GS4: 0, Essay: 0 },
            isPublished: false,
            message: 'No digest available for this date. Check back later.',
          },
        },
        { status: 200 }
      );
    }

    // Transform articles
    const articles = (digest.articles || []).map(transformArticle);

    // Sort by importance (highest first)
    articles.sort((a: any, b: any) => b.importance - a.importance);

    // Calculate subject distribution
    const subjectDistribution = calculateSubjectDistribution(articles);

    // Prepare response
    const response = {
      success: true,
      data: {
        digestId: digest.id,
        date: digest.date,
        title: digest.title,
        summary: digest.summary,
        articles,
        totalArticles: articles.length,
        subjectDistribution,
        isPublished: digest.is_published,
        publishedAt: digest.published_at,
        pdfUrl: isPremium ? digest.pdf_url : null, // Premium feature
        generationTime: digest.generated_at,
      },
      meta: {
        processingTime: Date.now() - startTime,
        isPremium,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Daily CA API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch daily current affairs',
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
