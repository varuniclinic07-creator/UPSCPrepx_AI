/**
 * Phase 14: AI Provider Status API
 * Real-time provider health and routing metrics
 */

import { NextResponse } from 'next/server';
import { withSecurity } from '@/lib/security/security-middleware';
import { NextRequest } from 'next/server';
import { getAIProviderRouter } from '@/lib/ai/router/ai-provider-router';
import { getAdvancedLoadBalancer } from '@/lib/ai/router/load-balancer';
import { getProviderHealthChecker } from '@/lib/ai/router/health-checker';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/ai-providers/status
 * Returns real-time provider health and routing metrics
 */
export async function GET(request: NextRequest) {
  return withSecurity(
    request,
    async () => {
      try {
        const router = getAIProviderRouter();
        const loadBalancer = getAdvancedLoadBalancer();
        const healthChecker = getProviderHealthChecker();

        // Get all metrics
        const routingMetrics = router.getRoutingMetrics();
        const loadBalancerState = loadBalancer.getState();
        const healthResults = healthChecker.getLatestResults();

        // Build response
        const providers = Object.keys(routingMetrics.providerHealth).map((providerKey) => {
          const provider = providerKey as keyof typeof routingMetrics.providerHealth;
          const health = routingMetrics.providerHealth[provider];
          const load = loadBalancerState[provider];
          const healthResult = healthResults[provider];

          return {
            name: provider,
            health: {
              isHealthy: health.isHealthy,
              circuitState: health.circuitState,
              successRate: health.successRate,
              avgLatencyMs: health.avgLatencyMs,
              consecutiveFailures: health.consecutiveFailures,
              lastHealthCheck: health.lastHealthCheck,
            },
            load: {
              activeRequests: load?.activeRequests || 0,
              utilizationPercent: load?.capacities[provider]?.utilizationPercent || 0,
              weight: loadBalancerState.weights[provider] || 0,
            },
            lastCheck: healthResult ? {
              statusCode: healthResult.statusCode,
              latencyMs: healthResult.latencyMs,
              error: healthResult.error,
              timestamp: healthResult.timestamp,
            } : null,
          };
        });

        return NextResponse.json({
          success: true,
          data: {
            providers,
            timestamp: Date.now(),
            summary: {
              healthyCount: providers.filter((p) => p.health.isHealthy).length,
              totalProviders: providers.length,
              avgLatency:
                providers.reduce((sum, p) => sum + (p.health.avgLatencyMs || 0), 0) /
                providers.length,
              totalActiveRequests: providers.reduce((sum, p) => sum + p.load.activeRequests, 0),
            },
          },
        });
      } catch (error) {
        console.error('[AI Providers Status] Error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch provider status' },
          { status: 500 }
        );
      }
    },
    {
      requireAuth: true,
      requiredRole: 'admin',
      rateLimit: 'api',
    }
  );
}
