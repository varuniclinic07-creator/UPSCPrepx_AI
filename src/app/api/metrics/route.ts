/**
 * Prometheus Metrics Endpoint
 * Exposes metrics in Prometheus format for scraping
 * Production-ready with full integration to metrics system
 */

import { NextResponse } from 'next/server';
import { getMetrics } from '@/lib/observability/metrics';
import { withSecurity } from '@/lib/security/security-middleware';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/metrics
 * Returns metrics in Prometheus exposition format
 *
 * Security: Admin-only access with rate limiting
 */
export async function GET(request: NextRequest) {
  return withSecurity(
    request,
    async () => {
      try {
        const metrics = await getMetrics();

        return new Response(metrics, {
          headers: {
            'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });
      } catch (error) {
        console.error('[Metrics] Error:', error);
        return NextResponse.json(
          { error: 'Failed to collect metrics' },
          { status: 500 }
        );
      }
    },
    {
      requireAuth: true,
      requiredRole: 'admin',
      rateLimit: 'admin',
      validateOrigin: true,
    }
  );
}
