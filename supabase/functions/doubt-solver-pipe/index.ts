import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { callAI } from '../_shared/ai-provider.ts';
import { checkAccess } from '../_shared/entitlement.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Edge Function: doubt-solver-pipe
 * F5: AI Doubt Solver — Answer UPSC doubts with RAG grounding
 * v8 Spec: Frontend → Edge Function → RAG → callAI() → Provider
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
    const { userId, question, subject, topic, attachments } = body;

    if (!question) {
      return new Response(JSON.stringify({ error: 'Question is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Entitlement check (free: 3 doubts/day)
    const access = await checkAccess(userId, 'doubt');
    if (!access.allowed) {
      return new Response(JSON.stringify({ error: access.reason, remaining: access.remaining }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // RAG: Search knowledge_chunks for relevant context
    const questionEmbedding = await getEmbedding(question);
    const { data: chunks } = await supabase.rpc('match_knowledge_chunks', {
      query_embedding: questionEmbedding,
      match_threshold: 0.7,
      match_count: 5,
      filter_subject: subject || undefined,
    });

    const contextChunks = chunks?.map((c: any) => c.content).join('\n\n') || '';

    // Build RAG-grounded prompt
    const systemPrompt = `You are an expert UPSC CSE educator. Answer doubts using ONLY the provided context.
Rules:
1. Use SIMPLIFIED language (10th grade level)
2. Cite sources from context
3. If context doesn't have the answer, say "I don't have information on this"
4. Provide examples and mnemonics
5. Keep sentences under 15 words
6. Bilingual output if requested`;

    const userPrompt = `Context from knowledge base:
${contextChunks || 'No relevant context found - answer from general UPSC knowledge'}

Student's question (${subject || 'General'}): ${question}
${topic ? `Topic: ${topic}` : ''}

Provide a clear, structured answer with key points and examples.`;

    // Call AI with RAG context
    const result = await callAI(userPrompt, {
      system: systemPrompt,
      temperature: 0.7,
      maxTokens: 2000,
    });

    // Extract sources from context
    const sources = chunks?.slice(0, 3).map((c: any) => ({
      title: c.source_title,
      type: c.source_type,
      url: c.source_url || '',
    })) || [];

    // Generate follow-up questions
    const followUps = await callAI(`Generate 3 follow-up questions for: ${question}`, {
      system: 'Generate thought-provoking follow-up questions for UPSC students.',
      maxTokens: 200,
      skipSimplifiedLanguage: true,
    });

    // Save doubt thread
    const { data: thread } = await supabase.from('doubt_threads').insert({
      user_id: userId,
      title: question.slice(0, 100),
      subject: subject || 'General',
      topic: topic || null,
    }).select().single();

    // Save question and answer
    if (thread) {
      await supabase.from('doubt_questions').insert({
        thread_id: thread.id,
        question: question,
        attachments: attachments || [],
      });

      await supabase.from('doubt_answers').insert({
        thread_id: thread.id,
        answer_text: result,
        sources: sources,
        follow_up_questions: followUps.split('\n').filter((l: string) => l.trim()),
        ai_provider: 'callAI',
      });
    }

    return new Response(JSON.stringify({
      data: {
        answer: result,
        sources,
        followUpQuestions: followUps.split('\n').filter((l: string) => l.trim()),
        threadId: thread?.id,
      },
      provider: 'callAI',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('doubt-solver-pipe error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Simple embedding via AI (until pgvector integration)
async function getEmbedding(text: string): Promise<number[]> {
  // Placeholder: return zeros until embedding service is wired
  // In production, use Supabase pgvector or external embedding API
  return new Array(1536).fill(0);
}
