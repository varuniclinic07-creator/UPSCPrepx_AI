import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { callAI } from '../_shared/ai-provider.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Edge Function: onboarding-pipe
 * F1: Smart Onboarding — Diagnostic quiz, analysis, personalized study plan
 * v8 Spec: Frontend → Edge Function → Quiz → Analysis → Study Plan
 */

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const body = await req.json();
    const { userId, action, quizAnswers, profile } = body;

    if (!action) {
      return new Response(JSON.stringify({ error: 'Action is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate diagnostic quiz
    if (action === 'generate_quiz') {
      const quizPrompt = `Generate 15 diagnostic MCQs for UPSC aspirant onboarding.
Cover: Polity, History, Geography, Economy, Environment, Ethics (2-3 each)
Difficulty: Mixed (easy to assess baseline)
Format: JSON array with question, 4 options, correct answer, explanation`;

      const quizJson = await callAI(quizPrompt, {
        system: 'UPSC diagnostic quiz generator.',
        maxTokens: 3000,
        skipSimplifiedLanguage: true,
      });

      let questions = [];
      try {
        const jsonMatch = quizJson.match(/\[[\s\S]*\]/);
        questions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      } catch {}

      return new Response(JSON.stringify({
        data: { quiz: questions, totalQuestions: questions.length },
        provider: 'callAI',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Analyze quiz results and generate study plan
    if (action === 'analyze_and_plan' && quizAnswers) {
      // Calculate score by subject
      const analysis = await callAI(
        `Analyze these quiz answers and create a personalized study plan:
Answers: ${JSON.stringify(quizAnswers)}
Profile: ${JSON.stringify(profile)}

Output JSON with:
- weakSubjects (top 3)
- strongSubjects (top 2)
- recommendedDailyHours
- priorityTopics (array)
- weekByWeekPlan (8 weeks)`,
        {
          system: 'UPSC study plan expert. Create realistic, personalized plans.',
          maxTokens: 2000,
          skipSimplifiedLanguage: true,
        },
      );

      let plan;
      try {
        const jsonMatch = analysis.match(/\{[\s\S]*\}/);
        plan = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: analysis };
      } catch {
        plan = { raw: analysis };
      }

      // Save study plan
      const { data: planRecord } = await supabase.from('study_schedules').insert({
        user_id: userId,
        plan_data: plan,
        generated_by: 'callAI',
      }).select().single();

      // Update user profile
      if (profile) {
        await supabase.from('user_profiles').upsert({
          user_id: userId,
          target_year: profile.targetYear,
          attempt_number: profile.attemptNumber,
          preparation_stage: profile.stage,
          optional_subject: profile.optionalSubject,
          onboarding_completed: true,
        });
      }

      return new Response(JSON.stringify({
        data: {
          planId: planRecord?.id,
          weakSubjects: plan.weakSubjects,
          strongSubjects: plan.strongSubjects,
          weekByWeekPlan: plan.weekByWeekPlan,
        },
        provider: 'callAI',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('onboarding-pipe error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
