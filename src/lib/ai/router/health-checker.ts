/**
 * Phase 14: Provider Health Checker
 * Periodic health monitoring for AI providers
 */

import { ProviderName, PROVIDER_CONFIGS, getAIProviderRouter } from './ai-provider-router';

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH CHECK RESULT
// ═══════════════════════════════════════════════════════════════════════════

export interface HealthCheckResult {
  provider: ProviderName;
  isHealthy: boolean;
  latencyMs: number;
  statusCode?: number;
  error?: string;
  timestamp: number;
  details: {
    canConnect: boolean;
    hasValidKey: boolean;
    modelAvailable: boolean;
    rateLimitRemaining?: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH CHECKER CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class ProviderHealthChecker {
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL_MS: number;
  private isRunning: boolean = false;
  private lastResults: Map<ProviderName, HealthCheckResult> = new Map();
  private readonly router = getAIProviderRouter();

  constructor(checkIntervalMs: number = 30000) {
    this.CHECK_INTERVAL_MS = checkIntervalMs;
  }

  /**
   * Start periodic health checks
   */
  start(): void {
    if (this.checkInterval) {
      console.warn('[HealthChecker] Already running');
      return;
    }

    console.debug(`[HealthChecker] Starting health checks every ${this.CHECK_INTERVAL_MS}ms`);

    // Run initial check immediately
    this.runHealthCheck();

    // Then run on interval
    this.checkInterval = setInterval(() => {
      this.runHealthCheck();
    }, this.CHECK_INTERVAL_MS);
  }

  /**
   * Stop periodic health checks
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.debug('[HealthChecker] Stopped');
    }
  }

  /**
   * Run health check for all providers
   */
  private async runHealthCheck(): Promise<void> {
    if (this.isRunning) {
      console.debug('[HealthChecker] Previous check still running, skipping');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      const activeProviders = Object.values(PROVIDER_CONFIGS)
        .filter((config) => config.isActive)
        .map((config) => config.name);

      const checkPromises = activeProviders.map((provider) =>
        this.checkProvider(provider).catch((error) => {
          console.error(`[HealthChecker] ${provider} check failed:`, error);
          return {
            provider,
            isHealthy: false,
            latencyMs: 0,
            error: error instanceof Error ? error.message : String(error),
            timestamp: Date.now(),
            details: {
              canConnect: false,
              hasValidKey: false,
              modelAvailable: false,
            },
          } as HealthCheckResult;
        })
      );

      const results = await Promise.all(checkPromises);

      // Store results
      for (const result of results) {
        this.lastResults.set(result.provider, result);

        // Update router health status
        if (result.isHealthy) {
          this.router.recordSuccess(result.provider, result.latencyMs);
        } else {
          this.router.recordFailure(result.provider, result.error ? new Error(result.error) : undefined);
        }
      }

      const duration = Date.now() - startTime;
      console.debug(`[HealthChecker] Completed in ${duration}ms`);
    } catch (error) {
      console.error('[HealthChecker] Error during health check:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Check individual provider health
   */
  private async checkProvider(provider: ProviderName): Promise<HealthCheckResult> {
    const config = PROVIDER_CONFIGS[provider];
    const startTime = Date.now();

    // Check if API key is configured
    const apiKey = process.env[config.apiKeyEnv];
    const hasValidKey = !!apiKey && apiKey.length > 0;

    if (!hasValidKey) {
      return {
        provider,
        isHealthy: false,
        latencyMs: 0,
        error: 'No API key configured',
        timestamp: Date.now(),
        details: {
          canConnect: false,
          hasValidKey: false,
          modelAvailable: false,
        },
      };
    }

    try {
      // Perform a minimal health check request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // For providers with OpenAI-compatible API, use models endpoint
      const healthUrl = provider === 'anthropic'
        ? `${config.baseUrl}/v1/messages`
        : `${config.baseUrl}/models`;

      const response = await fetch(healthUrl, {
        method: provider === 'anthropic' ? 'POST' : 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          ...(provider === 'anthropic' ? {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          } : {}),
        },
        body: provider === 'anthropic' ? JSON.stringify({
          model: config.models[0],
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }],
        }) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const latencyMs = Date.now() - startTime;

      const isHealthy = response.ok || response.status === 429; // 429 means API is up but rate limited
      const statusCode = response.status;

      // Parse rate limit headers if available
      let rateLimitRemaining: number | undefined;
      if (response.headers.has('x-ratelimit-remaining-requests')) {
        rateLimitRemaining = parseInt(response.headers.get('x-ratelimit-remaining-requests') || '0');
      } else if (response.headers.has('ratelimit-remaining-requests')) {
        rateLimitRemaining = parseInt(response.headers.get('ratelimit-remaining-requests') || '0');
      }

      return {
        provider,
        isHealthy,
        latencyMs,
        statusCode,
        timestamp: Date.now(),
        details: {
          canConnect: true,
          hasValidKey: true,
          modelAvailable: statusCode !== 404,
          rateLimitRemaining,
        },
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        provider,
        isHealthy: false,
        latencyMs,
        error: errorMessage,
        timestamp: Date.now(),
        details: {
          canConnect: false,
          hasValidKey: true,
          modelAvailable: false,
        },
      };
    }
  }

  /**
   * Get latest health check results
   */
  getLatestResults(): Record<ProviderName, HealthCheckResult | undefined> {
    const results: Record<ProviderName, HealthCheckResult | undefined> = {} as any;

    Object.keys(PROVIDER_CONFIGS).forEach((key) => {
      const provider = key as ProviderName;
      results[provider] = this.lastResults.get(provider);
    });

    return results;
  }

  /**
   * Check if a provider is healthy
   */
  isHealthy(provider: ProviderName): boolean {
    const result = this.lastResults.get(provider);
    if (!result) return true; // Assume healthy if no data yet

    // Consider healthy if last check passed or was rate limited
    return result.isHealthy || result.statusCode === 429;
  }

  /**
   * Get healthy providers
   */
  getHealthyProviders(): ProviderName[] {
    return Object.keys(PROVIDER_CONFIGS)
      .filter((key) => this.isHealthy(key as ProviderName)) as ProviderName[];
  }

  /**
   * Get average latency for a provider
   */
  getAverageLatency(provider: ProviderName): number {
    const result = this.lastResults.get(provider);
    return result?.latencyMs || 0;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

let healthCheckerInstance: ProviderHealthChecker | null = null;

export function getProviderHealthChecker(intervalMs?: number): ProviderHealthChecker {
  if (!healthCheckerInstance) {
    healthCheckerInstance = new ProviderHealthChecker(intervalMs);
  }
  return healthCheckerInstance;
}
