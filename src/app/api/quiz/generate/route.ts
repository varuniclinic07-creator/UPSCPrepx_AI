import { NextRequest, NextResponse } from 'next/server';
import { generateQuiz } from '@/lib/services/quiz-service';
import { requireUser, canAccessFeature } from '@/lib/auth/auth-config';
import { getRateLimitHeaders, checkRateLimit } from '@/lib/ai/rate-limiter';
import { SUBJECTS } from '@/types';
import { errors } from '@/lib/security/error-sanitizer';

export const dynamic = 'force-dynamic';

/**
 * POST /api/quiz/generate
 * Generate AI-powered UPSC quiz on a topic
 * SECURITY: Uses centralized validation and error handling
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireUser();

    // Check subscription access
    if (!canAccessFeature(user, 'trial')) {
      return errors.forbidden();
    }

    // Check rate limit (use 'a4f' as default provider)
    const rateLimitResult = await checkRateLimit('a4f', user.id);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please wait before generating more quizzes.',
          retryAfter: rateLimitResult.retryAfter
        },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult)
        }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate topic
    if (!body.topic || typeof body.topic !== 'string' || body.topic.trim().length < 3) {
      return errors.validation([{ field: 'topic', message: 'Topic is required and must be at least 3 characters' }]);
    }

    // Validate subject
    if (!body.subject || !SUBJECTS.includes(body.subject)) {
      return errors.validation([{ field: 'subject', message: 'Valid subject is required' }]);
    }

    // Validate question count
    const validQuestionCounts = [5, 10, 15, 20, 25];
    const count = body.questionCount || 10;
    if (!validQuestionCounts.includes(count)) {
      return errors.validation([{ field: 'questionCount', message: 'Invalid question count (5, 10, 15, 20, 25)' }]);
    }

    // Validate difficulty
    const validDifficulties = ['easy', 'medium', 'hard', 'mixed'];
    if (body.difficulty && !validDifficulties.includes(body.difficulty)) {
      return errors.validation([{ field: 'difficulty', message: 'Invalid difficulty' }]);
    }

    // Generate quiz
    const quiz = await generateQuiz({
      topic: body.topic.trim().slice(0, 200), // Limit length
      subject: body.subject,
      userId: user.id,
      questionCount: count,
      difficulty: body.difficulty || 'mixed',
    });

    return NextResponse.json(
      {
        success: true,
        quiz,
        message: 'Quiz generated successfully'
      },
      {
        status: 201,
        headers: getRateLimitHeaders(rateLimitResult)
      }
    );
  } catch (error) {
    // Log error server-side only, return generic message
    console.error('[API] Quiz generate error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return errors.unauthorized();
    }

    // Generic error - no internal details exposed
    return errors.internal(error);
  }
}