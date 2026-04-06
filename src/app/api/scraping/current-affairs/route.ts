import { NextRequest, NextResponse } from 'next/server';
import { scrapeCurrentAffairs, NEWS_SOURCES } from '@/lib/scraping/crawl4ai-client';
import { requireAdmin } from '@/lib/auth/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { withErrorHandler } from '@/lib/errors/error-handler';
import { logAuditEvent } from '@/lib/audit/audit-service';
import { z } from 'zod';

const MAX_SOURCES = 10;

const scrapeSchema = z.object({
  sources: z.array(z.string().url()).max(MAX_SOURCES).optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const admin = await requireAdmin();

  const body = await request.json();
  const { sources = [NEWS_SOURCES.PIB, NEWS_SOURCES.THE_HINDU] } = scrapeSchema.parse(body);

  const articles = await scrapeCurrentAffairs(sources);

  const supabase = await createServerSupabaseClient();

  const insertData = articles.map((article) => ({
    title: article.title.substring(0, 500),
    summary: article.content.substring(0, 500),
    full_content: article.content.substring(0, 50000),
    source_url: article.url,
    source_name: new URL(article.url).hostname,
    category: 'current_affairs',
    published_date: new Date().toISOString().split('T')[0],
    upsc_relevance: 'High',
    prelims_relevance: true,
    mains_relevance: true,
  }));

  const { data, error } = await (supabase.from('current_affairs') as any)
    .insert(insertData)
    .select();

  if (error) throw error;

  await logAuditEvent({
    userId: admin.id,
    action: 'current_affairs.scraped',
    resourceType: 'current_affairs',
    newValues: { count: data.length, sources: sources.length },
    ipAddress: request.headers.get('x-forwarded-for') || request.ip,
  });

  return NextResponse.json({
    success: true,
    scraped: articles.length,
    stored: data.length,
    articles: data,
  });
});
