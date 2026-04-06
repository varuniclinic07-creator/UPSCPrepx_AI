// ═══════════════════════════════════════════════════════════════════════════
// DISTRIBUTED RATE LIMITER - Redis-based with In-Memory Fallback
// Enforces per-provider rate limits with sliding window implementation
// GRACEFUL DEGRADATION: Falls back to in-memory when Redis unavailable
// ═══════════════════════════════════════════════════════════════════════════

import {
  type AIProvider,
  type RateLimitResult,
  type RateLimitConfig,
} from './providers/provider-types';

// ═══════════════════════════════════════════════════════════════════════════
// RATE LIMIT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const PROVIDER_CONFIGS: Record<AIProvider, RateLimitConfig> = {
  a4f: {
    rpm: parseInt(process.env.A4F_RATE_LIMIT_RPM || '10'),
    concurrent: parseInt(process.env.A4F_RATE_LIMIT_CONCURRENT || '5'),
    userQuotaDaily: 1000,
  },
  groq: {
    rpm: parseInt(process.env.GROQ_RATE_LIMIT_RPM || '30'),
    concurrent: parseInt(process.env.GROQ_RATE_LIMIT_CONCURRENT || '10'),
    userQuotaDaily: 5000,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// IN-MEMORY FALLBACK STORAGE
// ═══════════════════════════════════════════════════════════════════════════

interface InMemoryState {
  rpmRequests: Map<string, number[]>; // provider -> timestamps
  concurrent: Map<string, number>;    // provider -> count
  userDaily: Map<string, number>;     // userId -> count
}

const memoryState: InMemoryState = {
  rpmRequests: new Map(),
  concurrent: new Map(),
  userDaily: new Map(),
};

// ═══════════════════════════════════════════════════════════════════════════
// RATE LIMITER CLASS WITH GRACEFUL DEGRADATION
// ═══════════════════════════════════════════════════════════════════════════

export class DistributedRateLimiter {
  private redis: any = null;
  private usingFallback: boolean = false;

  constructor(redisUrl?: string) {
    this.initRedis(redisUrl);
  }

  private async initRedis(redisUrl?: string): Promise<void> {
    try {
      // Dynamic import to avoid crashes if ioredis has issues
      const { Redis } = await import('ioredis');

      const url = redisUrl || process.env.REDIS_URL;
      if (!url) {
        console.warn('[RateLimiter] No REDIS_URL configured, using in-memory fallback');
        this.usingFallback = true;
        return;
      }

      this.redis = new Redis(url, {
        maxRetriesPerRequest: 3,
        retryStrategy(times: number) {
          if (times > 3) return null; // Stop retrying
          return Math.min(times * 50, 2000);
        },
        lazyConnect: true, // Don't connect immediately
      });

      // Test connection with timeout
      const connectPromise = this.redis.ping();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
      );

      try {
        await Promise.race([connectPromise, timeoutPromise]);
        console.log('[RateLimiter] Redis connected successfully');
      } catch (e) {
        console.warn('[RateLimiter] Redis unavailable, using in-memory fallback:', (e as Error).message);
        this.usingFallback = true;
        this.redis = null;
      }

      if (this.redis) {
        this.redis.on('error', (err: Error) => {
          console.error('[RateLimiter] Redis error:', err.message);
          this.usingFallback = true;
        });

        this.redis.on('connect', () => {
          this.usingFallback = false;
        });
      }
    } catch (error) {
      console.warn('[RateLimiter] Failed to initialize Redis, using in-memory fallback:', (error as Error).message);
      this.usingFallback = true;
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // CHECK RATE LIMIT
  // ═════════════════════════════════════════════════════════════════════════

  async checkLimit(
    provider: AIProvider,
    userId?: string
  ): Promise<RateLimitResult> {
    if (this.usingFallback || !this.redis) {
      return this.checkLimitInMemory(provider, userId);
    }

    try {
      return await this.checkLimitRedis(provider, userId);
    } catch (error) {
      console.warn('[RateLimiter] Redis check failed, using memory:', (error as Error).message);
      return this.checkLimitInMemory(provider, userId);
    }
  }

  private checkLimitInMemory(provider: AIProvider, userId?: string): RateLimitResult {
    const config = PROVIDER_CONFIGS[provider];
    const now = Date.now();
    const windowMs = 60000;

    // Check RPM
    const timestamps = memoryState.rpmRequests.get(provider) || [];
    const recentTimestamps = timestamps.filter(t => t > now - windowMs);
    memoryState.rpmRequests.set(provider, recentTimestamps);

    if (recentTimestamps.length >= config.rpm) {
      return {
        allowed: false,
        remainingRequests: 0,
        resetAt: new Date(now + windowMs),
        retryAfter: windowMs,
      };
    }

    // Check concurrent
    const concurrent = memoryState.concurrent.get(provider) || 0;
    if (concurrent >= config.concurrent) {
      return {
        allowed: false,
        remainingRequests: config.rpm - recentTimestamps.length,
        resetAt: new Date(now + 5000),
        retryAfter: 5000,
      };
    }

    return {
      allowed: true,
      remainingRequests: config.rpm - recentTimestamps.length - 1,
      resetAt: new Date(now + windowMs),
    };
  }

  private async checkLimitRedis(provider: AIProvider, userId?: string): Promise<RateLimitResult> {
    const config = PROVIDER_CONFIGS[provider];
    const now = Date.now();
    const windowMs = 60000;

    const rpmKey = `ai:ratelimit:${provider}:rpm`;
    await this.redis.zremrangebyscore(rpmKey, 0, now - windowMs);
    const rpmCount = await this.redis.zcard(rpmKey);

    if (rpmCount >= config.rpm) {
      return {
        allowed: false,
        remainingRequests: 0,
        resetAt: new Date(now + windowMs),
        retryAfter: windowMs,
      };
    }

    const concurrentKey = `ai:ratelimit:${provider}:concurrent`;
    const concurrentCount = await this.redis.get(concurrentKey);

    if (concurrentCount && parseInt(concurrentCount) >= config.concurrent) {
      return {
        allowed: false,
        remainingRequests: config.rpm - rpmCount,
        resetAt: new Date(now + 5000),
        retryAfter: 5000,
      };
    }

    return {
      allowed: true,
      remainingRequests: config.rpm - rpmCount - 1,
      resetAt: new Date(now + windowMs),
    };
  }

  // ═════════════════════════════════════════════════════════════════════════
  // CONSUME RATE LIMIT TOKEN
  // ═════════════════════════════════════════════════════════════════════════

  async consumeToken(provider: AIProvider, userId?: string): Promise<void> {
    if (this.usingFallback || !this.redis) {
      this.consumeTokenInMemory(provider, userId);
      return;
    }

    try {
      await this.consumeTokenRedis(provider, userId);
    } catch (error) {
      console.warn('[RateLimiter] Redis consume failed, using memory');
      this.consumeTokenInMemory(provider, userId);
    }
  }

  private consumeTokenInMemory(provider: AIProvider, userId?: string): void {
    const now = Date.now();

    // Increment RPM
    const timestamps = memoryState.rpmRequests.get(provider) || [];
    timestamps.push(now);
    memoryState.rpmRequests.set(provider, timestamps);

    // Increment concurrent
    const concurrent = memoryState.concurrent.get(provider) || 0;
    memoryState.concurrent.set(provider, concurrent + 1);
  }

  private async consumeTokenRedis(provider: AIProvider, userId?: string): Promise<void> {
    const now = Date.now();
    const requestId = `${now}-${Math.random().toString(36).substr(2, 9)}`;
    const rpmKey = `ai:ratelimit:${provider}:rpm`;
    const concurrentKey = `ai:ratelimit:${provider}:concurrent`;

    await this.redis
      .multi()
      .zadd(rpmKey, now, requestId)
      .expire(rpmKey, 70)
      .incr(concurrentKey)
      .exec();
  }

  // ═════════════════════════════════════════════════════════════════════════
  // RELEASE CONCURRENT SLOT
  // ═════════════════════════════════════════════════════════════════════════

  async releaseSlot(provider: AIProvider): Promise<void> {
    if (this.usingFallback || !this.redis) {
      const concurrent = memoryState.concurrent.get(provider) || 0;
      memoryState.concurrent.set(provider, Math.max(0, concurrent - 1));
      return;
    }

    try {
      const concurrentKey = `ai:ratelimit:${provider}:concurrent`;
      const count = await this.redis.decr(concurrentKey);
      if (count < 0) {
        await this.redis.set(concurrentKey, 0);
      }
    } catch (error) {
      const concurrent = memoryState.concurrent.get(provider) || 0;
      memoryState.concurrent.set(provider, Math.max(0, concurrent - 1));
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // GET USAGE STATS
  // ═════════════════════════════════════════════════════════════════════════

  async getUsageStats(provider: AIProvider): Promise<{
    rpmUsed: number;
    rpmLimit: number;
    concurrentUsed: number;
    concurrentLimit: number;
    availability: number;
    usingFallback: boolean;
  }> {
    const config = PROVIDER_CONFIGS[provider];

    if (this.usingFallback || !this.redis) {
      const now = Date.now();
      const windowMs = 60000;
      const timestamps = memoryState.rpmRequests.get(provider) || [];
      const rpmUsed = timestamps.filter(t => t > now - windowMs).length;
      const concurrentUsed = memoryState.concurrent.get(provider) || 0;

      return {
        rpmUsed,
        rpmLimit: config.rpm,
        concurrentUsed,
        concurrentLimit: config.concurrent,
        availability: Math.max(0, ((config.rpm - rpmUsed) / config.rpm) * 100),
        usingFallback: true,
      };
    }

    try {
      const now = Date.now();
      const windowMs = 60000;
      const rpmKey = `ai:ratelimit:${provider}:rpm`;
      const concurrentKey = `ai:ratelimit:${provider}:concurrent`;

      await this.redis.zremrangebyscore(rpmKey, 0, now - windowMs);
      const rpmUsed = await this.redis.zcard(rpmKey);
      const concurrentUsed = parseInt((await this.redis.get(concurrentKey)) || '0');

      return {
        rpmUsed,
        rpmLimit: config.rpm,
        concurrentUsed,
        concurrentLimit: config.concurrent,
        availability: Math.max(0, ((config.rpm - rpmUsed) / config.rpm) * 100),
        usingFallback: false,
      };
    } catch (error) {
      return {
        rpmUsed: 0,
        rpmLimit: config.rpm,
        concurrentUsed: 0,
        concurrentLimit: config.concurrent,
        availability: 100,
        usingFallback: true,
      };
    }
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

let rateLimiterInstance: DistributedRateLimiter | null = null;

export function getRateLimiter(): DistributedRateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new DistributedRateLimiter();
  }
  return rateLimiterInstance;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export async function checkRateLimit(
  provider: AIProvider,
  userId?: string
): Promise<RateLimitResult> {
  const limiter = getRateLimiter();
  return limiter.checkLimit(provider, userId);
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(result.remainingRequests),
    'X-RateLimit-Reset': result.resetAt.toISOString(),
    ...(result.retryAfter ? { 'Retry-After': String(Math.ceil(result.retryAfter / 1000)) } : {}),
  };
}

/**
 * Wait for rate limit to reset if needed
 */
export async function waitForRateLimit(
  provider: AIProvider,
  userId?: string,
  maxWaitMs: number = 60000
): Promise<boolean> {
  const limiter = getRateLimiter();
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const result = await limiter.checkLimit(provider, userId);
    if (result.allowed) {
      return true;
    }

    const waitTime = Math.min(
      result.retryAfter || 5000,
      maxWaitMs - (Date.now() - startTime)
    );

    if (waitTime <= 0) break;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  return false;
}

// Re-export types
export type { RateLimitResult } from './providers/provider-types';