/** @jest-environment node */

import { GET } from '@/app/api/health/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(() =>
    Promise.resolve({ from: (...args: any[]) => mockFrom(...args) })
  ),
}));

jest.mock('@/lib/redis/client', () => ({
  getRedis: jest.fn(),
  isRedisAvailable: (...args: any[]) => mockIsRedisAvailable(...args),
}));

jest.mock('@/lib/resilience/circuit-breaker', () => ({
  getCircuitBreakerStatus: (...args: any[]) => mockGetCircuitBreakerStatus(...args),
}));

const mockSelect = jest.fn().mockReturnThis();
const mockLimit = jest.fn();
const mockFrom = jest.fn(() => ({ select: mockSelect, limit: mockLimit }));
mockSelect.mockReturnValue({ limit: mockLimit });

const mockIsRedisAvailable = jest.fn();

const mockGetCircuitBreakerStatus = jest.fn();

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/health', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns healthy when all checks pass', async () => {
    mockLimit.mockResolvedValue({ error: null });
    mockIsRedisAvailable.mockResolvedValue(true);
    mockGetCircuitBreakerStatus.mockReturnValue({
      ai: { state: 'CLOSED' },
      db: { state: 'CLOSED' },
    });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe('healthy');
    expect(json.checks.database.status).toBe('pass');
    expect(json.checks.redis.status).toBe('pass');
    expect(json.checks.circuitBreakers.status).toBe('pass');
    expect(json.timestamp).toBeDefined();
    expect(json.version).toBeDefined();
  });

  it('returns unhealthy (503) when database fails', async () => {
    mockLimit.mockResolvedValue({ error: new Error('connection refused') });
    mockIsRedisAvailable.mockResolvedValue(true);
    mockGetCircuitBreakerStatus.mockReturnValue({ ai: { state: 'CLOSED' } });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(503);
    expect(json.status).toBe('unhealthy');
    expect(json.checks.database.status).toBe('fail');
  });

  it('returns unhealthy when redis is unavailable', async () => {
    mockLimit.mockResolvedValue({ error: null });
    mockIsRedisAvailable.mockResolvedValue(false);
    mockGetCircuitBreakerStatus.mockReturnValue({ ai: { state: 'CLOSED' } });

    const res = await GET();
    const json = await res.json();

    expect(json.status).toBe('unhealthy');
    expect(json.checks.redis.status).toBe('fail');
  });

  it('returns unhealthy when circuit breaker is open', async () => {
    mockLimit.mockResolvedValue({ error: null });
    mockIsRedisAvailable.mockResolvedValue(true);
    mockGetCircuitBreakerStatus.mockReturnValue({
      ai: { state: 'OPEN' },
    });

    const res = await GET();
    const json = await res.json();

    expect(json.status).toBe('unhealthy');
    expect(json.checks.circuitBreakers.status).toBe('fail');
  });

  it('includes response times in database and redis checks', async () => {
    mockLimit.mockResolvedValue({ error: null });
    mockIsRedisAvailable.mockResolvedValue(true);
    mockGetCircuitBreakerStatus.mockReturnValue({ ai: { state: 'CLOSED' } });

    const res = await GET();
    const json = await res.json();

    expect(typeof json.checks.database.responseTime).toBe('number');
    expect(typeof json.checks.redis.responseTime).toBe('number');
  });
});
