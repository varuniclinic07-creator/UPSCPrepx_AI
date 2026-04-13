/**
 * Tests for /api/cron/freshness-check route
 *
 * Validates authentication, freshness decay for stale knowledge nodes,
 * and correct count reporting.
 */
import { NextRequest } from 'next/server';

// --- Mocks ---

const mockUpdate = jest.fn().mockReturnValue({
  eq: jest.fn().mockResolvedValue({ data: null, error: null }),
});

const mockFrom = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
  })),
}));

import { POST } from '@/app/api/cron/freshness-check/route';

// --- Helpers ---

function makeRequest(token?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (token) headers['authorization'] = token;
  return new NextRequest('http://localhost/api/cron/freshness-check', {
    method: 'POST',
    headers,
  });
}

function setupStaleNodesQuery(
  nodes: Array<{ id: string; freshness_score: number }> | null,
  error: any = null
) {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'knowledge_nodes') {
      return {
        select: jest.fn().mockReturnValue({
          lt: jest.fn().mockReturnValue({
            gt: jest.fn().mockResolvedValue({ data: nodes, error }),
          }),
        }),
        update: mockUpdate,
      };
    }
    return {};
  });
}

// --- Tests ---

describe('POST /api/cron/freshness-check', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when authorization header is missing', async () => {
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when authorization token is incorrect', async () => {
    const res = await POST(makeRequest('Bearer bad-token'));
    expect(res.status).toBe(401);
  });

  it('returns decayed:0 when no stale nodes are found', async () => {
    setupStaleNodesQuery(null);

    const res = await POST(makeRequest('Bearer test-cron-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.decayed).toBe(0);
  });

  it('decays freshness_score by 0.1 for each stale node', async () => {
    const staleNodes = [
      { id: 'node-1', freshness_score: 0.8 },
      { id: 'node-2', freshness_score: 0.5 },
      { id: 'node-3', freshness_score: 0.2 },
    ];
    setupStaleNodesQuery(staleNodes);

    const res = await POST(makeRequest('Bearer test-cron-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.decayed).toBe(3);
    expect(body.total).toBe(3);
    // update is called once per node
    expect(mockUpdate).toHaveBeenCalledTimes(3);
  });

  it('clamps freshness_score to minimum 0.1', async () => {
    // Node with freshness 0.15 should clamp to 0.1 after decay
    setupStaleNodesQuery([{ id: 'node-low', freshness_score: 0.15 }]);

    const res = await POST(makeRequest('Bearer test-cron-secret'));
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.decayed).toBe(1);
    // The update call should have been made with the clamped value
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        freshness_score: 0.1,
      })
    );
  });
});
