/**
 * Tests for /api/admin/knowledge-graph route (GET only)
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

describe('Admin Knowledge Graph API', () => {
  const mockAdmin = { id: 'admin-1', email: 'admin@test.com', role: 'admin' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---- AUTH ---------------------------------------------------------------

  it('returns 401 when requireAdmin returns null', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue(null);

    const { GET } = await import('@/app/api/admin/knowledge-graph/route');
    const res = await GET(makeRequest('/api/admin/knowledge-graph'));

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  // ---- GET: default (no filters) ------------------------------------------

  it('GET returns nodes with stats and pagination by default', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue(mockAdmin);

    const nodes = [
      { id: 'n1', type: 'subtopic', title: 'Indian Polity', subject: 'GS2', confidence_score: 0.9, freshness_score: 0.8, human_approved: true },
      { id: 'n2', type: 'topic', title: 'History of India', subject: 'GS1', confidence_score: 0.4, freshness_score: 0.6, human_approved: false },
    ];

    const allNodes = [
      { type: 'subtopic', subject: 'GS2', confidence_score: 0.9, freshness_score: 0.8, human_approved: true },
      { type: 'topic', subject: 'GS1', confidence_score: 0.4, freshness_score: 0.6, human_approved: false },
      { type: 'subtopic', subject: 'GS1', confidence_score: 0.3, freshness_score: 0.5, human_approved: false },
    ];

    const listQuery = buildMockQuery(nodes, 2);
    const statsQuery = buildMockQuery(allNodes);

    let callIndex = 0;
    const mockFrom = jest.fn(() => {
      callIndex++;
      return callIndex === 1 ? listQuery : statsQuery;
    });

    (createClient as jest.Mock).mockResolvedValue({ from: mockFrom });

    const { GET } = await import('@/app/api/admin/knowledge-graph/route');
    const res = await GET(makeRequest('/api/admin/knowledge-graph'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.nodes).toEqual(nodes);

    // Stats derived from allNodes
    const { stats } = body.data;
    expect(stats.total_nodes).toBe(3);
    expect(stats.approved).toBe(1);
    expect(stats.unapproved).toBe(2);
    // low_quality: confidence < 0.5 -> nodes with 0.4 and 0.3
    expect(stats.low_quality).toBe(2);
    // by_type
    expect(stats.by_type.subtopic).toBe(2);
    expect(stats.by_type.topic).toBe(1);
    // by_subject
    expect(stats.by_subject.GS1).toBe(2);
    expect(stats.by_subject.GS2).toBe(1);
    // avg_confidence = (0.9 + 0.4 + 0.3) / 3 ~ 0.53
    expect(stats.avg_confidence).toBeCloseTo(0.53, 1);
    // avg_freshness = (0.8 + 0.6 + 0.5) / 3 ~ 0.63
    expect(stats.avg_freshness).toBeCloseTo(0.63, 1);

    // Pagination
    expect(body.data.pagination.page).toBe(1);
    expect(body.data.pagination.limit).toBe(20);
    expect(body.data.pagination.total).toBe(2);
  });

  // ---- GET: type filter ----------------------------------------------------

  it('GET filters by type when param is provided', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue(mockAdmin);

    const listQuery = buildMockQuery([], 0);
    const statsQuery = buildMockQuery([]);

    let callIndex = 0;
    const mockFrom = jest.fn(() => {
      callIndex++;
      return callIndex === 1 ? listQuery : statsQuery;
    });

    (createClient as jest.Mock).mockResolvedValue({ from: mockFrom });

    const { GET } = await import('@/app/api/admin/knowledge-graph/route');
    const res = await GET(makeRequest('/api/admin/knowledge-graph?type=subtopic'));

    expect(res.status).toBe(200);
    expect(listQuery.eq).toHaveBeenCalledWith('type', 'subtopic');
  });

  // ---- GET: subject + approved filters -------------------------------------

  it('GET filters by subject and approved=true', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue(mockAdmin);

    const listQuery = buildMockQuery([], 0);
    const statsQuery = buildMockQuery([]);

    let callIndex = 0;
    const mockFrom = jest.fn(() => {
      callIndex++;
      return callIndex === 1 ? listQuery : statsQuery;
    });

    (createClient as jest.Mock).mockResolvedValue({ from: mockFrom });

    const { GET } = await import('@/app/api/admin/knowledge-graph/route');
    const res = await GET(
      makeRequest('/api/admin/knowledge-graph?subject=History&approved=true')
    );

    expect(res.status).toBe(200);
    expect(listQuery.eq).toHaveBeenCalledWith('subject', 'History');
    expect(listQuery.eq).toHaveBeenCalledWith('human_approved', true);
  });

  // ---- GET: search filter (ilike) ------------------------------------------

  it('GET uses ilike for search parameter', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue(mockAdmin);

    const listQuery = buildMockQuery([], 0);
    const statsQuery = buildMockQuery([]);

    let callIndex = 0;
    const mockFrom = jest.fn(() => {
      callIndex++;
      return callIndex === 1 ? listQuery : statsQuery;
    });

    (createClient as jest.Mock).mockResolvedValue({ from: mockFrom });

    const { GET } = await import('@/app/api/admin/knowledge-graph/route');
    const res = await GET(makeRequest('/api/admin/knowledge-graph?search=polity'));

    expect(res.status).toBe(200);
    expect(listQuery.ilike).toHaveBeenCalledWith('title', '%polity%');
  });

  // ---- GET: stats with empty allNodes (division by zero guard) -------------

  it('GET handles empty allNodes without division-by-zero errors', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue(mockAdmin);

    const listQuery = buildMockQuery([], 0);
    // Simulate no nodes at all
    const statsQuery = buildMockQuery([]);

    let callIndex = 0;
    const mockFrom = jest.fn(() => {
      callIndex++;
      return callIndex === 1 ? listQuery : statsQuery;
    });

    (createClient as jest.Mock).mockResolvedValue({ from: mockFrom });

    const { GET } = await import('@/app/api/admin/knowledge-graph/route');
    const res = await GET(makeRequest('/api/admin/knowledge-graph'));

    expect(res.status).toBe(200);
    const body = await res.json();
    const { stats } = body.data;
    expect(stats.total_nodes).toBe(0);
    expect(stats.approved).toBe(0);
    expect(stats.unapproved).toBe(0);
    // avg values should be 0 (not NaN) due to the `|| 1` guard in the route
    expect(Number.isNaN(stats.avg_confidence)).toBe(false);
    expect(Number.isNaN(stats.avg_freshness)).toBe(false);
  });
});
