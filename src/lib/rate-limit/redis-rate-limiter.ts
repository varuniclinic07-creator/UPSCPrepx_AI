// ═══════════════════════════════════════════════════════════════
// REDIS RATE LIMITER
// Production-ready rate limiting using Redis
// ═══════════════════════════════════════════════════════════════

import { getRedis } from '@/lib/redis/client';

export interface RateLimitConfig {
    maxRequests: number;      // Maximum requests allowed
    windowSeconds: number;    // Time window in seconds
    blockDurationSeconds?: number; // How long to block after exceeding (default: windowSeconds)
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;        // Unix timestamp when limit resets
    retryAfter?: number;    // Seconds to wait if blocked
}

// Default configurations for different use cases
export const RateLimitPresets = {
    // API routes - general
    api: { maxRequests: 100, windowSeconds: 60 } as RateLimitConfig,

    // Authentication endpoints - stricter
    auth: { maxRequests: 5, windowSeconds: 60, blockDurationSeconds: 300 } as RateLimitConfig,

    // Payment endpoints - very strict
    payment: { maxRequests: 10, windowSeconds: 60, blockDurationSeconds: 600 } as RateLimitConfig,

    // AI endpoints - token/cost sensitive
    ai: { maxRequests: 20, windowSeconds: 60, blockDurationSeconds: 120 } as RateLimitConfig,

    // Webhook endpoints - moderate
    webhook: { maxRequests: 50, windowSeconds: 60 } as RateLimitConfig,

    // Free tier users - stricter limits
    free: { maxRequests: 30, windowSeconds: 60 } as RateLimitConfig,

    // Premium users - more generous
    premium: { maxRequests: 200, windowSeconds: 60 } as RateLimitConfig,

    // Admin endpoints - moderate
    admin: { maxRequests: 50, windowSeconds: 60 } as RateLimitConfig,
};

/**
 * Check rate limit for a given identifier
 */
export async function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = RateLimitPresets.api
): Promise<RateLimitResult> {
    const redis = getRedis();

    // If Redis not available, allow all requests (fail open)
    if (!redis) {
        return {
            allowed: true,
            remaining: config.maxRequests,
            resetAt: Date.now() + config.windowSeconds * 1000,
        };
    }

    const key = `ratelimit:${identifier}`;
    const now = Date.now();
    const windowMs = config.windowSeconds * 1000;

    try {
        // Use Redis pipeline for atomic operations
        const pipeline = redis.pipeline();

        // Get current count
        const currentCount = await redis.get(key);
        const count = currentCount ? parseInt(currentCount as string, 10) : 0;

        if (count >= config.maxRequests) {
            // Rate limit exceeded
            const ttl = await redis.ttl(key);
            const resetAt = now + (ttl > 0 ? ttl * 1000 : windowMs);

            return {
                allowed: false,
                remaining: 0,
                resetAt: Math.floor(resetAt / 1000),
                retryAfter: ttl > 0 ? ttl : config.windowSeconds,
            };
        }

        // Increment counter with expiration
        pipeline.incr(key);
        pipeline.expire(key, config.windowSeconds);
        const results = await pipeline.exec();

        const newCount = (results?.[0] as number) || count + 1;

        return {
            allowed: true,
            remaining: Math.max(0, config.maxRequests - newCount),
            resetAt: Math.floor((now + windowMs) / 1000),
        };
    } catch (error) {
        console.error('[RateLimit] Error checking limit:', error);
        // Fail open - allow request if Redis fails
        return {
            allowed: true,
            remaining: config.maxRequests,
            resetAt: Math.floor((now + windowMs) / 1000),
        };
    }
}

/**
 * Check rate limit and throw if exceeded
 */
export async function enforceRateLimit(
    identifier: string,
    config: RateLimitConfig = RateLimitPresets.api
): Promise<RateLimitResult> {
    const result = await checkRateLimit(identifier, config);

    if (!result.allowed) {
        const error = new RateLimitError(
            `Rate limit exceeded. Try again in ${result.retryAfter || config.windowSeconds} seconds.`,
            result.retryAfter || config.windowSeconds
        );
        throw error;
    }

    return result;
}

/**
 * Custom error class for rate limit violations
 */
export class RateLimitError extends Error {
    public readonly retryAfter: number;
    public readonly code = 'RATE_LIMIT_EXCEEDED';

    constructor(message: string, retryAfter: number) {
        super(message);
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetAt.toString(),
        ...(result.retryAfter && { 'Retry-After': result.retryAfter.toString() }),
    };
}

/**
 * Reset rate limit for an identifier
 */
export async function resetRateLimit(identifier: string): Promise<void> {
    const redis = getRedis();
    if (!redis) return;

    try {
        await redis.del(`ratelimit:${identifier}`);
    } catch (error) {
        console.error('[RateLimit] Error resetting limit:', error);
    }
}

/**
 * Get current rate limit status without incrementing
 */
export async function getRateLimitStatus(
    identifier: string,
    config: RateLimitConfig = RateLimitPresets.api
): Promise<{ current: number; remaining: number; resetAt: number }> {
    const redis = getRedis();
    const now = Date.now();
    const windowMs = config.windowSeconds * 1000;

    if (!redis) {
        return { current: 0, remaining: config.maxRequests, resetAt: Math.floor((now + windowMs) / 1000) };
    }

    try {
        const key = `ratelimit:${identifier}`;
        const currentCount = await redis.get(key);
        const count = currentCount ? parseInt(currentCount as string, 10) : 0;
        const ttl = await redis.ttl(key);

        return {
            current: count,
            remaining: Math.max(0, config.maxRequests - count),
            resetAt: ttl > 0 ? Math.floor((now + ttl * 1000) / 1000) : Math.floor((now + windowMs) / 1000),
        };
    } catch (error) {
        console.error('[RateLimit] Error getting status:', error);
        return { current: 0, remaining: config.maxRequests, resetAt: Math.floor((now + windowMs) / 1000) };
    }
}
