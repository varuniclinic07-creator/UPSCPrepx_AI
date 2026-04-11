/**
 * MCQ Mock Test Submit API
 * 
 * Master Prompt v8.0 - Feature F7 (READ Mode)
 * - Submit full mock test
 * - UPSC scoring (2 marks, -1/3 negative)
 * - Percentile and rank calculation
 * - Detailed performance analysis
 * - XP rewards (Gamification F13)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mockTest } from '@/lib/mcq/mock-test';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const mockSubmitSchema = z.object({
  attemptId: z.string().uuid(),
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    selectedOption: z.number().min(1).max(4),
    timeSpent: z.number().min(0),
    markedForReview: z.boolean().optional(),
  })),
});

// ============================================================================
// API HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validation = mockSubmitSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.errors },
        { status: 400 }
      );
    }

    const { attemptId, answers } = validation.data;

    // Submit mock test
    const result = await mockTest.submitMockAttempt(attemptId, { answers });
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Failed to submit mock test' },
        { status: 500 }
      );
    }

    // Get attempt details for response
    const { data: attempt } = await supabase
      .from('mcq_attempts')
      .select(`
        *,
        mock:mcq_mock_tests(
          title,
          total_marks,
          duration_min
        )
      `)
      .eq('id', attemptId)
      .single();

    if (!attempt) {
      return NextResponse.json(
        { success: false, error: 'Attempt not found' },
        { status: 404 }
      );
    }

    // Award XP (Gamification F13) - bonus for mock tests
    const xpEarned = result.netMarks > 0 
      ? Math.round(result.netMarks * 2) + Math.round(result.percentile / 2)
      : 10;
    
    await supabase.rpc('award_xp', {
      p_user_id: user.id,
      p_amount: xpEarned,
      p_source: 'mock_test',
      p_metadata: { attemptId, score: result.netMarks, percentile: result.percentile },
    });

    // Get detailed answer breakdown
    const { data: answerDetails } = await supabase
      .from('mcq_answers')
      .select(`
        *,
        question:mcq_questions(
          id,
          correct_option,
          subject,
          topic,
          difficulty
        )
      `)
      .eq('attempt_id', attemptId);

    // Calculate section-wise breakdown
    const sectionBreakdown = {
      GS: { attempted: 0, correct: 0, marks: 0 },
      CSAT: { attempted: 0, correct: 0, marks: 0 },
    };

    if (answerDetails) {
      for (const answer of answerDetails) {
        const question = (answer as any).question;
        if (!question) continue;

        const section = question.subject === 'CSAT' ? 'CSAT' : 'GS';
        sectionBreakdown[section].attempted++;
        if (answer.is_correct) {
          sectionBreakdown[section].correct++;
          sectionBreakdown[section].marks += 2;
        } else if (!answer.is_skipped) {
          sectionBreakdown[section].marks -= 0.66;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        attemptId,
        score: {
          netMarks: result.netMarks,
          totalMarks: attempt.total_marks,
          accuracy: result.accuracy,
          percentile: result.percentile,
          rank: result.rank,
        },
        breakdown: {
          correct: attempt.correct_answers,
          incorrect: attempt.incorrect_answers,
          unattempted: attempt.unattempted,
          sections: sectionBreakdown,
        },
        timeStats: {
          timeTakenSec: attempt.time_taken_sec,
          durationSec: attempt.duration_min * 60,
          avgTimePerQuestion: attempt.avg_time_per_question,
        },
        xpEarned,
        comparison: {
          avgScore: (attempt as any).mock?.avg_score || null,
          topperPercentile: 99.5,
          cutoffEstimate: 105,
        },
      },
    });
  } catch (error) {
    console.error('Mock test submit error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
