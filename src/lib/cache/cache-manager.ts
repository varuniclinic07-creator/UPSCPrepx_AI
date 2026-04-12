// ═══════════════════════════════════════════════════════════════
// CACHE MANAGER
// Response caching for API calls
// ═══════════════════════════════════════════════════════════════

import { getRedis } from '@/lib/redis/client';

export interface CacheStats {
    hits: number;
    misses: number;
    keys: number;
    memory: string;
}

/**
 * Cache response
 */
export async function cacheResponse(
    key: string,
    data: any,
    ttl: number = 3600 // 1 hour default
): Promise<void> {
    const redis = getRedis();
    if (!redis) return;
    try {
        const serialized = JSON.stringify(data);
        await redis.setex(`cache:${key}`, ttl, serialized);
    } catch (error) {
        console.error('Cache write error:', error);
    }
}

/**
 * Get cached response
 */
export async function getCachedResponse<T>(key: string): Promise<T | null> {
    const redis = getRedis();
    if (!redis) return null;
    try {
        const data = await redis.get(`cache:${key}`);
        if (!data) return null;

        return JSON.parse(data as string) as T;
    } catch (error) {
        console.error('Cache read error:', error);
        return null;
    }
}

/**
 * Invalidate cache by pattern
 */
export async function invalidateCache(pattern: string): Promise<number> {
    const redis = getRedis();
    if (!redis) return 0;
    try {
        const keys = await redis.keys(`cache:${pattern}*`);
        if (keys.length === 0) return 0;

        await redis.del(...keys);
        return keys.length;
    } catch (error) {
        console.error('Cache invalidation error:', error);
        return 0;
    }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<CacheStats> {
    const redis = getRedis();
    if (!redis) return { hits: 0, misses: 0, keys: 0, memory: '0B' };
    try {
        const keys = await redis.dbsize();
        return { hits: 0, misses: 0, keys, memory: 'N/A' };
    } catch { return { hits: 0, misses: 0, keys: 0, memory: '0B' }; }
}

/**
 * Clear all cache
 */
export async function clearCache(): Promise<void> {
    const redis = getRedis();
    if (!redis) return;
    try {
        const keys = await redis.keys('cache:*');
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    } catch (error) {
        console.error('Cache clear error:', error);
    }
}

/**
 * Cache with function wrapper
 */
export async function withCache<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = 3600
): Promise<T> {
    // Try cache first
    const cached = await getCachedResponse<T>(key);
    if (cached !== null) {
        return cached;
    }

    // Execute function
    const result = await fn();

    // Cache result
    await cacheResponse(key, result, ttl);

    return result;
}
