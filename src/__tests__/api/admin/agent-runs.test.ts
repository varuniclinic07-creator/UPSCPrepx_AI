/**
 * Tests for /api/admin/agent-runs route (GET only)
 */
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/security/admin-auth';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));
jest.mock('@/lib/security/admin-auth', () => ({
  requireAdmin: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(url: string) {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

function buildMockQuery(resolvedData: unknown = [], count: number = 0) {
  const mockQuery: Record<string, jest.Mock> = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: resolvedData, error: null }),
  };
  (mockQuery as any).then = (resolve: (v: unknown) => void) =>
    resolve({ data: resolvedData, error: null, count });
  return mockQuery;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('Admin Agent Runs API', () => {
  const mockAdmin = { id: 'admin-1', email: 'admin@test.com', role: 'admin' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---- AUTH ---------------------------------------------------------------

  it('returns 401 when requireAdmin returns null', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue(null);

    const { GET } = await import('@/app/api/admin/agent-runs/route');
    const res = await GET(makeRequest('/api/admin/agent-runs'));

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  // ---- GET: default (no filters) ------------------------------------------

  it('GET returns runs with stats, agentBreakdown, and pagination', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue(mockAdmin);

    const runs = [
      { id: 'r1', agent_type: 'research', status: 'completed', started_at: '2026-04-14T00:00:00Z', completed_at: '2026-04-14T00:01:00Z' },
      { id: 'r2', agent_type: 'normalizer', status: 'running', started_at: '2026-04-14T00:02:00Z', completed_at: null },
    ];

    const recentRuns = [
      { status: 'completed', agent_type: 'research', nodes_processed: 10, content_generated: 5, started_at: '2026-04-14T00:00:00Z', completed_at: '2026-04-14T00:01:00Z' },
      { status: 'running', agent_type: 'normalizer', nodes_processed: 3, content_generated: 2, started_at: '2026-04-14T00:02:00Z', completed_at: null },
      { status: 'failed', agent_type: 'research', nodes_processed: 0, content_generated: 0, started_at: '2026-04-14T00:03:00Z', completed_at: '2026-04-14T00:03:10Z' },
    ];

    const listQuery = buildMockQuery(runs, 2);
    const statsQuery = buildMockQuery(recentRuns);

    let callIndex = 0;
    const mockFrom = jest.fn(() => {
      callIndex++;
      return callIndex === 1 ? listQuery : statsQuery;
    });

    (createClient as jest.Mock).mockResolvedValue({ from: mockFrom });

    const { GET } = await import('@/app/api/admin/agent-runs/route');
    const res = await GET(makeRequest('/api/admin/agent-runs'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.runs).toEqual(runs);

    // Stats computed from recentRuns
    expect(body.data.stats.total_24h).toBe(3);
    expect(body.data.stats.completed).toBe(1);
    expect(body.data.stats.running).toBe(1);
    expect(body.data.stats.failed).toBe(1);
    expect(body.data.stats.nodes_processed_24h).toBe(13);
    expect(body.data.stats.content_generated_24h).toBe(7);
    expect(body.data.stats.avg_duration_sec).toBeGreaterThan(0);

    // Agent breakdown
    expect(body.data.agentBreakdown.research).toBe(2);
    expect(body.data.agentBreakdown.normalizer).toBe(1);

    // Pagination defaults
    expect(body.data.pagination.page).toBe(1);
    expect(body.data.pagination.limit).toBe(20);
  });

  // ---- GET: with status filter ---------------------------------------------

  it('GET filters by status when param is provided', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue(mockAdmin);

    const listQuery = buildMockQuery([], 0);
    const statsQuery = buildMockQuery([]);

    let callIndex = 0;
    const mockFrom = jest.fn(() => {
      callIndex++;
      return callIndex === 1 ? listQuery : statsQuery;
    });

    (createClient as jest.Mock).mockResolvedValue({ from: mockFrom });

    const { GET } = await import('@/app/api/admin/agent-runs/route');
    const res = await GET(makeRequest('/api/admin/agent-runs?status=running'));

    expect(res.status).toBe(200);
    expect(listQuery.eq).toHaveBeenCalledWith('status', 'running');
  });

  // ---- GET: with agent_type filter -----------------------------------------

  it('GET filters by agent_type when param is provided', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue(mockAdmin);

    const listQuery = buildMockQuery([], 0);
    const statsQuery = buildMockQuery([]);

    let callIndex = 0;
    const mockFrom = jest.fn(() => {
      callIndex++;
      return callIndex === 1 ? listQuery : statsQuery;
    });

    (createClient as jest.Mock).mockResolvedValue({ from: mockFrom });

    const { GET } = await import('@/app/api/admin/agent-runs/route');
    const res = await GET(
      makeRequest('/api/admin/agent-runs?agent_type=research&page=2&limit=5')
    );

    expect(res.status).toBe(200);
    expect(listQuery.eq).toHaveBeenCalledWith('agent_type', 'research');
    // range should reflect page=2, limit=5 -> offset 5..9
    expect(listQuery.range).toHaveBeenCalledWith(5, 9);
  });

  // ---- GET: stats avg_duration when no completed runs ----------------------

  it('GET returns avg_duration_sec=0 when no runs have completed_at', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue(mockAdmin);

    const recentRuns = [
      { status: 'running', agent_type: 'research', nodes_processed: 0, content_generated: 0, started_at: '2026-04-14T00:00:00Z', completed_at: null },
    ];

    const listQuery = buildMockQuery([], 0);
    const statsQuery = buildMockQuery(recentRuns);

    let callIndex = 0;
    const mockFrom = jest.fn(() => {
      callIndex++;
      return callIndex === 1 ? listQuery : statsQuery;
    });

    (createClient as jest.Mock).mockResolvedValue({ from: mockFrom });

    const { GET } = await import('@/app/api/admin/agent-runs/route');
    const res = await GET(makeRequest('/api/admin/agent-runs'));

    const body = await res.json();
    expect(body.data.stats.avg_duration_sec).toBe(0);
  });

  // ---- GET: empty recentRuns ------------------------------------------------

  it('GET handles null recentRuns gracefully', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue(mockAdmin);

    const listQuery = buildMockQuery([], 0);
    // Simulate Supabase returning null data
    const statsQuery = buildMockQuery(null);

    let callIndex = 0;
    const mockFrom = jest.fn(() => {
      callIndex++;
      return callIndex === 1 ? listQuery : statsQuery;
    });

    (createClient as jest.Mock).mockResolvedValue({ from: mockFrom });

    const { GET } = await import('@/app/api/admin/agent-runs/route');
    const res = await GET(makeRequest('/api/admin/agent-runs'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.stats.total_24h).toBe(0);
    expect(body.data.stats.nodes_processed_24h).toBe(0);
    expect(body.data.agentBreakdown).toEqual({});
  });
});
