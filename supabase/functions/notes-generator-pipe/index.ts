import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { callAI } from '../_shared/ai-provider.ts';
import { checkAccess } from '../_shared/entitlement.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Edge Function: notes-generator-pipe
 * F3/F4: Smart Notes Generator — Generate structured notes with RAG
 * v8 Spec: Frontend → Edge Function → RAG → callAI() → Structured Notes
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
    const { userId, topic, syllabusNodeId, brevityLevel, subject } = body;

    if (!topic) {
      return new Response(JSON.stringify({ error: 'Topic is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Entitlement check (free: 2 notes/day, pro: 10, ultimate: unlimited)
    const access = await checkAccess(userId, 'notes_generate');
    if (!access.allowed) {
      return new Response(JSON.stringify({ error: access.reason, remaining: access.remaining }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch syllabus node context if provided
    let syllabusContext = '';
    if (syllabusNodeId) {
      const { data: node } = await supabase
        .from('syllabus_nodes')
        .select('title, description, keywords, weightage')
        .eq('id', syllabusNodeId)
        .single();

      if (node) {
        syllabusContext = `Syllabus Context:
- Topic: ${node.title}
- Description: ${node.description || 'N/A'}
- Keywords: ${node.keywords?.join(', ') || 'N/A'}
- Weightage: ${node.weightage}/100
`;
      }
    }

    // RAG: Fetch relevant knowledge chunks
    const { data: chunks } = await supabase
      .from('knowledge_chunks')
      .select('content, source_title, source_type')
      .eq('subject', subject || 'General')
      .limit(10);

    const contextChunks = chunks?.map((c: any) => `Source: ${c.source_title}\n${c.content}`).join('\n\n') || '';

    // Brevity levels
    const brevityConfig = {
      '100': { words: 100, tokens: 150, label: 'Ultra-concise key points' },
      '250': { words: 250, tokens: 350, label: 'Brief overview' },
      '500': { words: 500, tokens: 700, label: 'Comprehensive summary' },
      '1000': { words: 1000, tokens: 1400, label: 'Detailed notes' },
      'comprehensive': { words: 2000, tokens: 3000, label: 'Complete detailed notes' },
    };

    const config = brevityConfig[brevityLevel as keyof typeof brevityConfig] || brevityConfig['500'];

    // Build generation prompt
    const systemPrompt = `You are an expert UPSC educator creating study notes.
Rules:
1. Use SIMPLIFIED language (10th grade level)
2. Hindi/English bilingual if requested
3. Include mnemonics, memory tips
4. Real-life Indian examples
5. Exam-focused content
6. Markdown formatting with headers, bullets

Structure:
# Topic Title
## Key Concepts
## Detailed Explanation
## Examples/Case Studies
## Previous Year Questions (if relevant)
## Memory Tips
## Sources`;

    const userPrompt = `${syllabusContext}
Topic: ${topic}
Subject: ${subject || 'General'}
Brevity: ${config.label} (~${config.words} words)

Knowledge Base Context:
${contextChunks || 'No specific context available - use general UPSC knowledge'}

Generate structured notes:`;

    // Generate notes
    const notes = await callAI(userPrompt, {
      system: systemPrompt,
      maxTokens: config.tokens,
    });

    // Save generated notes
    const { data: noteRecord } = await supabase.from('ai_notes').insert({
      syllabus_node_id: syllabusNodeId || null,
      topic_slug: topic.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: topic,
      content: notes,
      subject: subject || 'General',
      brevity_level: brevityLevel || '500',
      ai_provider: 'callAI',
      sources: chunks?.slice(0, 5).map((c: any) => c.source_title) || [],
    }).select().single();

    // Track usage
    await supabase.rpc('increment_usage', {
      p_user_id: userId,
      p_feature: 'notes_generate',
    });

    return new Response(JSON.stringify({
      data: {
        noteId: noteRecord?.id,
        content: notes,
        wordCount: notes.split(/\s+/).length,
        sources: chunks?.slice(0, 5).map((c: any) => c.source_title) || [],
      },
      provider: 'callAI',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('notes-generator-pipe error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
