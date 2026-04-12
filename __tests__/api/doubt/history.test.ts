/** @jest-environment node */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/doubt/history/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetUser = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: {
      getUser: () => mockGetUser(),
    },
  }),
}));

const mockGetHistory = jest.fn();
const mockGetUserUsage = jest.fn();

jest.mock('@/lib/doubt/doubt-service', () => ({
  doubtService: {
    getHistory: (...args: unknown[]) => mockGetHistory(...args),
    getUserUsage: (...args: unknown[]) => mockGetUserUsage(...args),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getReq(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/doubt/history');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url);
}

const sampleThread = {
  id: 't1',
  title_en: 'Article 370',
  is_bookmarked: false,
  created_at: '2025-01-01T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/doubt/history', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    mockGetHistory.mockResolvedValue({ threads: [sampleThread], error: null });
    mockGetUserUsage.mockResolvedValue({ limit_remaining: 2, total_doubts: 5, month: '2025-01' });
  });

  it('returns 401 when user is unauthenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'no' } });

    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid query params', async () => {
    const res = await GET(getReq({ limit: '999' }));
    expect(res.status).toBe(400);
  });

  it('returns paginated doubt history', async () => {
    const res = await GET(getReq());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.threads).toHaveLength(1);
    expect(json.data.pagination.page).toBe(1);
  });

  it('filters by subject', async () => {
    const res = await GET(getReq({ subject: 'GS1' }));
    expect(res.status).toBe(200);
    expect(mockGetHistory).toHaveBeenCalledWith('u1', expect.objectContaining({ subject: 'GS1' }));
  });

  it('filters by bookmarked', async () => {
    mockGetHistory.mockResolvedValueOnce({
      threads: [{ ...sampleThread, is_bookmarked: true }],
      error: null,
    });

    const res = await GET(getReq({ bookmarked: 'true' }));
    const json = await res.json();
    expect(json.data.threads).toHaveLength(1);
  });

  it('returns 500 when service returns error', async () => {
    mockGetHistory.mockResolvedValueOnce({ threads: [], error: 'db down' });

    const res = await GET(getReq());
    expect(res.status).toBe(500);
  });

  it('returns 500 on unexpected error', async () => {
    mockGetHistory.mockRejectedValueOnce(new Error('crash'));

    const res = await GET(getReq());
    expect(res.status).toBe(500);
  });
});
