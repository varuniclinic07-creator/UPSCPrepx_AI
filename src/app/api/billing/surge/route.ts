/**
 * Phase 15: Surge Status API
 * Get current surge pricing status
 */

import { NextResponse } from 'next/server';
import { withSecurity } from '@/lib/security/security-middleware';
import { NextRequest } from 'next/server';
import { getSurgePricingManager } from '@/lib/billing/surge-pricing';

export const dynamic = 'force-dynamic';

/**
 * GET /api/billing/surge
 * Get current surge pricing status
 */
export async function GET(request: NextRequest) {
  return withSecurity(
    request,
    async () => {
      try {
        const surgeManager = getSurgePricingManager();
        const analytics = surgeManager.getAnalytics();

        // Get demand metrics
        const demandMetrics = await surgeManager.getDemandMetrics();

        return NextResponse.json({
          success: true,
          data: {
            surge: {
              active: analytics.isActive,
              multiplier: analytics.currentMultiplier,
              demandLevel: analytics.demandLevel,
              reason: surgeManager.getCurrentState().reason,
              estimatedEnd: surgeManager.getCurrentState().estimatedEnd,
            },
            metrics: {
              utilizationPercent: demandMetrics.utilizationPercent,
              healthyProviders: demandMetrics.providerHealth.filter((p) => p.healthy).length,
              totalProviders: demandMetrics.providerHealth.length,
              avgLatencyMs: demandMetrics.avgLatencyMs,
              errorRate: demandMetrics.errorRate,
            },
            config: {
              enabled: analytics.config.enabled,
              cooldownMinutes: analytics.config.cooldownMinutes,
            },
          },
        });
      } catch (error) {
        console.error('[Surge Status] Error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch surge status' },
          { status: 500 }
        );
      }
    },
    {
      requireAuth: false, // Public endpoint - clients need to know surge status
      rateLimit: 'api',
    }
  );
}
