import { NextRequest, NextResponse } from 'next/server';
import { generateExplanation, isAutodocAvailable } from '@/lib/agentic/autodoc-client';
import { requireAuth } from '@/lib/auth/session';
import { withErrorHandler } from '@/lib/errors/error-handler';
import { z } from 'zod';
import { captureException } from '@/lib/monitoring/sentry';
import { traceRequest } from '@/lib/monitoring/tracing';

const explainSchema = z.object({
  content: z.string().min(1).max(10000),
  context: z.string().optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  return traceRequest('agentic.explain', async () => {
    try {
      await requireAuth();

      if (!isAutodocAvailable()) {
        return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
      }

      const body = await request.json();
      const { content, context } = explainSchema.parse(body);

      const explanation = await generateExplanation(content, context);

      if (!explanation) {
        return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
      }

      return NextResponse.json({ explanation });
    } catch (error) {
      captureException(error as Error, { endpoint: 'agentic.explain' });
      throw error;
    }
  });
});