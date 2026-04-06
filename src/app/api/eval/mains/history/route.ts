/**
 * GET /api/eval/mains/history
 * 
 * Get user's evaluation history with filtering and pagination.
 * Master Prompt v8.0 Compliant
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getEvaluationHistory } from '@/lib/eval/mains-evaluator-service';
import { z } from 'zod';

// Query validation schema
const historySchema = z.object({
  subject: z.enum(['GS1', 'GS2', 'GS3', 'GS4', 'Essay']).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export async function GET(request: NextRequest) {
  try {
    // Step 1: Authenticate user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Step 2: Parse and validate query params
    const { searchParams } = new URL(request.url);
    const queryParams = {
      subject: searchParams.get('subject') || undefined,
      fromDate: searchParams.get('fromDate') || undefined,
      toDate: searchParams.get('toDate') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    };

    const validation = historySchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      );
    }

    const filters = validation.data;

    // Step 3: Fetch evaluation history
    const result = await getEvaluationHistory(session.user.id, {
      subject: filters.subject,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      page: filters.page,
      limit: filters.limit,
    });

    // Step 4: Return paginated results
    return NextResponse.json({
      success: true,
      data: result.evaluations,
      pagination: result.pagination,
      stats: result.stats,
    });

  } catch (error) {
    console.error('Error fetching evaluation history:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch history',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/eval/mains/history
 * 
 * Delete a specific evaluation (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if admin (simplified - use custom claims in production)
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();

    if (!userProfile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const evaluationId = searchParams.get('id');

    if (!evaluationId) {
      return NextResponse.json({ error: 'Evaluation ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('mains_evaluations')
      .delete()
      .eq('id', evaluationId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, message: 'Evaluation deleted' });

  } catch (error) {
    console.error('Error deleting evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to delete evaluation' },
      { status: 500 }
    );
  }
}
