import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { callAI } from '../_shared/ai-provider.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Edge Function: ethics-pipe
 * F6 (Mains): Ethics Case Studies — Generate and analyze GS4 scenarios
 * v8 Spec: Frontend → Edge Function → Case Study Analysis → Structured Answer
 */

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const body = await req.json();
    const { userId, action, caseStudy, userAnswer } = body;

    if (!action) {
      return new Response(JSON.stringify({ error: 'Action is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate ethics case study
    if (action === 'generate_case') {
      const casePrompt = `Generate a UPSC GS4 Ethics case study:
Topic: ${caseStudy?.topic || 'Administrative ethics'}
Difficulty: ${caseStudy?.difficulty || 'medium'}

Format:
- Scenario (150-200 words)
- Ethical dilemmas involved
- Stakeholders
- 4 questions requiring analysis

Return as JSON.`;

      const caseJson = await callAI(casePrompt, {
        system: 'UPSC GS4 Ethics case study generator. Realistic administrative scenarios.',
        maxTokens: 2000,
        skipSimplifiedLanguage: true,
      });

      let caseStudyData;
      try {
        const jsonMatch = caseJson.match(/\{[\s\S]*\}/);
        caseStudyData = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: caseJson };
      } catch {
        caseStudyData = { raw: caseJson };
      }

      return new Response(JSON.stringify({
        data: { caseStudy: caseStudyData },
        provider: 'callAI',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Evaluate ethics answer
    if (action === 'evaluate' && userAnswer && caseStudy) {
      const evalPrompt = `Evaluate this GS4 Ethics answer:

Case Study: ${JSON.stringify(caseStudy)}
Student's Answer: ${userAnswer}

UPSC GS4 Evaluation Criteria:
- Ethical reasoning (25 marks)
- Stakeholder analysis (20 marks)
- Options considered (20 marks)
- Decision justification (20 marks)
- Constitutional values (15 marks)

Provide:
1. Total score out of 100
2. Breakdown by criteria
3. Specific feedback
4. Model answer outline
5. Key ethical frameworks missed

Return as JSON.`;

      const evalJson = await callAI(evalPrompt, {
        system: 'UPSC GS4 Ethics examiner. Evaluate using official rubric.',
        maxTokens: 3000,
        skipSimplifiedLanguage: true,
      });

      let evaluation;
      try {
        const jsonMatch = evalJson.match(/\{[\s\S]*\}/);
        evaluation = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: evalJson };
      } catch {
        evaluation = { raw: evalJson };
      }

      // Save evaluation
      const { data: evalRecord } = await supabase.from('mains_evaluations').insert({
        user_id: userId,
        question: JSON.stringify(caseStudy),
        answer_text: userAnswer,
        subject: 'GS4 Ethics',
        total_score: evaluation.totalScore || 0,
        rubric_scores: evaluation.rubricScores,
        feedback: evaluation.feedback,
        ai_provider: 'callAI',
      }).select().single();

      return new Response(JSON.stringify({
        data: {
          evaluationId: evalRecord?.id,
          evaluation,
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
    console.error('ethics-pipe error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
