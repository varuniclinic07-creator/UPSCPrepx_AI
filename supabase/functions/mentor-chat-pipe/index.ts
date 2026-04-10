import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { callAI } from '../_shared/ai-provider.ts';
import { checkAccess } from '../_shared/entitlement.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Edge Function: mentor-chat-pipe
 * F10: AI Mentor Chat — Personalized mentoring with user context
 * v8 Spec: Frontend → Edge Function → Context → callAI() → Personalized Response
 */

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { userId, sessionId, message, mode } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Entitlement check (free: 1 chat/day)
    const access = await checkAccess(userId, 'mentor');
    if (!access.allowed) {
      return new Response(JSON.stringify({ error: access.reason, remaining: access.remaining }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch user context for personalization
    const [profile, progress, streak] = await Promise.all([
      supabase.from('user_profiles').select('target_year, attempt_number, preparation_stage').eq('user_id', userId).single(),
      supabase.from('user_progress').select('syllabus_coverage, mock_accuracy').eq('user_id', userId).single(),
      supabase.from('user_gamification').select('current_streak').eq('user_id', userId).single(),
    ]);

    const contextText = `
Student Profile:
- Target Year: ${profile.data?.target_year || 2027}
- Attempt: ${profile.data?.attempt_number || 1} (${profile.data?.preparation_stage || 'beginner'})
- Syllabus Coverage: ${progress.data?.syllabus_coverage || 0}%
- Mock Accuracy: ${progress.data?.mock_accuracy || 0}%
- Current Streak: ${streak.data?.current_streak || 0} days
`;

    // Fetch conversation history (last 10 messages)
    const { data: history } = await supabase
      .from('mentor_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(10);

    const historyText = history?.reverse().map((m: any) => `${m.role}: ${m.content}`).join('\n') || '';

    // Mode-specific system prompts
    const modePrompts = {
      motivational: 'You are a motivating UPSC mentor. Encourage, inspire confidence, share success stories.',
      strategic: 'You are a strategic UPSC planner. Focus on study plans, time management, priority setting.',
      emotional: 'You are an empathetic counselor. Listen, validate feelings, reduce anxiety, build resilience.',
      academic: 'You are an academic expert. Focus on subject mastery, answer writing, conceptual clarity.',
    };

    const systemPrompt = `${modePrompts[mode as keyof typeof modePrompts] || modePrompts.motivational}

${contextText}

RULES:
1. Use SIMPLIFIED language (10th grade level)
2. Reference user's data when relevant
3. Be empathetic but action-oriented
4. Keep responses under 200 words
5. End with 1-2 actionable next steps`;

    const userPrompt = `${historyText ? `Conversation History:\n${historyText}\n\n` : ''}Student: ${message}

Mentor:`;

    // Generate personalized response
    const response = await callAI(userPrompt, {
      system: systemPrompt,
      temperature: 0.8,
      maxTokens: 500,
    });

    // Save messages
    const { data: userMsg } = await supabase.from('mentor_messages').insert({
      session_id: sessionId,
      role: 'user',
      content: message,
    }).select().single();

    const { data: assistantMsg } = await supabase.from('mentor_messages').insert({
      session_id: sessionId,
      role: 'assistant',
      content: response,
    }).select().single();

    // Update session timestamp
    await supabase.from('mentor_sessions').update({
      updated_at: new Date().toISOString(),
    }).eq('id', sessionId);

    // Track usage
    await supabase.rpc('increment_usage', {
      p_user_id: userId,
      p_feature: 'mentor',
    });

    return new Response(JSON.stringify({
      data: {
        message: assistantMsg,
        response,
        context: {
          syllabusCoverage: progress.data?.syllabus_coverage,
          streak: streak.data?.current_streak,
        },
      },
      provider: 'callAI',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('mentor-chat-pipe error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
