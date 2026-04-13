/**
 * MCQ Practice Start API
 * 
 * Master Prompt v8.0 - Feature F7 (READ Mode)
 * - Start practice session with filters
 * - Adaptive difficulty selection
 * - Subject/topic filtering
 * - PYQ mode support
 * - Subscription validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { questionBank } from '@/lib/mcq/question-bank';
import { adaptiveEngine } from '@/lib/mcq/adaptive-engine';
import { z } from 'zod';
import { normalizeUPSCInput } from '@/lib/agents/normalizer-agent';

export const dynamic = 'force-dynamic';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const practiceStartSchema = z.object({
  subject: z.enum(['GS1', 'GS2', 'GS3', 'GS4', 'CSAT', 'Optional', 'General']),
  topic: z.string().optional(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  questionCount: z.number().min(5).max(50).default(20),
  timed: z.boolean().default(true),
  timeLimitSec: z.number().optional(),
  isPyy: z.boolean().optional(),
  year: z.number().min(2013).max(2025).optional(),
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
    const validation = practiceStartSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error?.issues },
        { status: 400 }
      );
    }

    const config = validation.data;

    // Best-effort UPSC input normalization
    let normalized: any = null;
    try { normalized = await normalizeUPSCInput(config.topic || config.subject || ''); } catch (_e) { /* non-blocking */ }

    // Get adaptive difficulty if not specified
    let difficulty = config.difficulty;
    if (!difficulty) {
      const adaptiveConfig = await adaptiveEngine.identifyAreas(user.id);
      difficulty = adaptiveConfig.initialDifficulty;
    }

    // Check subscription limits
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('subscription_tier, daily_practice_limit')
      .eq('id', user.id)
      .single();

    const dailyLimit = userProfile?.subscription_tier === 'premium' || userProfile?.subscription_tier === 'premium_plus'
      ? 100
      : 20;

    // Check today's practice count
    const today = new Date().toISOString().split('T')[0];
    const { count: todayCount } = await supabase
      .from('mcq_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('session_type', 'Practice')
      .gte('created_at', today);

    if ((todayCount || 0) >= dailyLimit) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Daily practice limit reached',
          limit: dailyLimit,
          upgrade: 'Upgrade to premium for unlimited practice'
        },
        { status: 403 }
      );
    }

    // Get questions from bank
    const questions = await questionBank.getPracticeQuestions({
      subject: config.subject,
      topic: config.topic,
      difficulty,
      questionCount: config.questionCount,
      timed: config.timed,
      timeLimitSec: config.timeLimitSec,
      sessionType: config.isPyy ? 'PYQ' : 'Practice',
    });

    if (questions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No questions available for selected filters' },
        { status: 404 }
      );
    }

    // Create attempt record
    const { data: attempt, error: attemptError } = await supabase
      .from('mcq_attempts')
      .insert({
        user_id: user.id,
        session_type: config.isPyy ? 'PYQ' : 'Practice',
        subject: config.subject,
        topic: config.topic,
        difficulty,
        total_questions: questions.length,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (attemptError) {
      console.error('Failed to create attempt:', attemptError);
      return NextResponse.json(
        { success: false, error: 'Failed to start practice session' },
        { status: 500 }
      );
    }

    // Remove explanations from questions (show after submission)
    const sanitizedQuestions = questions.map(q => ({
      id: q.id,
      questionText: q.questionText,
      options: q.options,
      subject: q.subject,
      topic: q.topic,
      difficulty: q.difficulty,
      timeEstimateSec: q.timeEstimateSec,
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      isPyy: q.isPyy,
      year: q.year,
    }));

    // Calculate time limit
    const timeLimitSec = config.timeLimitSec || (questions.length * 90);

    return NextResponse.json({
      success: true,
      data: {
        sessionId: attempt.id,
        questions: sanitizedQuestions,
        settings: {
          timed: config.timed,
          timeLimitSec,
          totalQuestions: questions.length,
          subject: config.subject,
          topic: config.topic,
          difficulty,
        },
      },
    });
  } catch (error) {
    console.error('MCQ practice start error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/mcq/practice/start?sessionId=<id>
// Fetch an existing practice session by attempt ID
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // Fetch the attempt record
    const { data: attempt, error: attemptError } = await supabase
      .from('mcq_attempts')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Fetch questions for this attempt
    const questions = await questionBank.getPracticeQuestions({
      subject: attempt.subject,
      topic: attempt.topic,
      difficulty: attempt.difficulty,
      questionCount: attempt.total_questions,
      timed: true,
      timeLimitSec: attempt.total_questions * 90,
      sessionType: attempt.session_type,
    });

    const sanitizedQuestions = questions.map((q: any) => ({
      id: q.id,
      questionText: q.questionText,
      options: q.options,
      subject: q.subject,
      topic: q.topic,
      difficulty: q.difficulty,
      timeEstimateSec: q.timeEstimateSec,
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      isPyy: q.isPyy,
      year: q.year,
    }));

    const timeLimitSec = attempt.total_questions * 90;

    return NextResponse.json({
      success: true,
      data: {
        sessionId: attempt.id,
        mode: attempt.session_type?.toLowerCase() || 'practice',
        subject: attempt.subject,
        totalQuestions: attempt.total_questions,
        timeLimitSec,
        questions: sanitizedQuestions,
      },
    });
  } catch (error) {
    console.error('MCQ practice session fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
