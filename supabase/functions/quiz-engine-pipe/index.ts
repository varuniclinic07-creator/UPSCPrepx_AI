import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { callAI } from '../_shared/ai-provider.ts';
import { checkAccess } from '../_shared/entitlement.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Edge Function: quiz-engine-pipe
 * F7: MCQ Practice Engine — Generate MCQs with explanations
 * v8 Spec: Frontend → Edge Function → callAI() → Structured MCQs
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
    const { userId, topic, subject, difficulty, count = 5, mode } = body;

    if (!topic) {
      return new Response(JSON.stringify({ error: 'Topic is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Entitlement check
    const access = await checkAccess(userId, 'mcq');
    if (!access.allowed) {
      return new Response(JSON.stringify({ error: access.reason, remaining: access.remaining }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch syllabus context
    const { data: node } = await supabase
      .from('syllabus_nodes')
      .select('title, keywords, pyq_count')
      .ilike('title', `%${topic}%`)
      .eq('subject', subject || 'General')
      .limit(1)
      .single();

    // Difficulty settings
    const difficultyConfig = {
      easy: { level: 'basic', pyqStyle: false },
      medium: { level: 'standard', pyqStyle: true },
      hard: { level: 'advanced', pyqStyle: true },
    };

    const config = difficultyConfig[difficulty as keyof typeof difficultyConfig] || difficultyConfig.medium;

    // Mode-specific prompts
    const modePrompts = {
      practice: 'Generate MCQs for learning. Include detailed explanations.',
      mock: 'Generate UPSC Prelims-style MCQs. Strict timing, exam format.',
      adaptive: 'Generate MCQs adjusted to student level based on performance.',
    };

    // Build MCQ generation prompt
    const systemPrompt = `You are an expert UPSC Prelims question setter.
Generate ${count} MCQs on: ${topic}
Subject: ${subject || 'General'}
Difficulty: ${difficulty || 'medium'}
Mode: ${mode || 'practice'}

${node ? `Syllabus Context: ${node.title}, Keywords: ${node.keywords?.join(', ')}` : ''}

RULES:
1. Each MCQ has exactly 4 options (a, b, c, d)
2. Only ONE correct answer
3. Include detailed explanation for each
4. Match UPSC Prelims style and difficulty
5. Use SIMPLIFIED language (10th grade level)
6. Include current affairs links where relevant

FORMAT: Return valid JSON array:
[
  {
    "question": "question text",
    "options": { "a": "...", "b": "...", "c": "...", "d": "..." },
    "correctAnswer": "a",
    "explanation": "why correct + why others wrong",
    "difficulty": "easy/medium/hard",
    "topic": "sub-topic"
  }
]`;

    const userPrompt = `${modePrompts[mode as keyof typeof modePrompts] || modePrompts.practice}

Generate ${count} MCQs now:`;

    // Generate MCQs
    const mcqJson = await callAI(userPrompt, {
      system: systemPrompt,
      maxTokens: 3000,
      skipSimplifiedLanguage: true, // JSON response
    });

    // Parse MCQs
    let mcqs;
    try {
      const jsonMatch = mcqJson.match(/\[[\s\S]*\]/);
      mcqs = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      mcqs = [];
    }

    // Validate and clean MCQs
    const validMcqs = mcqs.filter((q: any) =>
      q.question && q.options && q.correctAnswer && q.explanation
    ).map((q: any) => ({
      ...q,
      options: typeof q.options === 'object' ? q.options : { a: '', b: '', c: '', d: '' },
    }));

    // Save questions to database
    const savedQuestions = [];
    for (const q of validMcqs) {
      const { data } = await supabase.from('questions').insert({
        topic,
        subject: subject || 'General',
        difficulty: q.difficulty || 'medium',
        question_text: q.question,
        options: q.options,
        correct_answer: q.correctAnswer,
        explanation: q.explanation,
        is_pyq_style: config.pyqStyle,
        ai_generated: true,
      }).select().single();
      if (data) savedQuestions.push(data);
    }

    // Track usage
    await supabase.rpc('increment_usage', {
      p_user_id: userId,
      p_feature: 'mcq',
    });

    return new Response(JSON.stringify({
      data: {
        questions: savedQuestions,
        count: savedQuestions.length,
        topic,
        difficulty,
      },
      provider: 'callAI',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('quiz-engine-pipe error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
