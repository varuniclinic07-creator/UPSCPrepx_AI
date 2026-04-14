/**
 * CRON: Video & Animation Generation — Sunday 3:00am
 * For subtopics without videos, generates scripts via VideoAgent + AnimationAgent.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // Find subtopics without video content
    const { data: nodes } = await supabase
      .from('knowledge_nodes')
      .select('id, title, subject, type')
      .eq('type', 'subtopic')
      .limit(10); // 10 per run to stay within rendering limits

    if (!nodes || nodes.length === 0) {
      return NextResponse.json({ success: true, message: 'No nodes to process', processed: 0 });
    }

    const { hermes } = await import('@/lib/agents/orchestrator');
    const results = { videos: 0, animations: 0, errors: 0 };

    for (const node of nodes) {
      try {
        // Generate video
        const video = await hermes.dispatch({
          type: 'generate_video',
          nodeId: node.id,
          topic: node.title,
          subject: node.subject ?? undefined,
        });
        if (video.success) results.videos++;

        // Generate animation for Ethics topics or concept diagrams
        if (node.subject === 'GS4' || node.type === 'subtopic') {
          const animation = await hermes.dispatch({
            type: 'generate_animation',
            nodeId: node.id,
            topic: node.title,
            subject: node.subject ?? undefined,
            payload: { animationType: node.subject === 'GS4' ? 'case_study' : 'concept' },
          });
          if (animation.success) results.animations++;
        }
      } catch (err) {
        console.error(`[cron/video-generation] Failed for ${node.title}:`, err);
        results.errors++;
      }
    }

    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    console.error('[cron/video-generation] Failed:', error);
    return NextResponse.json(
      { error: 'Video generation failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
