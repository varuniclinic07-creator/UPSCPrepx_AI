import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { scrapeCurrentAffairs, NEWS_SOURCES } from '@/lib/scraping/crawl4ai-client';
import { isAuthorizedCronRequest } from '@/lib/cron/auth';

export const dynamic = 'force-dynamic';

/**
 * CRON job to scrape current affairs from various sources
 * Triggered via HTTP request (protected by secret)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify cron secret
    if (!isAuthorizedCronRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Initialise Supabase
    const supabase = await createClient();

    // 3. Scrape latest news
    const sources = Object.values(NEWS_SOURCES);
    const results = await scrapeCurrentAffairs(sources);

    if (results.length === 0) {
      return NextResponse.json({ message: 'No new items found' });
    }

    // 4. Transform and insert into database
    const formattedItems = results.map((item: any) => ({
      title: item.title,
      summary: item.markdown?.substring(0, 500) || 'No summary available',
      full_content: item.markdown || item.content,
      source_url: item.url,
      source_name: item.url.includes('pib.gov.in') ? 'PIB' :
        item.url.includes('thehindu.com') ? 'The Hindu' :
          item.url.includes('indianexpress.com') ? 'Indian Express' : 'General',
      category: 'General',
      published_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Deduplicate and insert (upsert based on source_url)
    const { data, error } = await (supabase.from('current_affairs') as any)
      .upsert(formattedItems, { onConflict: 'source_url' });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      inserted: (data as any)?.length || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[CRON] Scrape current affairs error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to scrape current affairs' },
      { status: 500 }
    );
  }
}

// Support GET for testing (only in dev)
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }
  return POST(request);
}
