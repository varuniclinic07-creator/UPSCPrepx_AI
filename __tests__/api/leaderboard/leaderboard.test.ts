/** @jest-environment node */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFrom = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    from: (...args: any[]) => mockFrom(...args),
  }),
}));

const mockRequireSession = jest.fn();
jest.mock('@/lib/auth/auth-config', () => ({
  requireSession: () => mockRequireSession(),
  requireUser: jest.fn(),
}));

// ---------------------------------------------------------------------------
// SUT
// ---------------------------------------------------------------------------

import { GET } from '@/app/api/leaderboard/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function chainable(resolvedValue: any) {
  const chain: any = {};
  const methods = ['select', 'order', 'limit', 'eq'];
  methods.forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain.then = (resolve: any) => resolve(resolvedValue);
  return chain;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/leaderboard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns leaderboard and user rank', async () => {
    mockRequireSession.mockResolvedValue({ user: { id: 'user-2' } });

    const leaderboard = [
      { id: 'user-1', name: 'Alice', avatar_url: null, points: 500, rank: 1 },
      { id: 'user-2', name: 'Bob', avatar_url: null, points: 400, rank: 2 },
      { id: 'user-3', name: 'Charlie', avatar_url: null, points: 300, rank: 3 },
    ];

    mockFrom.mockReturnValue(chainable({ data: leaderboard, error: null }));

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.leaderboard).toHaveLength(3);
    expect(json.userRank).toBe(2); // user-2 is at index 1, rank = 2
  });

  it('returns "50+" when user is not in top 50', async () => {
    mockRequireSession.mockResolvedValue({ user: { id: 'user-99' } });

    const leaderboard = [
      { id: 'user-1', name: 'Alice', points: 500, rank: 1 },
    ];

    mockFrom.mockReturnValue(chainable({ data: leaderboard, error: null }));

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.userRank).toBe('50+');
  });

  it('returns 401 when unauthenticated', async () => {
    mockRequireSession.mockRejectedValue(new Error('Unauthorized'));

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 500 when database query fails', async () => {
    mockRequireSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockFrom.mockReturnValue(
      chainable({ data: null, error: { message: 'DB timeout' } }),
    );

    // The route does `if (error) throw error`, so the thrown object has .message
    // But the thrown value is { message: 'DB timeout' }, so error.message = 'DB timeout'
    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(500);
  });
});
