import { NextRequest, NextResponse } from 'next/server';
import { generateExplanation, isAutodocAvailable } from '@/lib/agentic/autodoc-client';
import { requireAuth } from '@/lib/auth/session';
import { withErrorHandler } from '@/lib/errors/error-handler';
import { z } from 'zod';
import { captureException } from '@/lib/monitoring/sentry';
import { traceRequest } from '@/lib/monitoring/tracing';
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rate-limiter';

export const dynamic = 'force-dynamic';


const explainSchema = z.object({
  content: z.string().min(1).max(10000),
  context: z.string().optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  return traceRequest('agentic.explain', async () => {
    try {
      const session = await requireAuth();

      // Rate limit check using authenticated user ID
      const rateLimit = await checkRateLimit(session.id, RATE_LIMITS.agenticQuery);
      if (!rateLimit.success) {
        return NextResponse.json(
          { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
          { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter || 60) } }
        );
      }

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