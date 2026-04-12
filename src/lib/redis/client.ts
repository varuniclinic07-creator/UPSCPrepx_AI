import { Redis } from '@upstash/redis';

// Singleton Upstash Redis client
let redisInstance: Redis | null = null;

/**
 * Get Upstash Redis client (HTTP-based, Edge-compatible)
 * Returns null if not configured — callers must handle gracefully
 */
export function getRedis(): Redis | null {
  if (redisInstance) return redisInstance;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  redisInstance = new Redis({ url, token });
  return redisInstance;
}

/**
 * Check if Redis is available
 */
export async function isRedisAvailable(): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}
