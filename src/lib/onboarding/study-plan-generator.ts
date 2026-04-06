/**
 * Study Plan Generator Service - F1 Smart Onboarding
 * 
 * Analyzes quiz performance and generates personalized study plan.
 * Seeds user_progress for all 330 syllabus nodes.
 * Activates 3-day trial subscription.
 * 
 * Uses AI with SIMPLIFIED_LANGUAGE_PROMPT for plan generation.
 */

import { createClient } from '@supabase/supabase-js';
import { withSimplifiedLanguage } from './simplified-language-prompt';
import type { QuizQuestion } from './quiz-generator';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * User profile data from onboarding wizard
 */
export interface UserProfile {
  user_id: string;
  target_year: number;
  attempt_number: number;
  is_working_professional: boolean;
  study_hours_per_day: number;
  optional_subject?: string;
  preparation_stage: 'beginner' | 'intermediate' | 'advanced' | 'revision';
}

/**
 * Quiz results for analysis
 */
export interface QuizResults {
  questions: QuizQuestion[];
  answers: Array<{ question_id: string; selected_option: string; time_spent_sec: number }>;
  score: number;
  subjectAccuracy: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
}

/**
 * Generated study plan structure
 */
export interface StudyPlan {
  overall_score: number;
  preparation_stage: string;
  strengths: string[];
  weaknesses: string[];
  weekly_schedule: WeeklySchedule;
  priority_topics: PriorityTopic[];
  recommended_hours_per_subject: Record<string, number>;
  motivational_message: string;
  motivational_message_hi: string;
}

export interface WeeklySchedule {
  monday: DayPlan[];
  tuesday: DayPlan[];
  wednesday: DayPlan[];
  thursday: DayPlan[];
  friday: DayPlan[];
  saturday: DayPlan[];
  sunday: DayPlan[];
}

export interface DayPlan {
  subject: string;
  topic: string;
  hours: number;
  activity_type: 'reading' | 'practicing' | 'revision' | 'rest';
}

export interface PriorityTopic {
  subject: string;
  topic: string;
  reason: string;
  recommended_action: string;
}

/**
 * AI prompt for study plan generation
 */
const STUDY_PLAN_PROMPT = `
Generate a personalized UPSC study plan based on quiz performance and user profile.

RULES:
1. Use simple language (10th-class level)
2. Be encouraging but honest about weak areas
3. Consider working professional status (less time on weekdays)
4. Adjust for target year (2026 = intensive, 2027+ = more time)
5. Include rest days and revision time
6. Include Hindi translation for motivational message
7. Provide specific, actionable recommendations

FORMAT: Return valid JSON only, no markdown.

{
  "overall_score": 65.5,
  "preparation_stage": "beginner",
  "strengths": ["Polity", "Geography"],
  "weaknesses": ["Economics", "Ethics"],
  "weekly_schedule": {
    "monday": [
      {"subject": "GS2", "topic": "Polity", "hours": 3, "activity_type": "reading"},
      {"subject": "GS3", "topic": "Economy", "hours": 2, "activity_type": "practicing"}
    ],
    ...
  },
  "priority_topics": [
    {"subject": "GS3", "topic": "Basic Economics", "reason": "Low quiz score (20%), high weightage in exam", "recommended_action": "Start with NCERT Class 11 Economics"}
  ],
  "recommended_hours_per_subject": {
    "GS1": 8,
    "GS2": 10,
    "GS3": 12,
    "GS4": 4,
    "CSAT": 4
  },
  "motivational_message": "Your Polity score is excellent! Focus on Economics for 2 weeks and you'll see great improvement.",
  "motivational_message_hi": "आपका Polity स्कोर बहुत अच्छा है! Economics पर 2 सप्ताह ध्यान दें और आप बड़ा सुधार देखेंगे।"
}
`;

/**
 * Generate personalized study plan
 * 
 * @param profile - User profile from onboarding wizard
 * @param quizResults - Quiz performance data
 * @returns Complete study plan with weekly schedule
 */
export async function generateStudyPlan(
  profile: UserProfile,
  quizResults: QuizResults
): Promise<StudyPlan> {
  try {
    const prompt = withSimplifiedLanguage(`
      Generate personalized UPSC study plan.
      
      USER PROFILE:
      - Target Year: ${profile.target_year}
      - Attempt Number: ${profile.attempt_number}
      - Working Professional: ${profile.is_working_professional ? 'Yes' : 'No'}
      - Study Hours per Day: ${profile.study_hours_per_day}
      - Optional Subject: ${profile.optional_subject || 'Not selected'}
      - Preparation Stage: ${profile.preparation_stage}
      
      QUIZ PERFORMANCE:
      - Overall Score: ${quizResults.score.toFixed(1)}%
      - Strengths (>70%): ${quizResults.strengths.join(', ') || 'None identified'}
      - Weaknesses (<40%): ${quizResults.weaknesses.join(', ') || 'None identified'}
      - Subject-wise Accuracy:
        ${Object.entries(quizResults.subjectAccuracy)
          .map(([subject, accuracy]) => `  - ${subject}: ${accuracy.toFixed(1)}%`)
          .join('\n')}
      
      ${STUDY_PLAN_PROMPT}
    `);

    // Call AI provider (9Router → Groq → Ollama fallback)
    const aiResponse = await callAIProvider(prompt);
    
    // Parse AI response
    const studyPlan: StudyPlan = JSON.parse(aiResponse);

    // Validate study plan structure
    validateStudyPlan(studyPlan);

    return studyPlan;
  } catch (error) {
    console.error('Error generating study plan:', error);
    throw new Error('Failed to generate study plan. Please try again.');
  }
}

/**
 * Seed user_progress for all 330 syllabus nodes
 * 
 * @param user_id - User UUID
 * @param strengths - Strong subjects
 * @param weaknesses - Weak subjects
 * @returns Number of rows seeded
 */
export async function seedSyllabusProgress(
  user_id: string,
  strengths: string[],
  weaknesses: string[]
): Promise<number> {
  try {
    // Get all syllabus nodes
    const { data: syllabusNodes, error: fetchError } = await supabase
      .from('syllabus_nodes')
      .select('id, subject, level, weightage');

    if (fetchError || !syllabusNodes) {
      throw new Error('Failed to fetch syllabus nodes');
    }

    // Prepare progress data
    const progressData = syllabusNodes.map(node => {
      const isStrength = strengths.some(s => 
        node.subject.includes(s) || s.includes(node.subject)
      );
      const isWeakness = weaknesses.some(w => 
        node.subject.includes(w) || w.includes(node.subject)
      );

      return {
        user_id,
        syllabus_node_id: node.id,
        completion_percent: isStrength ? 20 : isWeakness ? 0 : 10,
        confidence_score: isStrength ? 0.7 : isWeakness ? 0.2 : 0.4,
        next_revision_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
    });

    // Insert progress data (upsert to avoid duplicates)
    const { error: insertError } = await supabase
      .from('user_progress')
      .upsert(progressData, { onConflict: 'user_id,syllabus_node_id' });

    if (insertError) {
      throw insertError;
    }

    return progressData.length;
  } catch (error) {
    console.error('Error seeding syllabus progress:', error);
    throw new Error('Failed to initialize syllabus progress');
  }
}

/**
 * Activate 3-day trial subscription
 * 
 * @param user_id - User UUID
 * @returns Trial subscription details
 */
export async function activateTrialSubscription(
  user_id: string
): Promise<{
  subscription_id: string;
  trial_started_at: string;
  trial_expires_at: string;
}> {
  try {
    const trialStartedAt = new Date();
    const trialExpiresAt = new Date(trialStartedAt.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Get Free plan ID
    const { data: freePlan } = await supabase
      .from('plans')
      .select('id')
      .eq('slug', 'free')
      .single();

    if (!freePlan) {
      throw new Error('Free plan not found');
    }

    // Create trial subscription
    const { data: subscription, error: insertError } = await supabase
      .from('subscriptions')
      .insert({
        user_id,
        plan_id: freePlan.id,
        status: 'trial',
        trial_started_at: trialStartedAt.toISOString(),
        trial_expires_at: trialExpiresAt.toISOString(),
        auto_renew: false,
      })
      .select('id, trial_started_at, trial_expires_at')
      .single();

    if (insertError || !subscription) {
      throw insertError || new Error('Failed to create trial subscription');
    }

    return {
      subscription_id: subscription.id,
      trial_started_at: subscription.trial_started_at,
      trial_expires_at: subscription.trial_expires_at,
    };
  } catch (error) {
    console.error('Error activating trial:', error);
    throw new Error('Failed to activate trial subscription');
  }
}

/**
 * Save study plan to user profile
 * 
 * @param user_id - User UUID
 * @param studyPlan - Generated study plan
 */
export async function saveStudyPlanToProfile(
  user_id: string,
  studyPlan: StudyPlan
): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        study_plan: studyPlan,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user_id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error saving study plan:', error);
    throw new Error('Failed to save study plan');
  }
}

/**
 * Call AI provider with fallback chain (9Router → Groq → Ollama)
 */
async function callAIProvider(prompt: string): Promise<string> {
  const { callAI } = await import('../ai/ai-provider-client');
  
  const response = await callAI({
    messages: [
      { role: 'system', content: 'You are an expert UPSC study plan creator and mentor.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 2500,
  });

  return response.content;
}

/**
 * Validate study plan structure
 */
function validateStudyPlan(plan: StudyPlan): void {
  const requiredFields = [
    'overall_score',
    'preparation_stage',
    'strengths',
    'weaknesses',
    'weekly_schedule',
    'priority_topics',
    'recommended_hours_per_subject',
    'motivational_message',
    'motivational_message_hi',
  ];

  const missingFields = requiredFields.filter(
    field => !(field in plan)
  );

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields in study plan: ${missingFields.join(', ')}`);
  }

  // Validate weekly schedule has all days
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const missingDays = days.filter(day => !(day in plan.weekly_schedule));
  
  if (missingDays.length > 0) {
    throw new Error(`Missing days in weekly schedule: ${missingDays.join(', ')}`);
  }
}

/**
 * Award XP for completing onboarding (Gamification F13)
 * 
 * @param user_id - User UUID
 */
export async function awardOnboardingXP(user_id: string): Promise<void> {
  try {
    // Award 100 XP for completing onboarding
    const { error } = await supabase.rpc('add_user_xp', {
      p_user_id: user_id,
      p_xp_amount: 100,
      p_reason: 'completed_onboarding',
    });

    if (error) {
      // If RPC doesn't exist, update directly
      await supabase
        .from('user_gamification')
        .upsert({
          user_id,
          xp_total: 100,
          level: 1,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user_id);
    }
  } catch (error) {
    console.error('Error awarding onboarding XP:', error);
    // Non-critical, don't throw
  }
}
