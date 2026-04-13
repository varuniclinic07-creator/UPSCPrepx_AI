/**
 * CRON: Syllabus Coverage Builder — Sunday 1:00am
 * Finds uncovered/stale subtopics in knowledge_nodes,
 * runs Research → Notes → Quiz pipeline for each.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // Find uncovered subtopics (no notes) or stale ones (freshness < 0.4)
    const { data: uncoveredNodes } = await supabase
      .from('knowledge_nodes')
      .select('id, title, subject, type')
      .eq('type', 'subtopic')
      .or('freshness_score.lt.0.4,source_count.eq.0')
      .limit(20); // Process 20 per run to stay within rate limits

    if (!uncoveredNodes || uncoveredNodes.length === 0) {
      return NextResponse.json({ success: true, message: 'All subtopics covered', processed: 0 });
    }

    const { hermes } = await import('@/lib/agents/orchestrator');
    const results = { processed: 0, notes: 0, quizzes: 0, errors: 0 };

    for (const node of uncoveredNodes) {
      try {
        // Step 1: Research
        const research = await hermes.dispatch({
          type: 'research_topic',
          nodeId: node.id,
          topic: node.title,
          subject: node.subject,
        });

        // Step 2: Generate notes
        const notes = await hermes.dispatch({
          type: 'generate_notes',
          nodeId: node.id,
          topic: node.title,
          subject: node.subject,
          payload: { sources: research.data?.sources },
        });
        if (notes.success) results.notes++;

        // Step 3: Generate quiz
        const quiz = await hermes.dispatch({
          type: 'generate_quiz',
          nodeId: node.id,
          topic: node.title,
          subject: node.subject,
          payload: { questionCount: 10 },
        });
        if (quiz.success) results.quizzes++;

        // Update freshness
        await supabase
          .from('knowledge_nodes')
          .update({ freshness_score: 1.0, last_verified_at: new Date().toISOString() })
          .eq('id', node.id);

        results.processed++;
      } catch (err) {
        console.error(`[cron/syllabus-coverage] Failed for ${node.title}:`, err);
        results.errors++;
      }
    }

    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    console.error('[cron/syllabus-coverage] Failed:', error);
    return NextResponse.json(
      { error: 'Syllabus coverage failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
