/**
 * @jest-environment node
 */

// Mock ioredis
const mockExec = jest.fn();
const mockZremrangebyscore = jest.fn().mockResolvedValue(0);

const mockPipeline = {
  zremrangebyscore: jest.fn().mockReturnThis(),
  zadd: jest.fn().mockReturnThis(),
  zcard: jest.fn().mockReturnThis(),
  expire: jest.fn().mockReturnThis(),
  exec: mockExec,
};

jest.mock('ioredis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({
      pipeline: () => mockPipeline,
      zremrangebyscore: mockZremrangebyscore,
      disconnect: jest.fn(),
    })),
  };
});

import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rate-limiter';

describe('rate-limiter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('RATE_LIMITS', () => {
    it('has all required limit configs', () => {
      expect(RATE_LIMITS.auth).toBeDefined();
      expect(RATE_LIMITS.otp).toBeDefined();
      expect(RATE_LIMITS.aiChat).toBeDefined();
      expect(RATE_LIMITS.api).toBeDefined();
      expect(RATE_LIMITS.admin).toBeDefined();
    });

    it('auth limits are stricter than general API', () => {
      expect(RATE_LIMITS.auth.limit).toBeLessThan(RATE_LIMITS.api.limit);
    });

    it('all configs have required fields', () => {
      for (const [, config] of Object.entries(RATE_LIMITS)) {
        expect(config.limit).toBeGreaterThan(0);
        expect(config.window).toBeGreaterThan(0);
        expect(config.prefix).toBeTruthy();
      }
    });
  });

  describe('checkRateLimit', () => {
    it('allows requests under limit', async () => {
      // zcard returns 1 (under 100 limit)
      mockExec.mockResolvedValue([[null, 0], [null, 1], [null, 1], [null, 1]]);

      const result = await checkRateLimit('user-1', RATE_LIMITS.api);
      expect(result.success).toBe(true);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    });

    it('blocks requests over limit', async () => {
      // zcard returns 100 (= api limit of 100)
      mockExec.mockResolvedValue([[null, 0], [null, 100], [null, 1], [null, 1]]);

      const result = await checkRateLimit('user-1', RATE_LIMITS.api);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeDefined();
    });

    it('fails open on redis error', async () => {
      mockExec.mockRejectedValue(new Error('Redis connection failed'));

      const result = await checkRateLimit('user-1', RATE_LIMITS.api);
      // Fail-open: allow request when Redis is down
      expect(result.success).toBe(true);
    });
  });
});
