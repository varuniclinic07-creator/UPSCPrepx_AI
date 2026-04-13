/**
 * Admin Agent Runs API — /api/admin/agent-runs
 *
 * GET - List agent_runs with status/type filters + summary stats
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/security/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const agentType = url.searchParams.get('agent_type');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
    const offset = (page - 1) * limit;

    let query = (supabase.from('agent_runs') as any)
      .select('*', { count: 'exact' })
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (agentType) query = query.eq('agent_type', agentType);

    const { data, error, count } = await query;
    if (error) throw error;

    // Summary stats — last 24h
    const dayAgo = new Date(Date.now() - 86400000).toISOString();
    const { data: recentRuns } = await (supabase.from('agent_runs') as any)
      .select('status, agent_type, nodes_processed, content_generated, started_at, completed_at')
      .gte('started_at', dayAgo);

    const stats = {
      total_24h: recentRuns?.length || 0,
      running: 0,
      completed: 0,
      failed: 0,
      partial: 0,
      nodes_processed_24h: 0,
      content_generated_24h: 0,
      avg_duration_sec: 0,
    };

    let totalDuration = 0;
    let durationCount = 0;

    for (const run of recentRuns || []) {
      const s = run.status as keyof typeof stats;
      if (typeof stats[s] === 'number') (stats[s] as number)++;
      stats.nodes_processed_24h += run.nodes_processed || 0;
      stats.content_generated_24h += run.content_generated || 0;

      if (run.completed_at && run.started_at) {
        const dur = (new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000;
        totalDuration += dur;
        durationCount++;
      }
    }

    stats.avg_duration_sec = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0;

    // Agent type breakdown
    const agentBreakdown: Record<string, number> = {};
    for (const run of recentRuns || []) {
      agentBreakdown[run.agent_type] = (agentBreakdown[run.agent_type] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      data: {
        runs: data || [],
        stats,
        agentBreakdown,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
    });
  } catch (error) {
    console.error('Agent runs GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
