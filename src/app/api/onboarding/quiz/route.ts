/**
 * POST /api/onboarding/quiz
 * 
 * Generate 10-question diagnostic quiz for user.
 * Uses AI with SIMPLIFIED_LANGUAGE_PROMPT.
 * 
 * Master Prompt v8.0 - F1 Smart Onboarding
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { generateDiagnosticQuiz } from '@/lib/onboarding/quiz-generator';

export const dynamic = 'force-dynamic';

let _sb: ReturnType<typeof createClient> | null = null;
function getSupabase() { if (!_sb) _sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!); return _sb; }

/**
 * Request validation schema
 */
const quizRequestSchema = z.object({
  user_id: z.string().uuid(),
});

/**
 * Generate diagnostic quiz
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json();
    const { user_id } = quizRequestSchema.parse(body);

    // Fetch user profile for personalized quiz
    const { data: profile, error: profileError } = await getSupabase()
      .from('user_profiles')
      .select('target_year, attempt_number, is_working_professional, study_hours_per_day, optional_subject')
      .eq('user_id', user_id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          success: false,
          error: 'User profile not found. Please complete profile first.',
        },
        { status: 400 }
      );
    }

    // Generate quiz using AI service
    const questions = await generateDiagnosticQuiz({
      user_id,
      target_year: profile.target_year,
      attempt_number: profile.attempt_number,
      is_working_professional: profile.is_working_professional,
      study_hours_per_day: profile.study_hours_per_day,
      optional_subject: profile.optional_subject || undefined,
    });

    // Create quiz session
    const quizId = `quiz-${user_id}-${Date.now()}`;

    // Store quiz questions temporarily (for validation on submit)
    await getSupabase().from('jobs').insert({
      job_type: 'diagnostic_quiz',
      user_id,
      payload: {
        quiz_id: quizId,
        questions: questions.map(q => ({
          id: q.id,
          question_text: q.question_text,
          question_text_hi: q.question_text_hi,
          options: q.options,
          correct_answer: q.correct_answer,
          subject: q.subject,
          topic: q.topic,
        })),
      },
      status: 'completed',
    });

    // Log audit event
    await getSupabase().from('audit_logs').insert({
      user_id,
      action: 'diagnostic_quiz_generated',
      resource_type: 'quiz',
      details: { quiz_id: quizId, question_count: questions.length },
    });

    return NextResponse.json({
      success: true,
      quiz_id: quizId,
      questions: questions.map(q => ({
        id: q.id,
        question_text: q.question_text,
        question_text_hi: q.question_text_hi,
        options: q.options,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
      })),
      total_questions: questions.length,
      time_limit_seconds: null, // No time limit for diagnostic
      instructions: {
        en: 'Answer all 10 questions to the best of your ability. This helps us create your personalized study plan.',
        hi: 'अपने व्यक्तिगत अध्ययन योजना बनाने के लिए सभी 10 प्रश्नों का उत्तर दें।',
      },
    });
  } catch (error) {
    console.error('Error generating quiz:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate quiz',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
