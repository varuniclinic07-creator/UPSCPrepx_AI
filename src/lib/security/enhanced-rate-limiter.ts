/**
 * Enhanced Rate Limiting with Adaptive Throttling
 * Distributed rate limiting with Redis, IP-based + user-based limits
 * OWASP-compliant protection for UPSC PrepX-AI
 */

import { getRedis } from '@/lib/redis/client';
import { NextRequest, NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════
// IN-MEMORY FALLBACK (for development)
// ═══════════════════════════════════════════════════════════

const memoryStore = new Map<string, { count: number; resetAt: number }>();

// ═══════════════════════════════════════════════════════════
// RATE LIMIT CONFIGURATION
// ═══════════════════════════════════════════════════════════

export interface RateLimitConfig {
  limit: number; // Max requests
  window: number; // Window in seconds
  prefix: string; // Key prefix
  blockDuration?: number; // Block duration after exceeding (seconds)
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
  blocked?: boolean;
}

// ═══════════════════════════════════════════════════════════
// PREDEFINED RATE LIMITS
// ═══════════════════════════════════════════════════════════

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Authentication - strict limits
  auth: { limit: 5, window: 15 * 60, prefix: 'rl:auth', blockDuration: 300 },
  otp: { limit: 3, window: 60, prefix: 'rl:otp', blockDuration: 300 },
  register: { limit: 3, window: 60 * 60, prefix: 'rl:register', blockDuration: 3600 },
  login: { limit: 10, window: 15 * 60, prefix: 'rl:login', blockDuration: 300 },

  // AI Generation - expensive operations
  aiChat: { limit: 30, window: 60, prefix: 'rl:ai:chat' },
  aiGenerate: { limit: 10, window: 60 * 60, prefix: 'rl:ai:gen' },
  lectureGen: { limit: 3, window: 24 * 60 * 60, prefix: 'rl:lec' },
  notesGen: { limit: 20, window: 60 * 60, prefix: 'rl:notes' },
  quizGen: { limit: 15, window: 60 * 60, prefix: 'rl:quiz' },

  // Agentic services
  agenticQuery: { limit: 20, window: 60, prefix: 'rl:agentic' },
  webSearch: { limit: 10, window: 60, prefix: 'rl:websearch' },

  // File operations
  upload: { limit: 10, window: 60 * 60, prefix: 'rl:upload' },

  // General API
  api: { limit: 100, window: 60, prefix: 'rl:api' },

  // Admin operations
  admin: { limit: 60, window: 60, prefix: 'rl:admin' },

  // Payment operations
  payment: { limit: 5, window: 60, prefix: 'rl:payment', blockDuration: 300 },
  webhook: { limit: 100, window: 60, prefix: 'rl:webhook' },
};

// ═══════════════════════════════════════════════════════════
// SLIDING WINDOW RATE LIMITER
// ═══════════════════════════════════════════════════════════

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redis = getRedis();
  const key = `${config.prefix}:${identifier}`;
  const blockKey = `${config.prefix}:blocked:${identifier}`;
  const now = Date.now();
  const windowMs = config.window * 1000;

  // Check if blocked
  if (config.blockDuration && redis) {
    const blocked = await redis.get(blockKey);
    if (blocked) {
      const blockTtl = await redis.ttl(blockKey);
      return {
        allowed: false,
        limit: config.limit,
        remaining: 0,
        resetAt: Math.ceil((now + blockTtl * 1000) / 1000),
        retryAfter: blockTtl,
        blocked: true,
      };
    }
  }

  try {
    if (redis) {
      // Redis-based sliding window
      const pipeline = redis.pipeline();
      const windowStart = now - windowMs;

      // Remove old entries
      pipeline.zremrangebyscore(key, 0, windowStart);
      // Count current entries
      pipeline.zcard(key);
      // Add current request
      pipeline.zadd(key, { score: now, member: `${now}-${Math.random()}` });
      // Set expiry
      pipeline.expire(key, config.window + 1);

      const results = await pipeline.exec();
      const count = (results?.[1] as number) || 0;
      const remaining = Math.max(0, config.limit - count - 1);
      const reset = Math.ceil((now + windowMs) / 1000);

      if (count >= config.limit) {
        // Clean up and optionally block
        await redis.zremrangebyscore(key, now, now + 1);

        if (config.blockDuration) {
          await redis.setex(blockKey, config.blockDuration, '1');
        }

        return {
          allowed: false,
          limit: config.limit,
          remaining: 0,
          resetAt: reset,
          retryAfter: config.blockDuration || config.window,
          blocked: !!config.blockDuration,
        };
      }

      return {
        allowed: true,
        limit: config.limit,
        remaining,
        resetAt: reset,
      };
    } else {
      // Memory fallback
      const record = memoryStore.get(key);
      if (!record || now > record.resetAt) {
        memoryStore.set(key, { count: 1, resetAt: now + windowMs });
        return {
          allowed: true,
          limit: config.limit,
          remaining: config.limit - 1,
          resetAt: Math.ceil((now + windowMs) / 1000),
        };
      }

      if (record.count >= config.limit) {
        return {
          allowed: false,
          limit: config.limit,
          remaining: 0,
          resetAt: Math.ceil(record.resetAt / 1000),
          retryAfter: Math.ceil((record.resetAt - now) / 1000),
        };
      }

      record.count++;
      return {
        allowed: true,
        limit: config.limit,
        remaining: config.limit - record.count,
        resetAt: Math.ceil(record.resetAt / 1000),
      };
    }
  } catch (error) {
    console.error('[RateLimiter] Error:', error);
    // Fail open - allow if rate limiting fails
    return {
      allowed: true,
      limit: config.limit,
      remaining: config.limit,
      resetAt: Math.ceil((now + windowMs) / 1000),
    };
  }
}

// ═══════════════════════════════════════════════════════════
// ADAPTIVE THROTTLING
// ═══════════════════════════════════════════════════════════

export interface AdaptiveRateLimitConfig extends RateLimitConfig {
  minLimit: number;
  maxLimit: number;
  adjustmentFactor: number;
  errorThreshold: number;
}

const adaptiveState = new Map<
  string,
  {
    currentLimit: number;
    errorCount: number;
    successCount: number;
    lastAdjustment: number;
  }
>();

export async function checkAdaptiveRateLimit(
  identifier: string,
  config: AdaptiveRateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  let state = adaptiveState.get(identifier);

  if (!state) {
    state = {
      currentLimit: config.maxLimit,
      errorCount: 0,
      successCount: 0,
      lastAdjustment: now,
    };
    adaptiveState.set(identifier, state);
  }

  // Adjust limits based on error rate
  if (now - state.lastAdjustment > 60000) {
    // Every minute
    const errorRate = state.errorCount / (state.errorCount + state.successCount) || 0;

    if (errorRate > config.errorThreshold) {
      // Too many errors - reduce limit
      state.currentLimit = Math.max(
        config.minLimit,
        Math.floor(state.currentLimit * (1 - config.adjustmentFactor))
      );
    } else if (errorRate < config.errorThreshold / 2 && state.currentLimit < config.maxLimit) {
      // Low error rate - increase limit
      state.currentLimit = Math.min(
        config.maxLimit,
        Math.floor(state.currentLimit * (1 + config.adjustmentFactor))
      );
    }

    state.errorCount = 0;
    state.successCount = 0;
    state.lastAdjustment = now;
  }

  // Check rate limit with adjusted limit
  const adjustedConfig: RateLimitConfig = {
    ...config,
    limit: state.currentLimit,
  };

  const result = await checkRateLimit(identifier, adjustedConfig);

  // Update state
  if (result.allowed) {
    state.successCount++;
  } else {
    state.errorCount++;
  }

  return result;
}

// ═══════════════════════════════════════════════════════════
// RATE LIMIT MIDDLEWARE
// ═══════════════════════════════════════════════════════════

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toString(),
    ...(result.retryAfter && { 'Retry-After': result.retryAfter.toString() }),
    ...(result.blocked && { 'X-RateLimit-Blocked': 'true' }),
  };
}

export async function withRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  // Get identifier (user ID for authenticated, IP for others)
  const userId = request.headers.get('x-user-id');
  const ip =
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    'unknown';

  const identifier = userId || `ip:${ip}`;
  const result = await checkRateLimit(identifier, config);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: result.blocked
          ? 'Too many requests. You have been temporarily blocked.'
          : 'Too many requests. Please try again later.',
        retryAfter: result.retryAfter,
        code: result.blocked ? 'RATE_LIMIT_BLOCKED' : 'RATE_LIMIT_EXCEEDED',
      },
      {
        status: 429,
        headers: getRateLimitHeaders(result),
      }
    );
  }

  // Execute handler and add headers
  const response = await handler();

  Object.entries(getRateLimitHeaders(result)).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// ═══════════════════════════════════════════════════════════
// COST-BASED RATE LIMITING
// ═══════════════════════════════════════════════════════════

export async function checkCostRateLimit(
  userId: string,
  cost: number,
  maxCostPerDay: number = 1000
): Promise<{ allowed: boolean; remaining: number; used: number }> {
  const redis = getRedis();
  const key = `rl:cost:${userId}:${new Date().toISOString().split('T')[0]}`;
  const windowMs = 24 * 60 * 60 * 1000;

  try {
    if (redis) {
      const current = await redis.get(key);
      const used = parseInt((current as string) || '0', 10);

      if (used + cost > maxCostPerDay) {
        const _reset = Math.ceil((Date.now() + windowMs) / 1000);
        return { allowed: false, remaining: maxCostPerDay - used, used };
      }

      await redis.incrby(key, cost);
      await redis.expire(key, 24 * 60 * 60);

      return {
        allowed: true,
        remaining: maxCostPerDay - used - cost,
        used: used + cost,
      };
    } else {
      // Memory fallback
      return { allowed: true, remaining: maxCostPerDay, used: 0 };
    }
  } catch (error) {
    console.error('[CostRateLimiter] Error:', error);
    return { allowed: true, remaining: maxCostPerDay, used: 0 };
  }
}

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

export const rateLimiter = {
  checkRateLimit,
  checkAdaptiveRateLimit,
  checkCostRateLimit,
  withRateLimit,
  getRateLimitHeaders,
  RATE_LIMITS,
};
