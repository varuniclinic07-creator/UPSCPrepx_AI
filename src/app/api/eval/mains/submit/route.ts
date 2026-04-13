/**
 * POST /api/eval/mains/submit
 * 
 * Submit a UPSC Mains answer for AI evaluation.
 * Response time target: <60 seconds
 * 
 * Master Prompt v8.0 Compliant
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { evaluateAnswer } from '@/lib/eval/mains-evaluator-service';
import { z } from 'zod';
import { checkAccess } from '@/lib/auth/check-access';
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rate-limiter';
import { normalizeUPSCInput } from '@/lib/agents/normalizer-agent';

export const dynamic = 'force-dynamic';

// Request validation schema
const submitSchema = z.object({
  question_id: z.string().uuid('Invalid question ID'),
  answer_text: z.string().min(50, 'Answer must be at least 50 characters'),
  word_count: z.number().int().positive(),
  time_taken_sec: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
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

    // Rate limit check
    const rateLimit = await checkRateLimit(session.user.id, RATE_LIMITS.aiGenerate);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter || 60) } }
      );
    }

    // Step 2: Validate request body
    const body = await request.json();
    const validation = submitSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { question_id, answer_text, word_count, time_taken_sec } = validation.data;

    // Best-effort UPSC input normalization on answer context
    let normalized: any = null;
    try { normalized = await normalizeUPSCInput(answer_text.substring(0, 500)); } catch (_e) { /* non-blocking */ }

    // Step 3: Check entitlement (free: 1 mains eval/day)
    const access = await checkAccess(session.user.id, 'mains_eval');
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.reason, remaining: access.remaining },
        { status: 403 }
      );
    }

    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('status, plan_id')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .single();

    // Count evaluations this month for free users
    if (!subscription || subscription.plan_id === 'free') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // First get the user's answer IDs for this month
      const { data: answerIds } = await supabase
        .from('mains_answers')
        .select('id')
        .eq('user_id', session.user.id)
        .gte('created_at', startOfMonth.toISOString());

      const ids = (answerIds || []).map((a: any) => a.id);

      let count = 0;
      if (ids.length > 0) {
        const { count: evalCount } = await supabase
          .from('mains_evaluations')
          .select('*', { count: 'exact', head: true })
          .in('answer_id', ids);
        count = evalCount || 0;
      }

      if (count >= 3) {
        return NextResponse.json(
          {
            error: 'Monthly limit reached',
            message: 'Free users get 3 evaluations per month. Upgrade to Premium for unlimited.',
            upgrade_url: '/pricing',
          },
          { status: 403 }
        );
      }
    }

    // Step 4: Evaluate answer (with <60s target)
    const evaluation = await evaluateAnswer({
      question_id,
      answer_text,
      word_count,
      time_taken_sec,
      user_id: session.user.id,
    });

    const totalTime = (Date.now() - startTime) / 1000;

    // Step 5: Return evaluation
    return NextResponse.json({
      success: true,
      answer_id: evaluation.answer_id,
      evaluation: evaluation.evaluation,
      metadata: {
        evaluation_time_sec: evaluation.evaluation.evaluation_time_sec,
        total_time_sec: Math.round(totalTime * 10) / 10,
        ai_model_used: evaluation.evaluation.ai_model_used,
      },
    });

  } catch (error) {
    console.error('Error in submit evaluation:', error);

    return NextResponse.json(
      {
        error: 'Evaluation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/eval/mains/submit
 * 
 * Returns API documentation
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/eval/mains/submit',
    method: 'POST',
    description: 'Submit a UPSC Mains answer for AI evaluation',
    authentication: 'Required (Supabase Auth)',
    rate_limit: 'Free: 3/month, Premium: Unlimited',
    response_time_target: '<60 seconds',
    request_schema: {
      question_id: 'UUID of the question',
      answer_text: 'The answer text (min 50 characters)',
      word_count: 'Number of words in answer',
      time_taken_sec: 'Time taken to write answer in seconds',
    },
    response_schema: {
      success: 'boolean',
      answer_id: 'UUID of saved answer',
      evaluation: {
        structure_score: '0-10',
        content_score: '0-10',
        analysis_score: '0-10',
        presentation_score: '0-10',
        overall_score: '0-40',
        overall_percentage: '0-100',
        strengths: 'string[]',
        improvements: 'string[]',
        model_answer_points: 'string[]',
        feedback_en: 'Detailed feedback in English',
        feedback_hi: 'विस्तृत प्रतिक्रिया हिंदी में',
        exam_tip: 'Exam tip string',
        evaluation_time_sec: 'Time taken for evaluation',
      },
    },
  });
}
