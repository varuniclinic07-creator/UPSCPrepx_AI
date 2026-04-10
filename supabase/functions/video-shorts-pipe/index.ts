import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { callAI } from '../_shared/ai-provider.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Edge Function: video-shorts-pipe
 * F18: 60-Second Video Shorts — Generate short-form video scripts
 * v8 Spec: Frontend → Edge Function → callAI() → Structured Script
 */

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const body = await req.json();
    const { userId, topic, subject } = body;

    if (!topic) {
      return new Response(JSON.stringify({ error: 'Topic is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch relevant knowledge chunks for context
    const { data: chunks } = await supabase
      .from('knowledge_chunks')
      .select('content, source_title')
      .ilike('content', `%${topic}%`)
      .limit(5);

    const contextChunks = chunks?.map((c: any) => c.content).join('\n\n') || '';

    // Build 60-second script structure
    const scriptPrompt = `Generate a 60-second UPSC video short on: ${topic}
Subject: ${subject || 'General'}

Context:
${contextChunks || 'Use general UPSC knowledge'}

STRUCTURE (strict 60-second timing):
0-5s:  Hook - Surprising fact or question
5-20s: Concept explanation (simple language)
20-40s: Example/case study
40-55s: Key takeaway + mnemonic
55-60s: Call-to-action (learn more)

RULES:
- Exactly 130-150 words (normal speaking pace)
- Simple language (10th grade level)
- Include visual cues in [brackets]
- Add Hindi translation option
- UPSC exam relevance clear

Return as JSON:
{
  "hook": "...",
  "concept": "...",
  "example": "...",
  "takeaway": "...",
  "cta": "...",
  "visualCues": ["...", "..."],
  "wordCount": 140
}`;

    const scriptJson = await callAI(scriptPrompt, {
      system: 'You are a UPSC content creator for short-form video. Make complex topics engaging in 60 seconds.',
      maxTokens: 1000,
      skipSimplifiedLanguage: true, // JSON response
    });

    let script;
    try {
      const jsonMatch = scriptJson.match(/\{[\s\S]*\}/);
      script = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: scriptJson };
    } catch {
      script = { raw: scriptJson };
    }

    // Save video short
    const { data: shortRecord } = await supabase.from('video_shorts').insert({
      user_id: userId || null,
      topic,
      subject: subject || 'General',
      script: script,
      duration_seconds: 60,
      status: 'draft',
      ai_provider: 'callAI',
    }).select().single();

    return new Response(JSON.stringify({
      data: {
        shortId: shortRecord?.id,
        script,
        wordCount: script.wordCount || script.raw?.split(/\s+/).length || 0,
      },
      provider: 'callAI',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('video-shorts-pipe error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
