/**
 * Tests for /api/admin/content-queue route (GET + PATCH)
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

function makeRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
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
    single: jest.fn().mockResolvedValue({
      data: resolvedData,
      error: null,
    }),
  };
  // Default terminal await resolves to { data, error, count }
  (mockQuery as any).then = (resolve: (v: unknown) => void) =>
    resolve({ data: resolvedData, error: null, count });
  return mockQuery;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('Admin Content Queue API', () => {
  const mockAdmin = { id: 'admin-1', email: 'admin@test.com', role: 'admin' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---- AUTH ---------------------------------------------------------------

  it('returns 401 when requireAdmin returns null', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue(null);

    const { GET } = await import('@/app/api/admin/content-queue/route');
    const res = await GET(makeRequest('/api/admin/content-queue'));

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  // ---- GET: default pending filter ----------------------------------------

  it('GET returns pending items by default with stats and pagination', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue(mockAdmin);

    const queueItems = [
      { id: 'q1', content_type: 'note', status: 'pending', confidence_score: 0.8 },
      { id: 'q2', content_type: 'note', status: 'pending', confidence_score: 0.7 },
    ];
    const allStatuses = [
      { status: 'pending' },
      { status: 'pending' },
      { status: 'approved' },
      { status: 'rejected' },
    ];

    const listQuery = buildMockQuery(queueItems, 2);
    const statsQuery = buildMockQuery(allStatuses);

    let callIndex = 0;
    const mockFrom = jest.fn(() => {
      callIndex++;
      return callIndex === 1 ? listQuery : statsQuery;
    });

    (createClient as jest.Mock).mockResolvedValue({ from: mockFrom });

    const { GET } = await import('@/app/api/admin/content-queue/route');
    const res = await GET(makeRequest('/api/admin/content-queue'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.items).toEqual(queueItems);
    expect(body.data.stats.pending).toBe(2);
    expect(body.data.stats.approved).toBe(1);
    expect(body.data.stats.rejected).toBe(1);
    expect(body.data.pagination.page).toBe(1);

    // The list query should filter by status='pending'
    expect(listQuery.eq).toHaveBeenCalledWith('status', 'pending');
  });

  // ---- GET: with type filter -----------------------------------------------

  it('GET filters by content_type when type param is provided', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue(mockAdmin);

    const listQuery = buildMockQuery([], 0);
    const statsQuery = buildMockQuery([]);

    let callIndex = 0;
    const mockFrom = jest.fn(() => {
      callIndex++;
      return callIndex === 1 ? listQuery : statsQuery;
    });

    (createClient as jest.Mock).mockResolvedValue({ from: mockFrom });

    const { GET } = await import('@/app/api/admin/content-queue/route');
    const res = await GET(
      makeRequest('/api/admin/content-queue?type=note&status=all&page=2&limit=10')
    );

    expect(res.status).toBe(200);
    // status=all should NOT add an eq('status', ...) filter
    // but type=note should add eq('content_type', 'note')
    expect(listQuery.eq).toHaveBeenCalledWith('content_type', 'note');
  });

  // ---- PATCH: approve ------------------------------------------------------

  it('PATCH approve updates status, marks knowledge_node approved, and logs', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue(mockAdmin);

    const updatedItem = {
      id: 'q1',
      content_type: 'note',
      status: 'approved',
      node_id: 'node-1',
    };

    // content_queue update chain
    const updateQuery = buildMockQuery();
    updateQuery.single.mockResolvedValue({ data: updatedItem, error: null });

    // knowledge_nodes update chain
    const knowledgeQuery = buildMockQuery();

    // admin_logs insert chain
    const logQuery = buildMockQuery();

    let callIndex = 0;
    const mockFrom = jest.fn(() => {
      callIndex++;
      if (callIndex === 1) return updateQuery;   // content_queue update
      if (callIndex === 2) return knowledgeQuery; // knowledge_nodes update
      return logQuery;                             // admin_logs insert
    });

    (createClient as jest.Mock).mockResolvedValue({ from: mockFrom });

    const { PATCH } = await import('@/app/api/admin/content-queue/route');
    const res = await PATCH(
      makeRequest('/api/admin/content-queue', {
        method: 'PATCH',
        body: JSON.stringify({
          itemId: 'q1',
          action: 'approve',
          reviewNotes: 'Looks good',
        }),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual(updatedItem);

    // Should have called from('content_queue'), from('knowledge_nodes'), from('admin_logs')
    expect(mockFrom).toHaveBeenCalledWith('content_queue');
    expect(mockFrom).toHaveBeenCalledWith('knowledge_nodes');
    expect(mockFrom).toHaveBeenCalledWith('admin_logs');

    // knowledge_nodes should be updated with human_approved
    expect(knowledgeQuery.update).toHaveBeenCalledWith({ human_approved: true });
  });

  // ---- PATCH: reject -------------------------------------------------------

  it('PATCH reject updates status without marking knowledge_node approved', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue(mockAdmin);

    const rejectedItem = {
      id: 'q2',
      content_type: 'summary',
      status: 'rejected',
      node_id: 'node-2',
    };

    const updateQuery = buildMockQuery();
    updateQuery.single.mockResolvedValue({ data: rejectedItem, error: null });

    const logQuery = buildMockQuery();

    let callIndex = 0;
    const mockFrom = jest.fn(() => {
      callIndex++;
      if (callIndex === 1) return updateQuery;
      return logQuery;
    });

    (createClient as jest.Mock).mockResolvedValue({ from: mockFrom });

    const { PATCH } = await import('@/app/api/admin/content-queue/route');
    const res = await PATCH(
      makeRequest('/api/admin/content-queue', {
        method: 'PATCH',
        body: JSON.stringify({ itemId: 'q2', action: 'reject', reviewNotes: 'Poor quality' }),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    // reject should NOT touch knowledge_nodes, only content_queue + admin_logs
    expect(mockFrom).not.toHaveBeenCalledWith('knowledge_nodes');
  });

  // ---- PATCH: invalid action ------------------------------------------------

  it('PATCH returns 400 for invalid action', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue(mockAdmin);

    const { PATCH } = await import('@/app/api/admin/content-queue/route');
    const res = await PATCH(
      makeRequest('/api/admin/content-queue', {
        method: 'PATCH',
        body: JSON.stringify({ itemId: 'q1', action: 'delete' }),
      })
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('action');
  });

  // ---- PATCH: missing itemId ------------------------------------------------

  it('PATCH returns 400 when itemId is missing', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue(mockAdmin);

    const { PATCH } = await import('@/app/api/admin/content-queue/route');
    const res = await PATCH(
      makeRequest('/api/admin/content-queue', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'approve' }),
      })
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});
