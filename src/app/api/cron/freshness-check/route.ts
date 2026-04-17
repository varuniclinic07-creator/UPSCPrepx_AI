/**
 * CRON: Freshness Check — Daily 4:00am
 * Decays freshness_score on knowledge_nodes that haven't been verified recently.
 * Nodes older than 7 days without verification lose 0.1 freshness per day.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { isAuthorizedCronRequest } from '@/lib/cron/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorizedCronRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // Decay freshness for nodes not verified in 7+ days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: staleNodes, error } = await supabase
      .from('knowledge_nodes')
      .select('id, freshness_score')
      .lt('last_verified_at', sevenDaysAgo)
      .gt('freshness_score', 0.1);

    if (error || !staleNodes) {
      return NextResponse.json({ success: true, decayed: 0, message: 'No stale nodes or query error' });
    }

    let decayed = 0;
    for (const node of staleNodes) {
      const newScore = Math.max(0.1, (node.freshness_score || 1) - 0.1);
      await supabase
        .from('knowledge_nodes')
        .update({ freshness_score: newScore, updated_at: new Date().toISOString() })
        .eq('id', node.id);
      decayed++;
    }

    return NextResponse.json({ success: true, decayed, total: staleNodes.length });
  } catch (error) {
    console.error('[cron/freshness-check] Failed:', error);
    return NextResponse.json(
      { error: 'Freshness check failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
