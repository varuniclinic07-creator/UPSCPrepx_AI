/**
 * Current Affairs Archive API
 * 
 * GET /api/ca/archive?from=YYYY-MM-DD&to=YYYY-MM-DD&subject=GS1|GS2|GS3|GS4|Essay
 * Returns historical digests with filtering
 * 
 * Master Prompt v8.0 - Feature F2 (READ Mode)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

let _sb: ReturnType<typeof createClient> | null = null;
function getSupabase() { if (!_sb) _sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!); return _sb; }

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const queryParamsSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  subject: z.enum(['GS1', 'GS2', 'GS3', 'GS4', 'Essay']).optional(),
  category: z.string().optional(),
  importance: z.string().regex(/^[1-5]$/, 'Importance must be 1-5').optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get digests with filters
 */
async function getDigests(filters: {
  from?: string;
  to?: string;
  subject?: string;
  page: number;
  limit: number;
}) {
  let query = supabase
    .from('daily_ca_digest')
    .select(`
      *,
      article_count,
      summary,
      pdf_url,
      published_at
    `,
    { count: 'exact' }
  )
    .eq('is_published', true);

  // Date filters
  if (filters.from) {
    query = query.gte('date', filters.from);
  }
  if (filters.to) {
    query = query.lte('date', filters.to);
  }

  // Pagination
  const offset = (filters.page - 1) * filters.limit;
  query = query
    .order('date', { ascending: false })
    .range(offset, offset + filters.limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Failed to fetch digests:', error);
    return { data: null, count: 0 };
  }

  // Get article counts and subject distribution for each digest
  const digestsWithDetails = await Promise.all(
    (data || []).map(async digest => {
      // Get subject distribution
      const { data: articles } = await getSupabase()
        .from('ca_articles')
        .select(`
          id,
          syllabus_mappings:ca_syllabus_mapping(subject)
        `)
        .eq('digest_id', digest.id)
        .eq('is_published', true);

      const distribution = {
        GS1: 0,
        GS2: 0,
        GS3: 0,
        GS4: 0,
        Essay: 0,
      };

      articles?.forEach(article => {
        article.syllabus_mappings?.forEach((m: any) => {
          if (m.subject in distribution) {
            distribution[m.subject as keyof typeof distribution]++;
          }
        });
      });

      return {
        ...digest,
        subjectDistribution: distribution,
      };
    })
  );

  return { data: digestsWithDetails, count: count || 0 };
}

/**
 * Get digests filtered by subject
 */
async function getDigestsBySubject(subject: string, filters: {
  from?: string;
  to?: string;
  page: number;
  limit: number;
}) {
  // Find articles with this subject mapping
  const { data: articleMappings } = await getSupabase()
    .from('ca_syllabus_mapping')
    .select('article_id, digest_id:ca_articles(digest_id)')
    .eq('subject', subject);

  if (!articleMappings || articleMappings.length === 0) {
    return { data: [], count: 0 };
  }

  const digestIds = [...new Set(articleMappings.map(m => m.digest_id))];

  let query = supabase
    .from('daily_ca_digest')
    .select('*', { count: 'exact' })
    .in('id', digestIds)
    .eq('is_published', true);

  // Date filters
  if (filters.from) {
    query = query.gte('date', filters.from);
  }
  if (filters.to) {
    query = query.lte('date', filters.to);
  }

  // Pagination
  const offset = (filters.page - 1) * filters.limit;
  query = query
    .order('date', { ascending: false })
    .range(offset, offset + filters.limit - 1);

  const { data, count } = await query;

  return { data: data || [], count: count || 0 };
}

// ============================================================================
// GET HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const params = {
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      subject: searchParams.get('subject') || undefined,
      category: searchParams.get('category') || undefined,
      importance: searchParams.get('importance') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
    };

    // Validate parameters
    const validation = queryParamsSchema.safeParse(params);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid parameters',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const page = parseInt(params.page);
    const limit = Math.min(parseInt(params.limit), 50); // Max 50 per page

    // Fetch digests
    let result;
    if (params.subject) {
      // Filter by subject
      result = await getDigestsBySubject(params.subject, {
        from: params.from,
        to: params.to,
        page,
        limit,
      });
    } else {
      // General filter
      result = await getDigests({
        from: params.from,
        to: params.to,
        subject: params.subject,
        page,
        limit,
      });
    }

    if (!result.data) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch archive',
        },
        { status: 500 }
      );
    }

    // Calculate total pages
    const totalPages = Math.ceil(result.count / limit);

    // Prepare response
    const response = {
      success: true,
      data: {
        digests: result.data.map(digest => ({
          digestId: digest.id,
          date: digest.date,
          title: digest.title,
          summary: digest.summary,
          articleCount: digest.article_count,
          subjectDistribution: digest.subjectDistribution || {
            GS1: 0,
            GS2: 0,
            GS3: 0,
            GS4: 0,
            Essay: 0,
          },
          pdfUrl: digest.pdf_url,
          publishedAt: digest.published_at,
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: result.count,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        filters: {
          from: params.from,
          to: params.to,
          subject: params.subject,
        },
      },
      meta: {
        processingTime: Date.now() - startTime,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Archive API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch archive',
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
