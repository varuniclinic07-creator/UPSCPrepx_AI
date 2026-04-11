import { NextRequest, NextResponse } from 'next/server';
import { submitQuizAttempt } from '@/lib/services/quiz-service';
import { requireUser } from '@/lib/auth/auth-config';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string };
}

/**
 * POST /api/quiz/[id]/submit
 * Submit quiz answers and get results
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id: quizId } = params;

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

    // Submit quiz attempt
    const attempt = await submitQuizAttempt(quizId, user.id, answers, timeTaken);

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