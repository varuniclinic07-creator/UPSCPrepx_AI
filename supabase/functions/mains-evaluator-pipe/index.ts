import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { callAI } from '../_shared/ai-provider.ts';
import { checkAccess } from '../_shared/entitlement.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Edge Function: mains-evaluator-pipe
 * F6: Mains Answer Evaluator — Grade answers with rubric-based scoring
 * v8 Spec: Frontend → Edge Function → Rubric → callAI() → Structured Feedback
 */

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// UPSC Mains Evaluation Rubric
const EVALUATION_RUBRIC = {
  structure: { weight: 20, criteria: 'Introduction, body, conclusion flow' },
  content: { weight: 30, criteria: 'Factual accuracy, depth, relevance' },
  analysis: { weight: 25, criteria: 'Critical thinking, multiple perspectives' },
  examples: { weight: 15, criteria: 'Case studies, current affairs links' },
  presentation: { weight: 10, criteria: 'Clarity, coherence, language' },
};

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
    const { userId, question, answer, subject, wordLimit } = body;

    if (!question || !answer) {
      return new Response(JSON.stringify({ error: 'Question and answer are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Entitlement check (free: 1 eval/month, pro: 10, ultimate: unlimited)
    const access = await checkAccess(userId, 'mains_eval');
    if (!access.allowed) {
      return new Response(JSON.stringify({ error: access.reason, remaining: access.remaining }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build evaluation prompt with rubric
    const systemPrompt = `You are an expert UPSC Mains examiner with 15+ years experience.
Evaluate answers using the official UPSC rubric:
- Structure (20 marks): Introduction, body, conclusion flow
- Content (30 marks): Factual accuracy, depth, relevance to syllabus
- Analysis (25 marks): Critical thinking, multiple perspectives
- Examples (15 marks): Case studies, current affairs integration
- Presentation (10 marks): Clarity, coherence, language

Provide:
1. Total score out of 100 (or out of question marks)
2. Breakdown by rubric category
3. Specific feedback with quotes from answer
4. Model answer outline
5. 3 actionable improvement tips

Use SIMPLIFIED language (10th grade level).`;

    const userPrompt = `Question: ${question}
${wordLimit ? `Word Limit: ${wordLimit} words` : ''}
Subject: ${subject || 'General Studies'}

Student's Answer:
${answer}

Evaluate strictly using UPSC standards.`;

    // Get structured evaluation
    const evaluationJson = await callAI(
      `${userPrompt}\n\nReturn evaluation as JSON with: totalScore, rubricScores, feedback, modelAnswerOutline, improvementTips`,
      {
        system: systemPrompt,
        maxTokens: 3000,
        skipSimplifiedLanguage: true, // JSON response
      },
    );

    // Parse evaluation
    let evaluation;
    try {
      const jsonMatch = evaluationJson.match(/\{[\s\S]*\}/);
      evaluation = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: evaluationJson };
    } catch {
      evaluation = { raw: evaluationJson };
    }

    // Save evaluation to database
    const { data: evalRecord } = await supabase.from('mains_evaluations').insert({
      user_id: userId,
      question,
      answer_text: answer,
      subject: subject || 'General',
      word_limit: wordLimit || null,
      total_score: evaluation.totalScore || 0,
      rubric_scores: evaluation.rubricScores || {},
      feedback: evaluation.feedback || '',
      model_answer_outline: evaluation.modelAnswerOutline || '',
      improvement_tips: evaluation.improvementTips || [],
      ai_provider: 'callAI',
    }).select().single();

    // Track usage
    await supabase.rpc('increment_usage', {
      p_user_id: userId,
      p_feature: 'mains_eval',
    });

    return new Response(JSON.stringify({
      data: {
        evaluationId: evalRecord?.id,
        totalScore: evaluation.totalScore,
        rubricScores: evaluation.rubricScores,
        feedback: evaluation.feedback,
        modelAnswerOutline: evaluation.modelAnswerOutline,
        improvementTips: evaluation.improvementTips,
        wordCount: answer.split(/\s+/).length,
      },
      provider: 'callAI',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('mains-evaluator-pipe error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
