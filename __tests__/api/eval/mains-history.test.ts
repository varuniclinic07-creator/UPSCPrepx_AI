/** @jest-environment node */

import { NextRequest } from 'next/server';
import { GET, DELETE } from '@/app/api/eval/mains/history/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetSession = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: { getSession: () => mockGetSession() },
    from: (...args: unknown[]) => mockFrom(...args),
  }),
}));

const mockGetEvaluationHistory = jest.fn();

jest.mock('@/lib/eval/mains-evaluator-service', () => ({
  getEvaluationHistory: (...args: unknown[]) => mockGetEvaluationHistory(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getReq(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/eval/mains/history');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url);
}

function deleteReq(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/eval/mains/history');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url, { method: 'DELETE' });
}

const fakeSession = { user: { id: 'u1' } };

// ---------------------------------------------------------------------------
// GET tests
// ---------------------------------------------------------------------------

describe('GET /api/eval/mains/history', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: fakeSession }, error: null });
    mockGetEvaluationHistory.mockResolvedValue({
      evaluations: [{ id: 'e1', score: 30 }],
      pagination: { page: 1, limit: 20, total: 1 },
      stats: { avg: 30 },
    });
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: null }, error: null });

    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid query params', async () => {
    const res = await GET(getReq({ limit: '999' }));
    expect(res.status).toBe(400);
  });

  it('returns evaluation history on success', async () => {
    const res = await GET(getReq({ page: '1', limit: '10' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.pagination.page).toBe(1);
  });

  it('passes subject filter to service', async () => {
    await GET(getReq({ subject: 'GS1' }));
    expect(mockGetEvaluationHistory).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ subject: 'GS1' }),
    );
  });

  it('returns 500 on service error', async () => {
    mockGetEvaluationHistory.mockRejectedValueOnce(new Error('db'));

    const res = await GET(getReq());
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// DELETE tests
// ---------------------------------------------------------------------------

describe('DELETE /api/eval/mains/history', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: fakeSession }, error: null });
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: null }, error: null });

    const res = await DELETE(deleteReq({ id: 'e1' }));
    expect(res.status).toBe(401);
  });

  it('returns 403 when user is not admin', async () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { is_admin: false }, error: null }),
        }),
      }),
    });

    const res = await DELETE(deleteReq({ id: 'e1' }));
    expect(res.status).toBe(403);
  });

  it('returns 400 when evaluation id is missing', async () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { is_admin: true }, error: null }),
        }),
      }),
    });

    const res = await DELETE(deleteReq());
    expect(res.status).toBe(400);
  });

  it('deletes evaluation successfully when admin', async () => {
    const mockDelete = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { is_admin: true }, error: null }),
            }),
          }),
        };
      }
      // mains_evaluations
      return { delete: mockDelete };
    });

    const res = await DELETE(deleteReq({ id: 'e1' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
