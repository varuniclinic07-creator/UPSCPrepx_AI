import { NextRequest, NextResponse } from 'next/server';
import { searchWeb, searchNews, isWebSearchAvailable } from '@/lib/agentic/web-search-client';
import { requireAuth } from '@/lib/auth/session';
import { withErrorHandler } from '@/lib/errors/error-handler';
import { z } from 'zod';

const searchSchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().min(1).max(50).optional(),
  type: z.enum(['web', 'news']).optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  await requireAuth();

  if (!isWebSearchAvailable()) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const body = await request.json();
  const { query, limit, type = 'web' } = searchSchema.parse(body);

  const results = type === 'news' 
    ? await searchNews(query, limit)
    : await searchWeb(query, limit);

  return NextResponse.json({ results, total: results.length });
});
