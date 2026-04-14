/** @jest-environment node */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/usage/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSelect = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockGte = jest.fn();
const mockInsert = jest.fn().mockResolvedValue({ error: null });
const mockUpsert = jest.fn().mockResolvedValue({ error: null });

const mockFrom = jest.fn(() => ({
  select: mockSelect,
  eq: mockEq,
  gte: mockGte,
  insert: mockInsert,
  upsert: mockUpsert,
}));
mockSelect.mockReturnValue({ eq: mockEq });
mockEq.mockReturnValue({ gte: mockGte, select: mockSelect });

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({ from: (table: any) => mockFrom(table) })) as any,
}));

const mockRequireSession = jest.fn();

jest.mock('@/lib/auth/session', () => ({
  requireSession: () => mockRequireSession(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init as any);
}

// ---------------------------------------------------------------------------
// Tests - GET /api/usage
// ---------------------------------------------------------------------------

function resetChain() {
  mockFrom.mockImplementation(() => ({
    select: mockSelect,
    eq: mockEq,
    gte: mockGte,
    insert: mockInsert,
    upsert: mockUpsert,
  }));
  mockSelect.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ gte: mockGte, select: mockSelect, eq: mockEq });
  mockInsert.mockResolvedValue({ error: null });
  mockUpsert.mockResolvedValue({ error: null });
}

describe('GET /api/usage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetChain();
    mockRequireSession.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('returns usage stats and limits', async () => {
    const usageRows = [
      { feature_name: 'search', tokens_used: 100, used_at: '2026-04-10T00:00:00Z' },
      { feature_name: 'search', tokens_used: 50, used_at: '2026-04-11T00:00:00Z' },
    ];
    const limitRows = [
      { feature_name: 'search', limit_type: 'daily', limit_value: 50, current_count: 2, reset_at: null },
    ];

    // First from('usage_tracking'): .select().eq().gte() -> resolves usage rows
    // Second from('usage_limits'): .select().eq() -> resolves limit rows
    let fromCallCount = 0;
    mockFrom.mockImplementation((() => {
      fromCallCount++;
      if (fromCallCount === 1) {
        // usage_tracking chain: select -> eq -> gte
        const gte = jest.fn().mockResolvedValue({ data: usageRows });
        const eq = jest.fn().mockReturnValue({ gte });
        const select = jest.fn().mockReturnValue({ eq });
        return { select, eq, gte };
      } else {
        // usage_limits chain: select -> eq (resolves)
        const eq = jest.fn().mockResolvedValue({ data: limitRows });
        const select = jest.fn().mockReturnValue({ eq });
        return { select, eq };
      }
    }) as any);

    const res = await GET(buildRequest('/api/usage'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.usage).toBeDefined();
    expect(json.limits).toBeDefined();
    expect(json.period).toBeDefined();
  });

  it('returns 401 when session is missing', async () => {
    mockRequireSession.mockRejectedValue(new Error('Authentication required'));

    const res = await GET(buildRequest('/api/usage'));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe('Please sign in');
  });
});

// ---------------------------------------------------------------------------
// Tests - POST /api/usage
// ---------------------------------------------------------------------------

describe('POST /api/usage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetChain();
    mockRequireSession.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('records usage successfully', async () => {
    const req = new NextRequest('http://localhost:3000/api/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feature: 'search', tokensUsed: 100 }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.message).toBe('Usage recorded');
  });

  it('returns 400 when feature is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Feature is required');
  });

  it('returns 401 when session is missing', async () => {
    mockRequireSession.mockRejectedValue(new Error('Authentication required'));

    const req = new NextRequest('http://localhost:3000/api/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feature: 'search' }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe('Please sign in');
  });
});
