/**
 * GET /api/eval/mains/[id]
 * 
 * Get single evaluation by ID with full details.
 * Master Prompt v8.0 Compliant
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEvaluationById } from '@/lib/eval/mains-evaluator-service';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Step 1: Authenticate user
    const supabase = await createClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: evaluationId } = await params;

    if (!evaluationId) {
      return NextResponse.json(
        { error: 'Evaluation ID required' },
        { status: 400 }
      );
    }

    // Step 2: Fetch evaluation
    const evaluation = await getEvaluationById(evaluationId);

    if (!evaluation) {
      return NextResponse.json(
        { error: 'Evaluation not found' },
        { status: 404 }
      );
    }

    // Step 3: Verify ownership (user can only view their own evaluations)
    const { data: answer } = await supabase
      .from('mains_answers')
      .select('user_id')
      .eq('id', evaluation.answer_id)
      .single();

    if (!answer || answer.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Step 4: Return evaluation
    return NextResponse.json({
      success: true,
      data: evaluation,
    });

  } catch (error) {
    console.error('Error fetching evaluation:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch evaluation',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/eval/mains/[id]/feedback
 * 
 * Submit feedback on an evaluation
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id: evaluationId } = await params;
    const body = await request.json();

    const { rating, was_helpful, feedback_text } = body;

    // Validate rating
    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if feedback already exists
    const { data: existingFeedback } = await supabase
      .from('mains_feedback')
      .select('id')
      .eq('evaluation_id', evaluationId)
      .eq('user_id', session.user.id)
      .single();

    if (existingFeedback) {
      // Update existing feedback
      const { error } = await supabase
        .from('mains_feedback')
        .update({
          rating,
          was_helpful,
          feedback_text,
        })
        .eq('id', existingFeedback.id);

      if (error) throw error;
    } else {
      // Insert new feedback
      const { error } = await supabase
        .from('mains_feedback')
        .insert({
          evaluation_id: evaluationId,
          user_id: session.user.id,
          rating,
          was_helpful,
          feedback_text,
        });

      if (error) throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}
