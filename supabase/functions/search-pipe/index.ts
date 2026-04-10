import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { callAI } from '../_shared/ai-provider.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Edge Function: search-pipe
 * F11: Smart Search — Hybrid vector + FTS search with AI synthesis
 * v8 Spec: Frontend → Edge Function → Vector/FTS → AI Synthesis → Results
 */

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const body = await req.json();
    const { query, filters, limit = 20 } = body;

    if (!query || query.trim().length < 2) {
      return new Response(JSON.stringify({ error: 'Query must be at least 2 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse filters
    const { subject, sourceType, syllabusNode } = filters || {};

    // Hybrid search: Vector similarity + Full-text search
    const queryEmbedding = await getEmbedding(query);

    const { data: vectorResults } = await supabase.rpc('match_knowledge_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.6,
      match_count: limit,
      filter_subject: subject || undefined,
    });

    const { data: ftsResults } = await supabase
      .from('knowledge_chunks')
      .select('*, syllabus_nodes(title)')
      .textSearch('content', query, { config: 'english' })
      .limit(limit);

    // Merge and deduplicate results
    const merged = mergeResults(vectorResults || [], ftsResults || []);

    // AI synthesis: Generate summarized answer from search results
    const topChunks = merged.slice(0, 5).map((c: any) => c.content).join('\n\n');
    const sources = merged.slice(0, 5).map((c: any) => ({
      title: c.source_title,
      type: c.source_type,
      syllabus: c.syllabus_nodes?.title,
    }));

    let synthesizedAnswer = '';
    if (topChunks) {
      synthesizedAnswer = await callAI(
        `Based on these search results, provide a concise answer to: "${query}"\n\n${topChunks}`,
        {
          system: 'Synthesize search results into a clear, concise answer. Cite sources.',
          maxTokens: 500,
        },
      );
    }

    return new Response(JSON.stringify({
      data: {
        query,
        results: merged.slice(0, limit),
        synthesizedAnswer,
        sources,
        totalResults: merged.length,
      },
      provider: 'hybrid_search',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('search-pipe error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Merge vector and FTS results, deduplicate by ID
function mergeResults(vector: any[], fts: any[]): any[] {
  const map = new Map();

  // Add vector results first (higher relevance)
  for (const item of vector) {
    map.set(item.id, { ...item, score: item.similarity || 0 });
  }

  // Add FTS results if not already present
  for (const item of fts) {
    if (!map.has(item.id)) {
      map.set(item.id, { ...item, score: 0.5 }); // FTS default score
    }
  }

  // Sort by score descending
  return Array.from(map.values()).sort((a, b) => b.score - a.score);
}

// Placeholder embedding (until pgvector integration)
async function getEmbedding(text: string): Promise<number[]> {
  return new Array(1536).fill(0);
}
