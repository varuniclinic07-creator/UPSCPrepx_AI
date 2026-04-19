import { NextRequest, NextResponse } from 'next/server';
import { submitQuizAttempt } from '@/lib/services/quiz-service';
import { requireUser } from '@/lib/auth/auth-config';
import { EvaluationAgentImpl } from '@/lib/agents/core/evaluation-agent';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/quiz/[id]/submit
 * Submit quiz answers and get results
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id: quizId } = await params;

    if (!quizId) {
      return NextResponse.json(
        { error: 'Quiz ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { answers, timeTaken } = body;

    // Validate answers
    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'Answers are required and must be an object' },
        { status: 400 }
      );
    }

    // Validate time taken
    if (typeof timeTaken !== 'number' || timeTaken < 0) {
      return NextResponse.json(
        { error: 'Valid time taken is required' },
        { status: 400 }
      );
    }

    // Submit quiz attempt (legacy path — keeps existing response shape intact).
    const attempt = await submitQuizAttempt(quizId, user.id, answers, timeTaken);

    // Phase-1 C2: dual-write through Evaluation Agent so v8_user_interactions
    // and v8_user_mastery reflect this attempt. Best-effort — legacy response
    // shape stays unchanged even if v8 write fails.
    try {
      const supabase = await createServerSupabaseClient();
      const { data: quizRow } = await supabase
        .from('quizzes')
        .select('id, subject, questions')
        .eq('id', quizId)
        .maybeSingle();
      const qs = Array.isArray(quizRow?.questions) ? quizRow!.questions : [];
      // Build v8 QuizAttempt shape — pull correct answer + userAnswer per question.
      const v8Questions = qs.map((q: any) => ({
        id: String(q.id ?? q.question_id ?? ''),
        correct: String(q.correct_answer ?? q.correct ?? ''),
        userAnswer: String(answers?.[q.id] ?? answers?.[q.question_id] ?? ''),
        timeMs: Math.floor((Number(timeTaken) || 0) * 1000 / Math.max(1, qs.length)),
      })).filter((q: any) => q.id);
      if (v8Questions.length) {
        const topicId = String(quizRow?.subject ?? 'unknown').toLowerCase();
        const evaluator = new EvaluationAgentImpl({ feature: 'quiz', userId: user.id });
        await evaluator.updateMastery(user.id, {
          userId: user.id,
          quizId,
          topicId,
          questions: v8Questions,
        });
      }
    } catch (dualErr) {
      // eslint-disable-next-line no-console
      console.warn('[quiz/submit] v8 dual-write failed (legacy unaffected):', dualErr);
    }

    return NextResponse.json({
      success: true,
      attempt,
      message: attempt.passed 
        ? `Congratulations! You passed with ${attempt.percentage}%` 
        : `You scored ${attempt.percentage}%. Keep practicing!`,
    });
  } catch (error) {
    console.error('[API] Quiz submit error:', error);

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Please login to submit quiz' },
          { status: 401 }
        );
      }

      if (error.message === 'Quiz not found') {
        return NextResponse.json(
          { error: 'Quiz not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to submit quiz. Please try again.' },
      { status: 500 }
    );
  }
}