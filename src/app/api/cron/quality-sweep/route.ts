/**
 * CRON: Quality Sweep — Daily 3:00am
 * Re-scores content_queue items older than 7 days to catch quality drift.
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorizedCronRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { qualityAgent } = await import('@/lib/agents/quality-agent');
    const result = await qualityAgent.sweepStale();

    return NextResponse.json({
      success: true,
      reviewed: result.reviewed,
      approved: result.approved,
      flagged: result.flagged,
    });
  } catch (error) {
    console.error('[cron/quality-sweep] Failed:', error);
    return NextResponse.json(
      { error: 'Quality sweep failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
