// ═══════════════════════════════════════════════════════════════
// REDIS CACHE SERVICE
// Production caching with cache-aside pattern
// ═══════════════════════════════════════════════════════════════

import { getRedis } from '@/lib/redis/client';
import { logger } from '@/lib/logging/logger';

export interface CacheOptions {
    ttlSeconds?: number;
    prefix?: string;
    serialize?: boolean;
}

export interface CacheStats {
    hits: number;
    misses: number;
    errors: number;
}

// Cache stats (in-memory)
const stats: CacheStats = { hits: 0, misses: 0, errors: 0 };

/**
 * Get cache stats
 */
export function getCacheStats(): CacheStats {
    return { ...stats };
}

/**
 * Reset cache stats
 */
export function resetCacheStats(): void {
    stats.hits = 0;
    stats.misses = 0;
    stats.errors = 0;
}

/**
 * Generate cache key
 */
function generateKey(prefix: string, ...parts: string[]): string {
    const key = parts.filter(Boolean).join(':');
    return `${prefix}:${key}`;
}

/**
 * Get value from cache
 */
export async function getFromCache<T>(
    key: string,
    options: CacheOptions = {}
): Promise<T | null> {
    const redis = getRedis();

    if (!redis) {
        stats.misses++;
        return null;
    }

    try {
        const fullKey = generateKey(options.prefix || 'cache', key);
        const value = await redis.get(fullKey);

        if (value === null) {
            stats.misses++;
            return null;
        }

        stats.hits++;

        if (options.serialize !== false) {
            return JSON.parse(value as string) as T;
        }

        return value as T;
    } catch (error) {
        stats.errors++;
        logger.error('[Cache] Get error', { key }, error as Error);
        return null;
    }
}

/**
 * Set value in cache
 */
export async function setInCache<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
): Promise<void> {
    const redis = getRedis();

    if (!redis) {
        return;
    }

    try {
        const fullKey = generateKey(options.prefix || 'cache', key);
        const serialized = options.serialize !== false ? JSON.stringify(value) : (value as string);
        const ttl = options.ttlSeconds || 3600; // Default 1 hour

        if (ttl > 0) {
            await redis.setex(fullKey, ttl, serialized);
        } else {
            await redis.set(fullKey, serialized);
        }

        logger.debug('[Cache] Set', { key, ttl });
    } catch (error) {
        stats.errors++;
        logger.error('[Cache] Set error', { key }, error as Error);
    }
}

/**
 * Delete value from cache
 */
export async function deleteFromCache(
    key: string,
    options: CacheOptions = {}
): Promise<void> {
    const redis = getRedis();

    if (!redis) {
        return;
    }

    try {
        const fullKey = generateKey(options.prefix || 'cache', key);
        await redis.del(fullKey);

        logger.debug('[Cache] Delete', { key });
    } catch (error) {
        stats.errors++;
        logger.error('[Cache] Delete error', { key }, error as Error);
    }
}

/**
 * Delete multiple keys matching pattern
 */
export async function deleteFromCacheByPattern(pattern: string): Promise<void> {
    const redis = getRedis();

    if (!redis) {
        return;
    }

    try {
        const fullPattern = generateKey('upsc', pattern);
        const keys = await redis.keys(fullPattern);

        if (keys.length > 0) {
            await redis.del(...keys);
            logger.debug('[Cache] Delete by pattern', { pattern, count: keys.length });
        }
    } catch (error) {
        stats.errors++;
        logger.error('[Cache] Delete by pattern error', { pattern }, error as Error);
    }
}

/**
 * Check if key exists in cache
 */
export async function existsInCache(
    key: string,
    options: CacheOptions = {}
): Promise<boolean> {
    const redis = getRedis();

    if (!redis) {
        return false;
    }

    try {
        const fullKey = generateKey(options.prefix || 'cache', key);
        const exists = await redis.exists(fullKey);
        return exists === 1;
    } catch (error) {
        stats.errors++;
        return false;
    }
}

/**
 * Get or set with cache-aside pattern
 */
export async function getOrSetCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
): Promise<T> {
    // Try cache first
    const cached = await getFromCache<T>(key, options);

    if (cached !== null) {
        logger.debug('[Cache] Hit', { key });
        return cached;
    }

    // Cache miss - fetch fresh data
    logger.debug('[Cache] Miss, fetching', { key });
    const freshData = await fetcher();

    // Store in cache
    await setInCache(key, freshData, options);

    return freshData;
}

/**
 * Increment counter atomically
 */
export async function incrementCounter(
    key: string,
    options: CacheOptions = {}
): Promise<number> {
    const redis = getRedis();

    if (!redis) {
        return 0;
    }

    try {
        const fullKey = generateKey(options.prefix || 'counter', key);
        const result = await redis.incr(fullKey);

        // Set expiry if this is a new key
        if (result === 1 && options.ttlSeconds) {
            await redis.expire(fullKey, options.ttlSeconds);
        }

        return result;
    } catch (error) {
        stats.errors++;
        logger.error('[Cache] Increment error', { key }, error as Error);
        return 0;
    }
}

/**
 * Decrement counter atomically
 */
export async function decrementCounter(
    key: string,
    options: CacheOptions = {}
): Promise<number> {
    const redis = getRedis();

    if (!redis) {
        return 0;
    }

    try {
        const fullKey = generateKey(options.prefix || 'counter', key);
        const result = await redis.decr(fullKey);
        return result;
    } catch (error) {
        stats.errors++;
        logger.error('[Cache] Decrement error', { key }, error as Error);
        return 0;
    }
}

/**
 * Get counter value
 */
export async function getCounter(
    key: string,
    options: CacheOptions = {}
): Promise<number> {
    const redis = getRedis();

    if (!redis) {
        return 0;
    }

    try {
        const fullKey = generateKey(options.prefix || 'counter', key);
        const value = await redis.get(fullKey);
        return value ? parseInt(value as string, 10) : 0;
    } catch (error) {
        stats.errors++;
        return 0;
    }
}

/**
 * Set with conditional (only if not exists)
 */
export async function setIfNotExists<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
): Promise<boolean> {
    const redis = getRedis();

    if (!redis) {
        return false;
    }

    try {
        const fullKey = generateKey(options.prefix || 'cache', key);
        const serialized = JSON.stringify(value);
        const ttl = options.ttlSeconds || 3600;

        const result = await redis.set(fullKey, serialized, { nx: true, ex: ttl });
        return result === 'OK';
    } catch (error) {
        stats.errors++;
        logger.error('[Cache] SetIfNotExists error', { key }, error as Error);
        return false;
    }
}

/**
 * Acquire distributed lock
 */
export async function acquireLock(
    lockKey: string,
    ttlSeconds: number = 30,
    options: { retryCount?: number; retryDelayMs?: number } = {}
): Promise<string | null> {
    const redis = getRedis();

    if (!redis) {
        return null;
    }

    const { retryCount = 3, retryDelayMs = 100 } = options;
    const lockValue = `${Date.now()}:${Math.random().toString(36).substring(2)}`;
    const fullKey = generateKey('lock', lockKey);

    for (let i = 0; i < retryCount; i++) {
        try {
            const result = await redis.set(fullKey, lockValue, { nx: true, ex: ttlSeconds });

            if (result === 'OK') {
                logger.debug('[Cache] Lock acquired', { lockKey, lockValue });
                return lockValue;
            }

            // Wait before retry
            await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        } catch (error) {
            logger.error('[Cache] Lock acquisition error', { lockKey }, error as Error);
        }
    }

    return null;
}

/**
 * Release distributed lock
 */
export async function releaseLock(
    lockKey: string,
    lockValue: string
): Promise<boolean> {
    const redis = getRedis();

    if (!redis) {
        return false;
    }

    try {
        const fullKey = generateKey('lock', lockKey);
        const currentValue = await redis.get(fullKey);

        // Only release if we still own the lock (prevent releasing someone else's lock)
        if (currentValue === lockValue) {
            await redis.del(fullKey);
            logger.debug('[Cache] Lock released', { lockKey, lockValue });
            return true;
        }

        return false;
    } catch (error) {
        logger.error('[Cache] Lock release error', { lockKey }, error as Error);
        return false;
    }
}

/**
 * Extend lock TTL
 */
export async function extendLock(
    lockKey: string,
    lockValue: string,
    ttlSeconds: number
): Promise<boolean> {
    const redis = getRedis();

    if (!redis) {
        return false;
    }

    try {
        const fullKey = generateKey('lock', lockKey);
        const currentValue = await redis.get(fullKey);

        if (currentValue === lockValue) {
            await redis.expire(fullKey, ttlSeconds);
            logger.debug('[Cache] Lock extended', { lockKey, ttlSeconds });
            return true;
        }

        return false;
    } catch (error) {
        logger.error('[Cache] Lock extend error', { lockKey }, error as Error);
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════
// CACHE PRESETS
// ═══════════════════════════════════════════════════════════════

export const CachePresets = {
    // Short-lived caches
    apiResponse: { ttlSeconds: 300, prefix: 'api' },        // 5 minutes
    userSubscription: { ttlSeconds: 60, prefix: 'user' },   // 1 minute
    planDetails: { ttlSeconds: 3600, prefix: 'plan' },      // 1 hour

    // Medium-lived caches
    userProfile: { ttlSeconds: 600, prefix: 'profile' },    // 10 minutes
    usageStats: { ttlSeconds: 300, prefix: 'usage' },       // 5 minutes

    // Long-lived caches
    staticContent: { ttlSeconds: 86400, prefix: 'static' }, // 24 hours
    config: { ttlSeconds: 3600, prefix: 'config' },         // 1 hour

    // Counters (no expiry, managed manually)
    rateLimit: { ttlSeconds: 60, prefix: 'ratelimit' },
    dailyUsage: { ttlSeconds: 86400, prefix: 'daily' },
};

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export const cache = {
    get: getFromCache,
    set: setInCache,
    delete: deleteFromCache,
    deleteByPattern: deleteFromCacheByPattern,
    exists: existsInCache,
    getOrSet: getOrSetCache,
    increment: incrementCounter,
    decrement: decrementCounter,
    getCounter,
    setIfNotExists,
    acquireLock,
    releaseLock,
    extendLock,
    getStats: getCacheStats,
    resetStats: resetCacheStats,
};
