/**
 * MCQ Mock Test Start API
 * 
 * Master Prompt v8.0 - Feature F7 (READ Mode)
 * - Start full-length mock test
 * - UPSC pattern (100 questions, 120 min)
 * - Premium access validation
 * - Question distribution by subject/difficulty
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mockTest } from '@/lib/mcq/mock-test';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const mockStartSchema = z.object({
  mockId: z.string().uuid(),
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
    const validation = mockStartSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error?.issues },
        { status: 400 }
      );
    }

    const { mockId } = validation.data;

    // Get mock test details
    const mock = await mockTest.getMockTestById(mockId);
    if (!mock) {
      return NextResponse.json(
        { success: false, error: 'Mock test not found' },
        { status: 404 }
      );
    }

    // Check premium access
    if (mock.isPremium) {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();

      if (userProfile?.subscription_tier !== 'premium' && userProfile?.subscription_tier !== 'premium_plus') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Premium subscription required',
            upgrade: 'Upgrade to access premium mock tests'
          },
          { status: 403 }
        );
      }
    }

    // Check if user already has an active attempt
    const { data: activeAttempt } = await supabase
      .from('mcq_attempts')
      .select('id')
      .eq('user_id', user.id)
      .eq('mock_id', mockId)
      .is('completed_at', null)
      .single();

    if (activeAttempt) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'You already have an active attempt for this mock',
          attemptId: activeAttempt.id,
          resume: true
        },
        { status: 409 }
      );
    }

    // Start mock attempt
    const result = await mockTest.startMockAttempt(user.id, mockId);
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Failed to start mock test' },
        { status: 500 }
      );
    }

    // Get questions for mock (without explanations)
    const { data: mockQuestions } = await supabase
      .from('mcq_mock_questions')
      .select(`
        question_number,
        section,
        question:mcq_questions(
          id,
          question_text,
          options,
          subject,
          topic,
          difficulty,
          marks,
          negative_marks,
          time_estimate_sec
        )
      `)
      .eq('mock_id', mockId)
      .order('question_number', { ascending: true });

    if (!mockQuestions || mockQuestions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No questions found for this mock test' },
        { status: 404 }
      );
    }

    // Format questions for frontend
    const questions = mockQuestions.map((mq: any) => ({
      questionNumber: mq.question_number,
      section: mq.section,
      ...mq.question,
      questionText: mq.question.question_text,
    }));

    return NextResponse.json({
      success: true,
      data: {
        attemptId: result.attemptId,
        mock: {
          id: mock.id,
          title: mock.title,
          description: mock.description,
          totalQuestions: mock.totalQuestions,
          totalMarks: mock.totalMarks,
          durationMin: mock.durationMin,
        },
        questions,
        settings: {
          timed: true,
          durationSec: mock.durationMin * 60,
          negativeMarking: true,
          marksPerQuestion: 2,
          negativeMarksPerQuestion: 0.66,
          allowReview: true,
          allowJump: true,
        },
      },
    });
  } catch (error) {
    console.error('Mock test start error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
