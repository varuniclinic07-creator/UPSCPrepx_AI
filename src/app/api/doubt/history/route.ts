/**
 * GET /api/doubt/history
 * 
 * Master Prompt v8.0 - Feature F5 (READ Mode)
 * - Get user's doubt history with pagination
 * - Filter by subject, status, date range
 * - Search by keyword
 * - Bookmark management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { doubtService } from '@/lib/doubt/doubt-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// ============================================================================
// QUERY SCHEMA
// ============================================================================

const historyQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  subject: z.enum(['GS1', 'GS2', 'GS3', 'GS4', 'Essay', 'Optional', 'CSAT', 'General']).optional(),
  status: z.enum(['open', 'answered', 'resolved', 'flagged']).optional(),
  search: z.string().max(100).optional(),
  bookmarked: z.coerce.boolean().optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
});

// ============================================================================
// GET HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const validation = historyQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid query parameters',
          details: validation.error.issues 
        },
        { status: 400 }
      );
    }

    const query = validation.data;

    // Get doubt history
    const result = await doubtService.getHistory(user.id, {
      page: query.page,
      limit: query.limit,
      subject: query.subject,
      status: query.status,
      search: query.search,
    });

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // Filter by bookmarked if requested
    let threads = result.threads;
    if (query.bookmarked) {
      threads = threads.filter(t => t.is_bookmarked);
    }

    // Filter by date range if provided
    if (query.from_date) {
      const fromDate = new Date(query.from_date);
      threads = threads.filter(t => new Date(t.created_at) >= fromDate);
    }

    if (query.to_date) {
      const toDate = new Date(query.to_date);
      threads = threads.filter(t => new Date(t.created_at) <= toDate);
    }

    // Get usage stats
    const usage = await doubtService.getUserUsage(user.id);

    // Build response
    const response = {
      success: true,
      data: {
        threads: threads.map(t => ({
          ...t,
          // Include preview of first question
          preview: t.title_en,
        })),
        pagination: {
          page: query.page,
          limit: query.limit,
          total: threads.length,
          hasMore: threads.length === query.limit,
        },
        usage: {
          remainingDoubts: usage.limit_remaining,
          totalDoubtsThisMonth: usage.total_doubts,
          month: usage.month,
        },
        filters: {
          subject: query.subject,
          status: query.status,
          bookmarked: query.bookmarked,
          search: query.search,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get history API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get history' 
      },
      { status: 500 }
    );
  }
}
