import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { callAI } from '../_shared/ai-provider.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Edge Function: legal-pipe
 * F12: Legal/Constitutional Explainer — Article explanations with case law
 * v8 Spec: Frontend → Edge Function → callAI() → Structured Legal Analysis
 */

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const body = await req.json();
    const { article, topic, query } = body;

    if (!article && !topic && !query) {
      return new Response(JSON.stringify({ error: 'Article, topic, or query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch relevant legal content from database
    const { data: legalContent } = await supabase
      .from('knowledge_chunks')
      .select('content, source_title')
      .or(`source_type.eq.legal,source_type.eq.constitution`)
      .limit(10);

    const contextChunks = legalContent?.map((c: any) => `${c.source_title}: ${c.content}`).join('\n\n') || '';

    // Build explanation prompt
    const explanationPrompt = `Explain this Indian Constitutional provision for UPSC aspirants:
${article ? `Article: ${article}` : ''}
${topic ? `Topic: ${topic}` : ''}
${query ? `Query: ${query}` : ''}

Context from legal database:
${contextChunks || 'Use general constitutional knowledge'}

Provide:
1. Article text (if applicable)
2. Simple explanation (10th grade level)
3. Historical background
4. Key Supreme Court judgments
5. Current relevance
6. UPSC Prelims + Mains angles
7. Mnemonic for retention

Use SIMPLIFIED language throughout.`;

    const explanation = await callAI(explanationPrompt, {
      system: 'You are a Constitutional law expert teaching UPSC aspirants. Make complex legal concepts simple.',
      maxTokens: 3000,
    });

    // Extract related articles
    const relatedPrompt = `From this explanation, list 3-5 related Constitutional articles:
${explanation.slice(0, 1000)}...

Return as JSON array: [{ article: "Article X", title: "..." }]`;

    const relatedJson = await callAI(relatedPrompt, {
      system: 'Legal content analyzer.',
      maxTokens: 500,
      skipSimplifiedLanguage: true,
    });

    let relatedArticles = [];
    try {
      const jsonMatch = relatedJson.match(/\[[\s\S]*\]/);
      relatedArticles = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {}

    return new Response(JSON.stringify({
      data: {
        explanation,
        relatedArticles,
        sources: legalContent?.slice(0, 5).map((c: any) => c.source_title) || [],
      },
      provider: 'callAI',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('legal-pipe error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
