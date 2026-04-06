// ═══════════════════════════════════════════════════════════════
// UPSC CSE MASTER - A4F API RATE LIMITER
// Handles 10 RPM limit with intelligent queuing
// Based on CAPACITY_PLANNING_10RPM.md analysis
// ═══════════════════════════════════════════════════════════════

import Redis from 'ioredis';
import { Queue } from 'bullmq';

const redis = new Redis(process.env.REDIS_URL!);

// ═══════════════════════════════════════════════════════════════
// RATE LIMITER - Sliding Window Algorithm
// ═══════════════════════════════════════════════════════════════

export class A4FRateLimiter {
    private readonly limit = parseInt(process.env.A4F_RATE_LIMIT_RPM || '10');
    private readonly window = 60000; // 1 minute in ms
    private readonly key = 'a4f:api_requests';

    /**
     * Check if we can make an API request now
     */
    async canMakeRequest(): Promise<boolean> {
        const now = Date.now();
        const windowStart = now - this.window;

        // Remove requests older than 1 minute
        await redis.zremrangebyscore(this.key, 0, windowStart);

        // Count current requests in window
        const count = await redis.zcard(this.key);

        if (count < this.limit) {
            // Add this request to the set
            await redis.zadd(this.key, now, `${now}-${Math.random()}`);
            return true;
        }

        return false;
    }

    /**
     * Wait for an available slot (blocking)
     */
    async waitForSlot(): Promise<void> {
        while (!(await this.canMakeRequest())) {
            // Get oldest request timestamp
            const oldest = await redis.zrange(this.key, 0, 0, 'WITHSCORES');

            if (oldest.length >= 2) {
                const oldestTimestamp = parseInt(oldest[1]);
                const waitTime = oldestTimestamp + this.window - Date.now();

                if (waitTime > 0) {
                    // Wait until oldest request expires + 100ms buffer
                    await new Promise(resolve => setTimeout(resolve, waitTime + 100));
                }
            } else {
                // Default wait
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    /**
     * Get current queue position and estimated wait time
     */
    async getQueueStats(): Promise<{
        currentRequests: number;
        available: number;
        queuePosition: number;
        estimatedWaitSeconds: number;
    }> {
        const now = Date.now();
        const windowStart = now - this.window;

        await redis.zremrangebyscore(this.key, 0, windowStart);
        const count = await redis.zcard(this.key);

        const available = Math.max(0, this.limit - count);
        const queuePosition = Math.max(0, count - this.limit);

        // At 10 RPM, each request takes ~6 seconds
        const estimatedWaitSeconds = queuePosition * 6;

        return {
            currentRequests: count,
            available,
            queuePosition,
            estimatedWaitSeconds
        };
    }

    /**
     * Reserve a slot without making the request
     * Returns true if slot was reserved
     */
    async reserveSlot(): Promise<boolean> {
        return await this.canMakeRequest();
    }

    /**
     * Release a reserved slot (if request was cancelled)
     */
    async releaseSlot(): Promise<void> {
        // Remove the most recent request
        await redis.zpopmax(this.key);
    }
}

// ═══════════════════════════════════════════════════════════════
// PRIORITY QUEUE FOR API REQUESTS
// ═══════════════════════════════════════════════════════════════

export interface APIRequest {
    id: string;
    userId: string;
    type: 'chat' | 'search' | 'generate_notes' | 'generate_video' | 'generate_audio' | 'generate_image';
    priority: number; // 1 = CRITICAL, 2 = HIGH, 3 = MEDIUM, 4 = LOW, 5 = BACKGROUND
    payload: any;
    model?: string;
    createdAt: number;
}

export const PRIORITY_LEVELS = {
    CRITICAL: 1,    // Real-time chat, voice interactions
    HIGH: 2,        // Search queries, quick answers
    MEDIUM: 3,      // Notes generation, quizzes
    LOW: 4,         // Video generation, lectures
    BACKGROUND: 5   // Analytics, pre-generation, scheduled tasks
} as const;

// Priority weights for capacity allocation
const _PRIORITY_WEIGHTS = {
    [PRIORITY_LEVELS.CRITICAL]: 0.50,   // 50% of capacity
    [PRIORITY_LEVELS.HIGH]: 0.25,       // 25% of capacity
    [PRIORITY_LEVELS.MEDIUM]: 0.15,     // 15% of capacity
    [PRIORITY_LEVELS.LOW]: 0.08,        // 8% of capacity
    [PRIORITY_LEVELS.BACKGROUND]: 0.02  // 2% of capacity
};

// Create BullMQ queue
export const apiQueue = new Queue<APIRequest>('api-requests', {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000 // Start with 5 second delay
        },
        removeOnComplete: 100,
        removeOnFail: 50
    }
});

// Note: QueueScheduler was removed in BullMQ v4+
// Delayed job handling is now built into the Worker class

/**
 * Add request to priority queue
 */
export async function queueAPIRequest(
    request: Omit<APIRequest, 'id' | 'createdAt'>
): Promise<{
    jobId: string;
    position: number;
    estimatedWaitSeconds: number;
}> {
    const job = await apiQueue.add(
        request.type,
        {
            ...request,
            id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: Date.now()
        },
        {
            priority: request.priority
        }
    );

    // Get queue stats
    const waitingCount = await apiQueue.getWaitingCount();
    const rateLimiter = new A4FRateLimiter();
    const stats = await rateLimiter.getQueueStats();

    // Estimate wait time based on priority and queue depth
    const estimatedWaitSeconds = Math.max(
        stats.estimatedWaitSeconds,
        (waitingCount * 6) / 10 // Average 6 seconds per request at 10 RPM
    );

    return {
        jobId: job.id!,
        position: waitingCount + 1,
        estimatedWaitSeconds
    };
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string) {
    const job = await apiQueue.getJob(jobId);

    if (!job) {
        return { found: false };
    }

    const state = await job.getState();
    const progress = job.progress;

    return {
        found: true,
        state,
        progress,
        data: job.data,
        returnvalue: job.returnvalue,
        failedReason: job.failedReason,
        attemptsMade: job.attemptsMade
    };
}

// ═══════════════════════════════════════════════════════════════
// USER-LEVEL RATE LIMITING
// Based on subscription tier
// ═══════════════════════════════════════════════════════════════

export interface UserLimits {
    chatPerHour: number;
    searchPerHour: number;
    notesPerDay: number;
    videosPerDay: number;
    essaysPerDay: number;
    questionsPerDay: number;
}

// Limits from CAPACITY_PLANNING_10RPM.md
export const PLAN_LIMITS: Record<string, UserLimits> = {
    trial: {
        chatPerHour: 15,
        searchPerHour: 10,
        notesPerDay: 5,
        videosPerDay: 0,
        essaysPerDay: 1,
        questionsPerDay: 20
    },
    basic: {
        chatPerHour: 40,
        searchPerHour: 25,
        notesPerDay: 10,
        videosPerDay: 2,
        essaysPerDay: 5,
        questionsPerDay: 100
    },
    premium: {
        chatPerHour: 80,
        searchPerHour: 50,
        notesPerDay: 30,
        videosPerDay: 10,
        essaysPerDay: 20,
        questionsPerDay: 500
    },
    premium_plus: {
        chatPerHour: 150,
        searchPerHour: 100,
        notesPerDay: 100,
        videosPerDay: 50,
        essaysPerDay: 50,
        questionsPerDay: 1000
    }
};

export class UserRateLimiter {
    /**
     * Check if user has exceeded their limit for a feature
     */
    async checkLimit(
        userId: string,
        feature: keyof UserLimits,
        plan: string = 'trial'
    ): Promise<{
        allowed: boolean;
        remaining: number;
        resetIn: number;
        upgradeRequired: boolean;
    }> {
        const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.trial;
        const limit = limits[feature];

        if (limit === 0) {
            // Feature not available in this plan
            return {
                allowed: false,
                remaining: 0,
                resetIn: 0,
                upgradeRequired: true
            };
        }

        const isHourly = feature.includes('PerHour');
        const window = isHourly ? 3600 : 86400; // 1 hour or 1 day in seconds
        const key = `user:${userId}:${feature}`;

        const current = await redis.get(key);
        const count = parseInt(current || '0');

        if (count >= limit) {
            const ttl = await redis.ttl(key);
            return {
                allowed: false,
                remaining: 0,
                resetIn: ttl > 0 ? ttl : window,
                upgradeRequired: false
            };
        }

        return {
            allowed: true,
            remaining: limit - count,
            resetIn: await redis.ttl(key) || window,
            upgradeRequired: false
        };
    }

    /**
     * Increment user's feature usage
     */
    async incrementUsage(
        userId: string,
        feature: keyof UserLimits
    ): Promise<void> {
        const isHourly = feature.includes('PerHour');
        const window = isHourly ? 3600 : 86400;
        const key = `user:${userId}:${feature}`;

        const current = await redis.get(key);

        const multi = redis.multi();
        multi.incr(key);

        if (!current) {
            multi.expire(key, window);
        }

        await multi.exec();
    }

    /**
     * Get user's current usage across all features
     */
    async getUserUsage(userId: string, plan: string = 'trial') {
        const limits = PLAN_LIMITS[plan];
        const usage: Record<string, { used: number; limit: number; remaining: number }> = {};

        for (const feature of Object.keys(limits) as Array<keyof UserLimits>) {
            const key = `user:${userId}:${feature}`;
            const current = await redis.get(key);
            const count = parseInt(current || '0');
            const limit = limits[feature];

            usage[feature] = {
                used: count,
                limit,
                remaining: Math.max(0, limit - count)
            };
        }

        return usage;
    }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export const rateLimiter = new A4FRateLimiter();
export const userRateLimiter = new UserRateLimiter();