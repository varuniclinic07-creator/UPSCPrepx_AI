import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { callAI } from '../_shared/ai-provider.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Edge Function: custom-notes-pipe
 * F4: User Content Studio — AI-powered note editing, summarization, templates
 * v8 Spec: Frontend → Edge Function → AI Editing → Enhanced Notes
 */

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const body = await req.json();
    const { userId, action, noteContent, template } = body;

    if (!action) {
      return new Response(JSON.stringify({ error: 'Action is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Summarize notes
    if (action === 'summarize') {
      const summaryPrompt = `Summarize these UPSC notes into different lengths:

${noteContent?.slice(0, 5000) || 'No content provided'}

Provide:
1. 100-word summary (key points only)
2. 250-word summary (with examples)
3. Bullet-point revision notes
4. Mnemonic for key concepts

Use SIMPLIFIED language.`;

      const summary = await callAI(summaryPrompt, {
        system: 'UPSC notes summarizer. Create revision-friendly condensed notes.',
        maxTokens: 2000,
      });

      return new Response(JSON.stringify({
        data: { summary },
        provider: 'callAI',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Expand notes
    if (action === 'expand') {
      const expandPrompt = `Expand these notes with more depth:

${noteContent?.slice(0, 2000) || 'No content provided'}

Add:
1. Detailed explanations
2. Real-life examples
3. Case studies
4. Previous year question connections
5. Current affairs links

Use SIMPLIFIED language.`;

      const expanded = await callAI(expandPrompt, {
        system: 'UPSC content expander. Add depth while keeping language simple.',
        maxTokens: 4000,
      });

      return new Response(JSON.stringify({
        data: { expanded },
        provider: 'callAI',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Apply template
    if (action === 'apply_template' && template && noteContent) {
      const templatePrompt = `Reformat these notes using the ${template} template:

Content: ${noteContent?.slice(0, 3000)}

Template structure: ${template}

Reorganize content to match template while preserving all information.`;

      const reformatted = await callAI(templatePrompt, {
        system: 'UPSC notes formatter. Apply structured templates consistently.',
        maxTokens: 3000,
      });

      return new Response(JSON.stringify({
        data: { reformatted },
        provider: 'callAI',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Improve language
    if (action === 'improve_language') {
      const improvePrompt = `Improve the language and clarity of these notes:

${noteContent?.slice(0, 3000) || 'No content provided'}

Fix:
- Grammar and spelling
- Sentence structure (keep under 15 words)
- Clarity and flow
- Add transition words
- Simplify complex terms

Use SIMPLIFIED language (10th grade level).`;

      const improved = await callAI(improvePrompt, {
        system: 'UPSC notes editor. Improve clarity while maintaining simplicity.',
        maxTokens: 3000,
      });

      return new Response(JSON.stringify({
        data: { improved },
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
    console.error('custom-notes-pipe error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
