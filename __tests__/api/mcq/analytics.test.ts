/** @jest-environment node */

import { GET } from '@/app/api/mcq/analytics/route';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockSupabase = {
  auth: { getUser: () => mockGetUser() },
  from: (...args: unknown[]) => mockFrom(...args),
};
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase)),
}));

const mockGetUserAnalytics = jest.fn();
jest.mock('@/lib/mcq/analytics', () => ({
  analytics: {
    getUserAnalytics: (...args: unknown[]) => mockGetUserAnalytics(...args),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/mcq/analytics');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url, { method: 'GET' });
}

const fakeUser = { id: 'user-1', email: 'test@example.com' };

function mockSupabaseChain(returnValue: unknown) {
  const chain: Record<string, jest.Mock> = {};
  const resolved = Promise.resolve(returnValue);
  const proxy = new Proxy(chain, {
    get(_target, prop) {
      if (prop === 'then') return resolved.then.bind(resolved);
      if (!chain[prop as string]) {
        chain[prop as string] = jest.fn().mockReturnValue(proxy);
      }
      return chain[prop as string];
    },
  });
  return proxy;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/mcq/analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') });

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Authentication required');
  });

  it('returns analytics data with default params', async () => {
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });

    mockGetUserAnalytics.mockResolvedValue({
      overallAccuracy: 72,
      totalQuestions: 500,
      subjectBreakdown: [
        { subject: 'GS1', accuracy: 70, count: 200 },
        { subject: 'GS2', accuracy: 80, count: 150 },
      ],
      topicBreakdown: [
        { subject: 'GS1', topic: 'History', accuracy: 65 },
      ],
      weakAreas: ['Ancient History'],
    });

    // Build chains that properly terminate for each query pattern:
    // 1. mcq_attempts count: .select().eq().not() -> { count: 25 }
    // 2. mcq_bookmarks count: .select().eq() -> { count: 10 }
    // 3. mcq_attempts recent: .select().eq().not().order().limit() -> { data: [...] }

    function makeChain(finalValue: unknown) {
      const chain: Record<string, jest.Mock> = {};
      const resolved = Promise.resolve(finalValue);
      // Every method returns a thenable chain so await works at any point
      const proxy = new Proxy(chain, {
        get(_target, prop) {
          if (prop === 'then') return resolved.then.bind(resolved);
          if (!chain[prop as string]) {
            chain[prop as string] = jest.fn().mockReturnValue(proxy);
          }
          return chain[prop as string];
        },
      });
      return proxy;
    }

    const attemptsCountChain = makeChain({ count: 25 });
    const bookmarksCountChain = makeChain({ count: 10 });
    const recentChain = makeChain({
      data: [
        {
          id: 'a1',
          session_type: 'Practice',
          subject: 'GS1',
          topic: 'History',
          accuracy_percent: 80,
          net_marks: 16,
          completed_at: '2026-04-10T10:00:00Z',
        },
      ],
    });

    let callCount = 0;
    mockFrom.mockImplementation((table: string) => {
      callCount++;
      if (table === 'mcq_attempts' && callCount === 1) return attemptsCountChain;
      if (table === 'mcq_bookmarks') return bookmarksCountChain;
      return recentChain;
    });

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.analytics.overallAccuracy).toBe(72);
    expect(body.data.analytics.subjectBreakdown).toHaveLength(2);
    expect(body.data.quickStats.totalAttempts).toBe(25);
    expect(body.data.quickStats.totalBookmarks).toBe(10);
    expect(body.data.recentActivity).toHaveLength(1);
    // Zod v4: default('30') provides the string after transform, so days is '30'
    expect(body.data.period.days).toBe('30');
    expect(body.data.period.subject).toBe('all');
  });

  it('filters analytics by subject query param', async () => {
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });

    mockGetUserAnalytics.mockResolvedValue({
      overallAccuracy: 72,
      subjectBreakdown: [
        { subject: 'GS1', accuracy: 70 },
        { subject: 'GS2', accuracy: 80 },
      ],
      topicBreakdown: [
        { subject: 'GS1', topic: 'History', accuracy: 65 },
        { subject: 'GS2', topic: 'Polity', accuracy: 85 },
      ],
    });

    const genericChain = mockSupabaseChain({ count: 0, data: [] });
    mockFrom.mockReturnValue(genericChain);

    const res = await GET(makeRequest({ subject: 'GS1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.analytics.subjectBreakdown).toHaveLength(1);
    expect(body.data.analytics.subjectBreakdown[0].subject).toBe('GS1');
    expect(body.data.analytics.topicBreakdown).toHaveLength(1);
    expect(body.data.period.subject).toBe('GS1');
  });

  it('accepts custom days param', async () => {
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });
    mockGetUserAnalytics.mockResolvedValue({
      overallAccuracy: 50,
      subjectBreakdown: [],
      topicBreakdown: [],
    });

    const genericChain = mockSupabaseChain({ count: 0, data: [] });
    mockFrom.mockReturnValue(genericChain);

    const res = await GET(makeRequest({ days: '7' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.period.days).toBe(7);
  });
});
