import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import Redis from 'ioredis';
import { getCircuitBreakerStatus } from '@/lib/resilience/circuit-breaker';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    database: CheckResult;
    redis: CheckResult;
    circuitBreakers: CheckResult;
  };
}

interface CheckResult {
  status: 'pass' | 'fail';
  responseTime?: number;
  error?: string;
  details?: any;
}

async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('users').select('id').limit(1);
    
    if (error) throw error;
    
    return {
      status: 'pass',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'fail',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkRedis(): Promise<CheckResult> {
  const start = Date.now();
  let redis: Redis | null = null;
  
  try {
    if (!process.env.REDIS_URL) {
      return {
        status: 'fail',
        error: 'Redis URL not configured',
      };
    }

    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
    });

    await redis.ping();
    
    return {
      status: 'pass',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'fail',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    if (redis) {
      await redis.quit();
    }
  }
}

function checkCircuitBreakers(): CheckResult {
  try {
    const status = getCircuitBreakerStatus();
    const allClosed = Object.values(status).every(cb => cb.state === 'CLOSED');
    
    return {
      status: allClosed ? 'pass' : 'fail',
      details: status,
    };
  } catch (error) {
    return {
      status: 'fail',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function GET() {
  const checks = await Promise.all([
    checkDatabase(),
    checkRedis(),
    Promise.resolve(checkCircuitBreakers()),
  ]);

  const [database, redis, circuitBreakers] = checks;

  const allHealthy = checks.every(check => check.status === 'pass');
  const anyFailed = checks.some(check => check.status === 'fail');

  const health: HealthCheck = {
    status: allHealthy ? 'healthy' : anyFailed ? 'unhealthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database,
      redis,
      circuitBreakers,
    },
  };

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
