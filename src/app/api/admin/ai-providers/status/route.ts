/**
 * AI Provider Status API
 * Returns provider configuration status.
 * Legacy router/load-balancer/health-checker removed — routing is now
 * handled per-agent via callAI() providerPreferences.
 */

import { NextResponse } from 'next/server';
import { withSecurity } from '@/lib/security/security-middleware';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const PROVIDERS = ['ollama', 'groq', 'nvidia', 'gemini'] as const;

const ENV_KEYS: Record<string, string> = {
  ollama: 'OLLAMA_BASE_URL',
  groq: 'GROQ_API_KEY',
  nvidia: 'NVIDIA_NIM_API_KEY',
  gemini: 'GEMINI_API_KEY',
};

/**
 * GET /api/admin/ai-providers/status
 * Returns which providers have keys configured.
 */
export async function GET(request: NextRequest) {
  return withSecurity(
    request,
    async () => {
      try {
        const providers = PROVIDERS.map((name) => {
          const envKey = ENV_KEYS[name];
          const hasKey = !!process.env[envKey];
          return {
            name,
            health: {
              isHealthy: hasKey,
              circuitState: 'CLOSED' as const,
              successRate: hasKey ? 1 : 0,
              avgLatencyMs: 0,
              consecutiveFailures: 0,
              lastHealthCheck: Date.now(),
            },
            load: {
              activeRequests: 0,
              utilizationPercent: 0,
              weight: hasKey ? 1 : 0,
            },
            lastCheck: null,
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
              avgLatency: 0,
              totalActiveRequests: 0,
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
