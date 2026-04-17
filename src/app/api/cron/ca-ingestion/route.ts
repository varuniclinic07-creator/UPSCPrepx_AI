/**
 * CRON: Daily Current Affairs Ingestion — 2:00am
 * CAIngestionAgent scrapes whitelisted sources, extracts articles,
 * normalizes to KG nodes, quality-scores, and queues for approval.
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorizedCronRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { caIngestionAgent } = await import('@/lib/agents/ca-ingestion-agent');
    const today = new Date().toISOString().split('T')[0];

    const result = await caIngestionAgent.execute({ date: today });

    // Quality-score ingested articles
    if (result.articles.length > 0) {
      const { qualityAgent } = await import('@/lib/agents/quality-agent');
      for (const article of result.articles.slice(0, 20)) {
        try {
          await qualityAgent.scoreContent({
            contentId: article.nodeId || '',
            content: `${article.title}\n\n${article.summary}`,
            contentType: 'ca_brief',
            topic: article.title,
          });
        } catch {
          // Quality scoring is best-effort
        }
      }
    }

    return NextResponse.json({
      success: true,
      date: today,
      processed: result.processed,
      articles: result.articles.length,
      errors: result.errors.length,
    });
  } catch (error) {
    console.error('[cron/ca-ingestion] Failed:', error);
    return NextResponse.json(
      { error: 'CA ingestion failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
