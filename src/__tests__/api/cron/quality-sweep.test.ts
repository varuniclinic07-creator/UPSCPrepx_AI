/**
 * Tests for /api/cron/quality-sweep route
 *
 * Validates authentication, successful sweep execution,
 * and error handling when the quality agent fails.
 */
import { NextRequest } from 'next/server';

// --- Mocks ---

const mockSweepStale = jest.fn();

jest.mock('@/lib/agents/quality-agent', () => ({
  qualityAgent: {
    sweepStale: (...args: any[]) => mockSweepStale(...args),
  },
}));

import { POST } from '@/app/api/cron/quality-sweep/route';

// --- Helpers ---

function makeRequest(token?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (token) headers['authorization'] = token;
  return new NextRequest('http://localhost/api/cron/quality-sweep', {
    method: 'POST',
    headers,
  });
}

// --- Tests ---

describe('POST /api/cron/quality-sweep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when authorization header is missing', async () => {
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when authorization token is wrong', async () => {
    const res = await POST(makeRequest('Bearer invalid'));
    expect(res.status).toBe(401);
  });

  it('returns sweep results on success', async () => {
    mockSweepStale.mockResolvedValue({
      reviewed: 15,
      approved: 12,
      flagged: 3,
    });

    const res = await POST(makeRequest('Bearer test-cron-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.reviewed).toBe(15);
    expect(body.approved).toBe(12);
    expect(body.flagged).toBe(3);
    expect(mockSweepStale).toHaveBeenCalledTimes(1);
  });

  it('returns 500 when sweepStale throws an error', async () => {
    mockSweepStale.mockRejectedValue(new Error('Agent unavailable'));

    const res = await POST(makeRequest('Bearer test-cron-secret'));
    expect(res.status).toBe(500);
    const body = await res.json();

    expect(body.error).toBe('Quality sweep failed');
    expect(body.details).toBe('Agent unavailable');
  });

  it('handles non-Error thrown objects gracefully', async () => {
    mockSweepStale.mockRejectedValue('string error');

    const res = await POST(makeRequest('Bearer test-cron-secret'));
    expect(res.status).toBe(500);
    const body = await res.json();

    expect(body.error).toBe('Quality sweep failed');
    expect(body.details).toBe('Unknown');
  });
});
