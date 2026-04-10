import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { callAI } from '../_shared/ai-provider.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Edge Function: planner-pipe
 * F8: AI Study Planner — Generate and adapt study schedules
 * v8 Spec: Frontend → Edge Function → callAI() → Personalized Schedule
 */

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const body = await req.json();
    const { userId, action, weekData, progressData } = body;

    if (!action) {
      return new Response(JSON.stringify({ error: 'Action is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('target_year, attempt_number, preparation_stage, optional_subject, study_hours_per_day')
      .eq('user_id', userId)
      .single();

    // Generate weekly schedule
    if (action === 'generate_schedule') {
      const schedulePrompt = `Generate a weekly study schedule for UPSC aspirant:
Profile: ${JSON.stringify(profile)}
Week Focus: ${weekData?.focus || 'General preparation'}
Available Hours/Day: ${profile?.study_hours_per_day || 6}

Create a day-by-day schedule with:
- Subject/topic per time slot
- Break times
- Revision slots
- Mock test slots
- Current affairs time

Return as JSON with days (monday-sunday), each with slots array.`;

      const scheduleJson = await callAI(schedulePrompt, {
        system: 'UPSC study schedule expert. Create realistic, balanced schedules.',
        maxTokens: 3000,
        skipSimplifiedLanguage: true,
      });

      let schedule;
      try {
        const jsonMatch = scheduleJson.match(/\{[\s\S]*\}/);
        schedule = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: scheduleJson };
      } catch {
        schedule = { raw: scheduleJson };
      }

      // Save schedule
      const { data: scheduleRecord } = await supabase.from('study_schedules').insert({
        user_id: userId,
        schedule_data: schedule,
        week_start: weekData?.weekStart || new Date().toISOString(),
      }).select().single();

      return new Response(JSON.stringify({
        data: {
          scheduleId: scheduleRecord?.id,
          schedule,
        },
        provider: 'callAI',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Adapt schedule based on progress
    if (action === 'adapt_schedule' && progressData) {
      const adaptPrompt = `Adapt study schedule based on progress:
Original Schedule: ${JSON.stringify(weekData?.originalSchedule)}
Actual Progress: ${JSON.stringify(progressData)}
Completion Rate: ${progressData?.completionRate || 0}%

Recommend adjustments:
- Which topics need more time
- Which can be reduced
- New priority order
- Motivational message

Return as JSON.`;

      const adaptedJson = await callAI(adaptPrompt, {
        system: 'UPSC adaptive learning expert. Adjust schedules based on actual progress.',
        maxTokens: 2000,
        skipSimplifiedLanguage: true,
      });

      let adapted;
      try {
        const jsonMatch = adaptedJson.match(/\{[\s\S]*\}/);
        adapted = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: adaptedJson };
      } catch {
        adapted = { raw: adaptedJson };
      }

      return new Response(JSON.stringify({
        data: {
          adaptedSchedule: adapted,
          adjustments: adapted.adjustments,
          motivation: adapted.motivation,
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
    console.error('planner-pipe error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
