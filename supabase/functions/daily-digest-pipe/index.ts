import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { callAI } from '../_shared/ai-provider.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Edge Function: daily-digest-pipe
 * F2: Daily Current Affairs — Generate daily digest with syllabus mapping
 * v8 Spec: Frontend → Edge Function → callAI() → Structured Digest
 */

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const body = await req.json();
    const { date, topics } = body;

    // Fetch current affairs articles for the date
    const { data: articles } = await supabase
      .from('daily_current_affairs')
      .select('*')
      .eq('published_date', date || new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false });

    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({
        data: { articles: [], summary: 'No articles for this date' },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate digest summary
    const articlesText = articles.map((a: any) => `
Title: ${a.title}
Category: ${a.category}
Summary: ${a.summary}
Source: ${a.source_url}
`).join('\n\n');

    const digestPrompt = `Generate a UPSC-focused daily digest from these current affairs:

${articlesText}

For each article:
1. Explain in simple language (10th grade level)
2. Map to UPSC syllabus (GS1/GS2/GS3/GS4)
3. Highlight key facts for Prelims
4. Suggest potential Mains questions
5. Add mnemonics or memory tips

Format as structured markdown with clear sections.`;

    const digest = await callAI(digestPrompt, {
      system: 'You are a UPSC current affairs expert. Make complex news simple and exam-relevant.',
      maxTokens: 4000,
    });

    // Generate MCQs from current affairs
    const mcqPrompt = `Generate 5 MCQs from these current affairs for UPSC Prelims:

${articlesText}

Each MCQ must:
- Have 4 options (a, b, c, d)
- One correct answer
- Detailed explanation
- Match UPSC Prelims style

Return as JSON array.`;

    const mcqJson = await callAI(mcqPrompt, {
      system: 'UPSC Prelims question setter.',
      maxTokens: 2000,
      skipSimplifiedLanguage: true,
    });

    let mcqs = [];
    try {
      const jsonMatch = mcqJson.match(/\[[\s\S]*\]/);
      mcqs = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {}

    // Save digest
    const { data: digestRecord } = await supabase.from('monthly_compilations').insert({
      title: `Daily Digest - ${date}`,
      content: digest,
      month: date?.slice(0, 7) || new Date().toISOString().slice(0, 7),
    }).select().single();

    return new Response(JSON.stringify({
      data: {
        digestId: digestRecord?.id,
        articles,
        digest,
        mcqs,
        totalArticles: articles.length,
      },
      provider: 'callAI',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('daily-digest-pipe error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
