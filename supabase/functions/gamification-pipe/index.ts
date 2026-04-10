import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { callAI } from '../_shared/ai-provider.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Edge Function: gamification-pipe
 * F13: Gamification — XP calculations, badges, personalized motivation
 * v8 Spec: Frontend → Edge Function → Calculate XP → AI Motivation → Response
 */

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// XP Configuration
const XP_CONFIG = {
  doubt_asked: 10,
  doubt_answered: 5,
  mcq_correct: 2,
  mcq_wrong: 0,
  mains_evaluated: 25,
  notes_generated: 15,
  streak_day: 5,
  lecture_watched: 20,
  short_watched: 5,
};

// Badge Configuration
const BADGES = [
  { id: 'first_doubt', name: 'Curious Mind', requirement: { type: 'doubt_asked', count: 1 } },
  { id: 'streak_7', name: 'Week Warrior', requirement: { type: 'streak_day', count: 7 } },
  { id: 'streak_30', name: 'Monthly Master', requirement: { type: 'streak_day', count: 30 } },
  { id: 'mcq_100', name: 'Quiz Champion', requirement: { type: 'mcq_correct', count: 100 } },
  { id: 'mains_10', name: 'Answer Writer', requirement: { type: 'mains_evaluated', count: 10 } },
  { id: 'notes_50', name: 'Note Maker', requirement: { type: 'notes_generated', count: 50 } },
];

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const body = await req.json();
    const { userId, action, actionData } = body;

    if (!userId || !action) {
      return new Response(JSON.stringify({ error: 'userId and action are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate XP
    const xpEarned = XP_CONFIG[action as keyof typeof XP_CONFIG] || 0;

    // Update user XP
    const { data: gamification } = await supabase
      .from('user_gamification')
      .select('xp, level, current_streak')
      .eq('user_id', userId)
      .single();

    const newXp = (gamification?.xp || 0) + xpEarned;
    const newLevel = Math.floor(newXp / 1000) + 1;

    await supabase.from('user_gamification').upsert({
      user_id: userId,
      xp: newXp,
      level: newLevel,
      current_streak: gamification?.current_streak || 0,
    });

    // Log XP transaction
    await supabase.from('xp_transactions').insert({
      user_id: userId,
      action,
      xp_earned: xpEarned,
      xp_total: newXp,
      metadata: actionData || {},
    });

    // Check for new badges
    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId);

    const earnedBadgeIds = userBadges?.map((b: any) => b.badge_id) || [];
    const newBadges: any[] = [];

    for (const badge of BADGES) {
      if (earnedBadgeIds.includes(badge.id)) continue;

      // Check if badge requirement is met
      const count = await getCountForAction(userId, badge.requirement.type);
      if (count >= badge.requirement.count) {
        await supabase.from('user_badges').insert({
          user_id: userId,
          badge_id: badge.id,
        });
        newBadges.push(badge);
      }
    }

    // Generate personalized motivation message
    const motivationPrompt = `Student just earned ${xpEarned} XP for "${action}".
Current Level: ${newLevel}
Total XP: ${newXp}
${newBadges.length > 0 ? `New Badges: ${newBadges.map(b => b.name).join(', ')}` : ''}

Generate a short, enthusiastic motivation message (under 50 words). Use SIMPLIFIED language. Reference their progress.`;

    const motivation = await callAI(motivationPrompt, {
      system: 'You are an encouraging UPSC mentor. Celebrate small wins.',
      maxTokens: 100,
    });

    return new Response(JSON.stringify({
      data: {
        xpEarned,
        totalXp: newXp,
        level: newLevel,
        newBadges,
        motivation,
      },
      provider: 'gamification-engine',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('gamification-pipe error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper: Get count for badge requirement
async function getCountForAction(userId: string, actionType: string): Promise<number> {
  let table: string, column: string;

  switch (actionType) {
    case 'doubt_asked':
      table = 'doubt_threads';
      column = 'user_id';
      break;
    case 'mcq_correct':
      table = 'quiz_results';
      column = 'user_id';
      break;
    case 'mains_evaluated':
      table = 'mains_evaluations';
      column = 'user_id';
      break;
    case 'notes_generated':
      table = 'ai_notes';
      column = 'user_id';
      break;
    case 'streak_day':
      const { data } = await supabase
        .from('user_gamification')
        .select('current_streak')
        .eq('user_id', userId)
        .single();
      return data?.current_streak || 0;
    default:
      return 0;
  }

  const { count } = await supabase.from(table).select('*', { count: 'exact', head: true }).eq(column, userId);
  return count || 0;
}
