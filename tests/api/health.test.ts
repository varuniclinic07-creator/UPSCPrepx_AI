/**
 * @jest-environment node
 */
import { GET } from '@/app/api/health/route';

const mockFrom = jest.fn(() => ({
  select: jest.fn(() => ({
    limit: jest.fn(),
  })),
}));
jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(() => Promise.resolve({ from: mockFrom })),
}));

const mockPing = jest.fn();
const mockQuit = jest.fn();
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    ping: mockPing,
    quit: mockQuit,
  }));
});

const mockGetCircuitBreakerStatus = jest.fn();
jest.mock('@/lib/resilience/circuit-breaker', () => ({
  getCircuitBreakerStatus: () => mockGetCircuitBreakerStatus(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  process.env.REDIS_URL = 'redis://localhost:6379';
});

describe('GET /api/health', () => {
  it('returns healthy when all checks pass', async () => {
    mockFrom.mockReturnValue({ select: jest.fn(() => ({ limit: jest.fn().mockResolvedValue({ error: null }) })) });
    mockPing.mockResolvedValue('PONG');
    mockQuit.mockResolvedValue(undefined);
    mockGetCircuitBreakerStatus.mockReturnValue({ ai: { state: 'CLOSED' } });

    const res = await GET();
    const data = await res.json();
    expect(data.status).toBe('healthy');
    expect(res.status).toBe(200);
  });

  it('returns unhealthy when database fails', async () => {
    mockFrom.mockReturnValue({ select: jest.fn(() => ({ limit: jest.fn().mockResolvedValue({ error: new Error('DB down') }) })) });
    mockPing.mockResolvedValue('PONG');
    mockQuit.mockResolvedValue(undefined);
    mockGetCircuitBreakerStatus.mockReturnValue({ ai: { state: 'CLOSED' } });

    const res = await GET();
    const data = await res.json();
    expect(data.checks.database.status).toBe('fail');
  });

  it('returns 503 when unhealthy', async () => {
    mockFrom.mockReturnValue({ select: jest.fn(() => ({ limit: jest.fn().mockRejectedValue(new Error('DB down')) })) });
    mockPing.mockRejectedValue(new Error('Redis down'));
    mockQuit.mockResolvedValue(undefined);
    mockGetCircuitBreakerStatus.mockReturnValue({ ai: { state: 'OPEN' } });

    const res = await GET();
    expect(res.status).toBe(503);
  });
});
