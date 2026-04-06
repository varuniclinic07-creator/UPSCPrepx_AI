// ═══════════════════════════════════════════════════════════════════════════
// RATE LIMITER - Redis-based distributed rate limiting for API protection
// ═══════════════════════════════════════════════════════════════════════════

import { Redis } from 'ioredis';

// Redis connection (singleton)
let redisClient: Redis | null = null;

function getRedis(): Redis {
    if (!redisClient) {
        redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
        });
    }
    return redisClient;
}

export interface RateLimitConfig {
    limit: number;       // Max requests
    window: number;      // Window in seconds
    prefix?: string;     // Key prefix
}

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;       // Unix timestamp
    retryAfter?: number; // Seconds until reset
}

// ═══════════════════════════════════════════════════════════════════════════
// PREDEFINED RATE LIMITS
// ═══════════════════════════════════════════════════════════════════════════

export const RATE_LIMITS = {
    // Authentication - strict limits
    auth: { limit: 5, window: 15 * 60, prefix: 'rl:auth' },           // 5 per 15 min
    otp: { limit: 3, window: 60, prefix: 'rl:otp' },                  // 3 per min
    register: { limit: 3, window: 60 * 60, prefix: 'rl:register' },   // 3 per hour

    // AI Generation - expensive operations
    aiChat: { limit: 30, window: 60, prefix: 'rl:ai:chat' },          // 30 per min
    aiGenerate: { limit: 10, window: 60 * 60, prefix: 'rl:ai:gen' },  // 10 per hour
    lectureGen: { limit: 3, window: 24 * 60 * 60, prefix: 'rl:lec' }, // 3 per day
    notesGen: { limit: 20, window: 60 * 60, prefix: 'rl:notes' },     // 20 per hour
    quizGen: { limit: 15, window: 60 * 60, prefix: 'rl:quiz' },       // 15 per hour

    // Agentic services
    agenticQuery: { limit: 20, window: 60, prefix: 'rl:agentic' },    // 20 per min
    webSearch: { limit: 10, window: 60, prefix: 'rl:websearch' },     // 10 per min

    // File operations
    upload: { limit: 10, window: 60 * 60, prefix: 'rl:upload' },      // 10 per hour

    // General API
    api: { limit: 100, window: 60, prefix: 'rl:api' },                // 100 per min

    // Admin operations
    admin: { limit: 60, window: 60, prefix: 'rl:admin' },             // 60 per min
};

// ═══════════════════════════════════════════════════════════════════════════
// SLIDING WINDOW RATE LIMITER
// ═══════════════════════════════════════════════════════════════════════════

export async function checkRateLimit(
    identifier: string,
    config: RateLimitConfig
): Promise<RateLimitResult> {
    const redis = getRedis();
    const key = `${config.prefix || 'rl'}:${identifier}`;
    const now = Date.now();
    const windowMs = config.window * 1000;
    const windowStart = now - windowMs;

    try {
        // Use pipeline for atomic operations
        const pipeline = redis.pipeline();

        // Remove old entries outside window
        pipeline.zremrangebyscore(key, 0, windowStart);

        // Count current entries
        pipeline.zcard(key);

        // Add current request
        pipeline.zadd(key, now, `${now}-${Math.random()}`);

        // Set expiry
        pipeline.expire(key, config.window + 1);

        const results = await pipeline.exec();
        const count = (results?.[1]?.[1] as number) || 0;

        const remaining = Math.max(0, config.limit - count - 1);
        const reset = Math.ceil((now + windowMs) / 1000);

        if (count >= config.limit) {
            // Clean up the just-added entry if over limit
            await redis.zremrangebyscore(key, now, now + 1);

            return {
                success: false,
                limit: config.limit,
                remaining: 0,
                reset,
                retryAfter: Math.ceil(windowMs / 1000),
            };
        }

        return {
            success: true,
            limit: config.limit,
            remaining,
            reset,
        };
    } catch (error) {
        console.error('[RateLimiter] Redis error:', error);
        // Fail open - allow request if Redis is down
        return {
            success: true,
            limit: config.limit,
            remaining: config.limit,
            reset: Math.ceil((now + windowMs) / 1000),
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// RATE LIMIT HELPER FOR API ROUTES
// ═══════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';

export async function withRateLimit(
    req: NextRequest,
    config: RateLimitConfig,
    handler: () => Promise<NextResponse>
): Promise<NextResponse> {
    // Get identifier (user ID or IP)
    const userId = req.headers.get('x-user-id');
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
        req.headers.get('x-real-ip') ||
        'unknown';

    const identifier = userId || ip;
    const result = await checkRateLimit(identifier, config);

    if (!result.success) {
        return NextResponse.json(
            {
                error: 'Rate limit exceeded',
                message: 'Too many requests. Please try again later.',
                retryAfter: result.retryAfter,
            },
            {
                status: 429,
                headers: {
                    'X-RateLimit-Limit': result.limit.toString(),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': result.reset.toString(),
                    'Retry-After': (result.retryAfter || 60).toString(),
                },
            }
        );
    }

    // Execute handler and add rate limit headers
    const response = await handler();

    response.headers.set('X-RateLimit-Limit', result.limit.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.reset.toString());

    return response;
}

// ═══════════════════════════════════════════════════════════════════════════
// COST-BASED RATE LIMITING (for expensive operations)
// ═══════════════════════════════════════════════════════════════════════════

export async function checkCostRateLimit(
    userId: string,
    cost: number,
    maxCostPerDay: number = 1000
): Promise<{ allowed: boolean; remaining: number; used: number }> {
    const redis = getRedis();
    const key = `rl:cost:${userId}:${new Date().toISOString().split('T')[0]}`;

    try {
        const current = await redis.get(key);
        const used = parseInt(current || '0', 10);

        if (used + cost > maxCostPerDay) {
            return { allowed: false, remaining: maxCostPerDay - used, used };
        }

        await redis.incrby(key, cost);
        await redis.expire(key, 24 * 60 * 60); // 24 hours

        return {
            allowed: true,
            remaining: maxCostPerDay - used - cost,
            used: used + cost
        };
    } catch (error) {
        console.error('[CostRateLimiter] Error:', error);
        return { allowed: true, remaining: maxCostPerDay, used: 0 };
    }
}
