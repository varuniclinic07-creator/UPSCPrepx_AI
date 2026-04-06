// ═══════════════════════════════════════════════════════════════════════════
// REDIS RATE LIMITER - DEPRECATED, USE rate-limiter.ts INSTEAD
// This file is kept for backwards compatibility but all functions
// now delegate to the main rate-limiter.ts module
// ═══════════════════════════════════════════════════════════════════════════

import {
  getRateLimiter,
  checkRateLimit as mainCheckRateLimit,
  getRateLimitHeaders as mainGetRateLimitHeaders,
  type RateLimitResult
} from './rate-limiter';
import type { AIProvider } from './providers/provider-types';

const RATE_LIMIT = 10;
const WINDOW_MS = 60 * 1000;

/**
 * @deprecated Use checkRateLimit from rate-limiter.ts instead
 * Kept for backwards compatibility
 */
export async function checkRateLimit(
  providerOrUserId: string = 'global'
): Promise<{
  allowed: boolean;
  remaining: number;
  resetIn: number;
  retryAfter?: number;
}> {
  try {
    // Determine if first arg is a provider or userId
    const isProvider = providerOrUserId === 'a4f' || providerOrUserId === 'groq';
    const provider: AIProvider = isProvider ? providerOrUserId as AIProvider : 'a4f';
    const userId = isProvider ? undefined : providerOrUserId;

    const result = await mainCheckRateLimit(provider, userId);

    return {
      allowed: result.allowed,
      remaining: result.remainingRequests,
      resetIn: result.retryAfter || WINDOW_MS,
      retryAfter: result.retryAfter,
    };
  } catch (error) {
    console.error('[Redis Rate Limiter] Error:', error);
    return {
      allowed: true,
      remaining: RATE_LIMIT,
      resetIn: WINDOW_MS,
    };
  }
}

/**
 * @deprecated Use waitForRateLimit from rate-limiter.ts instead
 */
export async function waitForRateLimit(
  providerOrUserId: string = 'global'
): Promise<void> {
  const result = await checkRateLimit(providerOrUserId);

  if (!result.allowed && result.retryAfter) {
    console.log(`[Rate Limiter] Waiting ${result.retryAfter}ms for rate limit reset...`);
    await new Promise((resolve) => setTimeout(resolve, result.retryAfter! + 100));
    return waitForRateLimit(providerOrUserId);
  }
}

/**
 * @deprecated Use getRateLimitHeaders from rate-limiter.ts instead
 */
export async function getRateLimitHeaders(
  resultOrId: RateLimitResult | string = 'global'
): Promise<Record<string, string>> {
  if (typeof resultOrId === 'object') {
    return mainGetRateLimitHeaders(resultOrId);
  }

  const result = await checkRateLimit(resultOrId);
  const now = Date.now();

  return {
    'X-RateLimit-Limit': String(RATE_LIMIT),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(now + WINDOW_MS),
  };
}

/**
 * Get current rate limit status
 */
export async function getRateLimitStatus(userId: string = 'global'): Promise<{
  limit: number;
  used: number;
  remaining: number;
}> {
  const result = await checkRateLimit(userId);
  return {
    limit: RATE_LIMIT,
    used: RATE_LIMIT - result.remaining,
    remaining: result.remaining,
  };
}

/**
 * Close Redis connection (no-op, handled by main rate-limiter)
 */
export async function closeRedis(): Promise<void> {
  // Cleanup handled by main rate-limiter module
}
