import { NextRequest, NextResponse } from 'next/server';
import { searchFiles, isFileSearchAvailable } from '@/lib/agentic/file-search-client';
import { requireAuth } from '@/lib/auth/session';
import { withErrorHandler } from '@/lib/errors/error-handler';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const searchSchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().min(1).max(50).optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  await requireAuth();

  if (!isFileSearchAvailable()) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const body = await request.json();
  const { query, limit } = searchSchema.parse(body);

  const results = await searchFiles(query, limit);

  return NextResponse.json({ results, total: results.length });
});
