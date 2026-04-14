/**
 * POST /api/onboarding/complete
 * 
 * Submit quiz answers, generate AI analysis, create study plan,
 * seed syllabus progress, and activate trial subscription.
 * 
 * Master Prompt v8.0 - F1 Smart Onboarding
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { z } from 'zod';
import {
  calculateQuizScore,
  identifyStrengthsWeaknesses,
  determinePreparationStage,
} from '@/lib/onboarding/quiz-generator';
import {
  generateStudyPlan,
  seedSyllabusProgress,
  activateTrialSubscription,
  saveStudyPlanToProfile,
  awardOnboardingXP,
} from '@/lib/onboarding/study-plan-generator';

export const dynamic = 'force-dynamic';

let _sb: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() { if (!_sb) _sb = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!); return _sb; }

/**
 * Request validation schema
 */
const completeRequestSchema = z.object({
  user_id: z.string().uuid(),
  quiz_id: z.string(),
  answers: z.array(
    z.object({
      question_id: z.string(),
      selected_option: z.enum(['A', 'B', 'C', 'D']),
      time_spent_sec: z.number().int().min(0).max(600),
    })
  ).min(10).max(10),
});

/**
 * Complete onboarding with quiz submission
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json();
    const { user_id, quiz_id, answers } = completeRequestSchema.parse(body);

    // Fetch user profile
    const { data: profile, error: profileError } = await getSupabase()
      .from('user_profiles' as any)
      .select('*')
      .eq('user_id', user_id)
      .single() as { data: any; error: any };

    if (profileError || !profile) {
      return NextResponse.json(
        {
          success: false,
          error: 'User profile not found',
        },
        { status: 400 }
      );
    }

    // Fetch quiz questions for validation
    const { data: jobData } = await getSupabase()
      .from('jobs' as any)
      .select('payload')
      .eq('user_id', user_id)
      .eq('job_type', 'diagnostic_quiz')
      .order('created_at', { ascending: false })
      .limit(1)
      .single() as { data: any };

    if (!jobData?.payload?.questions) {
      return NextResponse.json(
        {
          success: false,
          error: 'Quiz session not found',
        },
        { status: 400 }
      );
    }

    const storedQuestions = jobData.payload.questions;

    // Calculate quiz score
    const { score, correctCount, totalQuestions, subjectAccuracy } = calculateQuizScore(
      storedQuestions,
      answers
    );

    // Identify strengths and weaknesses
    const { strengths, weaknesses } = identifyStrengthsWeaknesses(subjectAccuracy);

    // Determine preparation stage
    const preparationStage = determinePreparationStage(
      score,
      profile.attempt_number,
      profile.target_year
    );

    // Generate AI study plan
    const studyPlan = await generateStudyPlan(
      {
        user_id,
        target_year: profile.target_year,
        attempt_number: profile.attempt_number,
        is_working_professional: profile.is_working_professional,
        study_hours_per_day: profile.study_hours_per_day,
        optional_subject: profile.optional_subject || undefined,
        preparation_stage: preparationStage,
      },
      {
        questions: storedQuestions,
        answers,
        score,
        subjectAccuracy,
        strengths,
        weaknesses,
      }
    );

    // Seed syllabus progress for all 330 nodes
    const seededCount = await seedSyllabusProgress(user_id, strengths, weaknesses);

    // Activate 3-day trial subscription
    const trial = await activateTrialSubscription(user_id);

    // Save study plan to profile
    await saveStudyPlanToProfile(user_id, studyPlan);

    // Award 100 XP for completing onboarding
    await awardOnboardingXP(user_id);

    // Mark onboarding as completed
    await (getSupabase()
      .from('user_profiles' as any) as any)
      .update({
        onboarding_completed: true,
        preparation_stage: preparationStage,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user_id);

    // Store quiz attempt
    await getSupabase().from('quiz_attempts' as any).insert({
      user_id,
      quiz_type: 'diagnostic',
      questions: storedQuestions,
      score,
      total_questions: totalQuestions,
      correct_answers: correctCount,
      time_taken_sec: answers.reduce((sum: number, a: { time_spent_sec: number }) => sum + a.time_spent_sec, 0),
      ai_evaluation: {
        strengths,
        weaknesses,
        subject_accuracy: subjectAccuracy,
        preparation_stage: preparationStage,
      },
    } as any);

    // Log audit event
    await getSupabase().from('audit_logs' as any).insert({
      user_id,
      action: 'onboarding_completed',
      resource_type: 'user_profile',
      details: {
        quiz_score: score,
        strengths,
        weaknesses,
        preparation_stage: preparationStage,
        trial_expires_at: trial.trial_expires_at,
      },
    } as any);

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully!',
      analysis: {
        overall_score: score,
        correct_answers: correctCount,
        total_questions: totalQuestions,
        preparation_stage: preparationStage,
        strengths,
        weaknesses,
        subject_accuracy: subjectAccuracy,
      },
      study_plan: {
        weekly_schedule: studyPlan.weekly_schedule,
        priority_topics: studyPlan.priority_topics,
        recommended_hours_per_subject: studyPlan.recommended_hours_per_subject,
        motivational_message: studyPlan.motivational_message,
        motivational_message_hi: studyPlan.motivational_message_hi,
      },
      trial: {
        active: true,
        started_at: trial.trial_started_at,
        expires_at: trial.trial_expires_at,
        days_remaining: 3,
      },
      progress: {
        syllabus_nodes_seeded: seededCount,
        xp_awarded: 100,
      },
      redirect: '/dashboard',
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to complete onboarding',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
