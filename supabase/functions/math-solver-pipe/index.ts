import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { callAI } from '../_shared/ai-provider.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Edge Function: math-solver-pipe
 * CSAT: Math/Quant solver with step-by-step explanations
 * v8 Spec: Frontend → Edge Function → Step-by-Step Solution
 */

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const body = await req.json();
    const { question, topic, showSteps = true } = body;

    if (!question) {
      return new Response(JSON.stringify({ error: 'Question is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Math-specific prompt with step-by-step reasoning
    const mathPrompt = `Solve this CSAT/UPSC math problem with detailed steps:

Topic: ${topic || 'Quantitative Aptitude'}
Question: ${question}

Provide:
1. Given data
2. Formula/concept used
3. Step-by-step solution (numbered)
4. Final answer
5. Quick verification method
6. Time-saving tip for exam

Use SIMPLIFIED language. Show all calculations.`;

    const solution = await callAI(mathPrompt, {
      system: 'You are a CSAT math expert. Explain every step clearly for students weak in math.',
      maxTokens: 2000,
    });

    // Extract similar problems for practice
    const similarPrompt = `Generate 2 similar math problems for practice:
Original: ${question}
Topic: ${topic || 'Quantitative Aptitude'}

Return as JSON array: [{ question: "...", answer: "...", hint: "..." }]`;

    const similarJson = await callAI(similarPrompt, {
      system: 'Math problem generator.',
      maxTokens: 800,
      skipSimplifiedLanguage: true,
    });

    let similarProblems = [];
    try {
      const jsonMatch = similarJson.match(/\[[\s\S]*\]/);
      similarProblems = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {}

    // Save to practice history
    const { data: practiceRecord } = await supabase.from('quiz_attempts').insert({
      user_id: null, // Anonymous or from session
      quiz_type: 'math_practice',
      topic: topic || 'General',
      question_text: question,
      correct_answer: solution,
      is_correct: null,
    }).select().single();

    return new Response(JSON.stringify({
      data: {
        solution,
        similarProblems,
        topic,
      },
      provider: 'callAI',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('math-solver-pipe error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
