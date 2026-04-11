/**
 * Current Affairs MCQ API
 * 
 * GET /api/ca/mcq/[articleId]
 * Returns MCQs for a specific article with user attempt tracking
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

const submitAnswerSchema = z.object({
  answers: z.record(z.string(), z.enum(['A', 'B', 'C', 'D'])), // mcqId -> answer
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get MCQs for article
 */
async function getMCQs(articleId: string) {
  const { data, error } = await getSupabase()
    .from('ca_mcqs')
    .select('*')
    .eq('article_id', articleId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch MCQs:', error);
    return [];
  }

  return data || [];
}

/**
 * Get user's previous attempts for MCQs
 */
async function getUserAttempts(mcqIds: string[], userId: string) {
  const { data } = await getSupabase()
    .from('ca_user_quiz_attempts')
    .select('mcq_id, selected_answer, is_correct, attempted_at')
    .in('mcq_id', mcqIds)
    .eq('user_id', userId)
    .order('attempted_at', { ascending: false });

  if (!data) return new Map();

  // Keep only latest attempt per MCQ
  const latestAttempts = new Map<string, any>();
  for (const attempt of data) {
    if (!latestAttempts.has(attempt.mcq_id)) {
      latestAttempts.set(attempt.mcq_id, attempt);
    }
  }

  return latestAttempts;
}

/**
 * Transform MCQ for response
 */
function transformMCQ(mcq: any, userAttempt?: any) {
  const options = JSON.parse(mcq.options);
  
  return {
    id: mcq.id,
    question: {
      en: mcq.question,
      hi: mcq.question_hindi,
    },
    options: options.map((opt: any, index: number) => ({
      id: String.fromCharCode(65 + index), // A, B, C, D
      text: {
        en: opt.text,
        hi: opt.text_hindi,
      },
    })),
    correctAnswer: String.fromCharCode(65 + mcq.correct_answer), // A, B, C, D
    explanation: {
      en: mcq.explanation,
      hi: mcq.explanation_hindi,
    },
    difficulty: mcq.difficulty,
    bloomTaxonomy: mcq.bloom_taxonomy,
    userAttempt: userAttempt ? {
      selectedAnswer: userAttempt.selected_answer,
      isCorrect: userAttempt.is_correct,
      attemptedAt: userAttempt.attempted_at,
    } : null,
  };
}

/**
 * Save user's quiz attempt
 */
async function saveQuizAttempt(
  mcqId: string,
  userId: string,
  selectedAnswer: string,
  isCorrect: boolean
) {
  const { error } = await getSupabase()
    .from('ca_user_quiz_attempts')
    .insert({
      mcq_id: mcqId,
      user_id: userId,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
      attempted_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Failed to save quiz attempt:', error);
    throw error;
  }
}

/**
 * Update user stats
 */
async function updateUserStats(userId: string, isCorrect: boolean) {
  // Get or create user stats
  const { data: stats } = await getSupabase()
    .from('user_progress')
    .select('ca_mcqs_correct, ca_mcqs_incorrect')
    .eq('user_id', userId)
    .single();

  if (stats) {
    await getSupabase()
      .from('user_progress')
      .update({
        ca_mcqs_correct: stats.ca_mcqs_correct + (isCorrect ? 1 : 0),
        ca_mcqs_incorrect: stats.ca_mcqs_incorrect + (isCorrect ? 0 : 1),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  } else {
    await getSupabase()
      .from('user_progress')
      .insert({
        user_id: userId,
        ca_mcqs_correct: isCorrect ? 1 : 0,
        ca_mcqs_incorrect: isCorrect ? 0 : 1,
      });
  }
}

// ============================================================================
// GET HANDLER
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { articleId: string } }
) {
  const startTime = Date.now();
  const articleId = params.articleId;

  try {
    // Get user from auth header (optional)
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await getSupabase().auth.getUser(token);
      userId = user?.id || null;
    }

    // Fetch MCQs
    const mcqs = await getMCQs(articleId);

    if (mcqs.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: {
            articleId,
            mcqs: [],
            totalMcqs: 0,
            message: 'No MCQs available for this article yet.',
          },
        },
        { status: 200 }
      );
    }

    // Get user attempts if authenticated
    let userAttempts = new Map();
    if (userId) {
      userAttempts = await getUserAttempts(mcqs.map(m => m.id), userId);
    }

    // Transform MCQs
    const transformedMcqs = mcqs.map(mcq => {
      const attempt = userId ? userAttempts.get(mcq.id) : null;
      return transformMCQ(mcq, attempt);
    });

    // Prepare response
    const response = {
      success: true,
      data: {
        articleId,
        mcqs: transformedMcqs,
        totalMcqs: transformedMcqs.length,
        userStats: userId ? {
          attempted: userAttempts.size,
          correct: Array.from(userAttempts.values()).filter(a => a.is_correct).length,
        } : null,
      },
      meta: {
        processingTime: Date.now() - startTime,
        isAuthenticated: userId !== null,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('MCQ API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch MCQs',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST HANDLER (Submit Answers)
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { articleId: string } }
) {
  const startTime = Date.now();
  const articleId = params.articleId;

  try {
    // Get user from auth header (required for submission)
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await getSupabase().auth.getUser(token);
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid authentication',
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validation = submitAnswerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { answers } = validation.data; // { mcqId: 'A', mcqId2: 'B', ... }

    // Get correct answers
    const mcqIds = Object.keys(answers);
    const mcqs = await getMCQs(articleId);
    const mcqMap = new Map(mcqs.map(mcq => [mcq.id, mcq]));

    // Process each answer
    const results = [];
    let correctCount = 0;

    for (const [mcqId, selectedAnswer] of Object.entries(answers)) {
      const mcq = mcqMap.get(mcqId);
      
      if (!mcq) {
        results.push({
          mcqId,
          error: 'MCQ not found',
        });
        continue;
      }

      const correctAnswer = String.fromCharCode(65 + mcq.correct_answer);
      const isCorrect = selectedAnswer === correctAnswer;

      // Save attempt
      await saveQuizAttempt(mcqId, userId, selectedAnswer, isCorrect);
      
      // Update user stats
      await updateUserStats(userId, isCorrect);

      results.push({
        mcqId,
        selectedAnswer,
        correctAnswer,
        isCorrect,
        explanation: {
          en: mcq.explanation,
          hi: mcq.explanation_hindi,
        },
      });

      if (isCorrect) {
        correctCount++;
      }
    }

    // Prepare response
    const response = {
      success: true,
      data: {
        articleId,
        results,
        score: {
          correct: correctCount,
          total: Object.keys(answers).length,
          percentage: Math.round((correctCount / Object.keys(answers).length) * 100),
        },
      },
      meta: {
        processingTime: Date.now() - startTime,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('MCQ submit API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit answers',
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
