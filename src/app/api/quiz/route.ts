import { NextResponse } from 'next/server';
import { getUserQuizzes, getUserQuizStats } from '@/lib/services/quiz-service';
import { requireUser } from '@/lib/auth/auth-config';

export const dynamic = 'force-dynamic';

/**
 * GET /api/quiz
 * Get all quizzes for the authenticated user
 */
export async function GET() {
  try {
    // Authenticate user
    const user = await requireUser();

    // Get user's quizzes and stats
    const [quizzes, stats] = await Promise.all([
      getUserQuizzes(user.id),
      getUserQuizStats(user.id),
    ]);

    return NextResponse.json({
      success: true,
      quizzes,
      stats,
      count: quizzes.length,
    });
  } catch (error) {
    console.error('[API] Quiz list error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Please login to view quizzes' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch quizzes' },
      { status: 500 }
    );
  }
}