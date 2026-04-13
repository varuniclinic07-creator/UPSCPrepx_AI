/**
 * Tests for /api/cron/daily-plans route
 *
 * Validates authentication, daily plan generation for active users
 * (weak nodes, SRS due nodes, current affairs), and notification insertion.
 */
import { NextRequest } from 'next/server';

// --- Mocks ---

const mockInsert = jest.fn().mockResolvedValue({ data: null, error: null });
const mockFrom = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
  })),
}));

import { POST } from '@/app/api/cron/daily-plans/route';

// --- Helpers ---

function makeRequest(token?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (token) headers['authorization'] = token;
  return new NextRequest('http://localhost/api/cron/daily-plans', {
    method: 'POST',
    headers,
  });
}

/**
 * Sets up the chained Supabase mock for multiple tables:
 * - user_profiles: returns active users
 * - user_mastery (weak): returns weak nodes
 * - user_mastery (SRS due): returns due nodes
 * - current_affairs: returns today's CA
 * - notifications: insert
 */
function setupFullMock(options: {
  users: Array<{ id: string }> | null;
  weakNodes?: any[] | null;
  dueNodes?: any[] | null;
  currentAffairs?: any[] | null;
}) {
  let masteryCallCount = 0;

  mockFrom.mockImplementation((table: string) => {
    if (table === 'user_profiles') {
      return {
        select: jest.fn().mockReturnValue({
          gt: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: options.users }),
          }),
        }),
      };
    }

    if (table === 'user_mastery') {
      masteryCallCount++;
      if (masteryCallCount % 2 === 1) {
        // Weak nodes query (first call per user)
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data: options.weakNodes || null }),
              }),
            }),
          }),
        };
      } else {
        // SRS due nodes query (second call per user)
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data: options.dueNodes || null }),
              }),
            }),
          }),
        };
      }
    }

    if (table === 'current_affairs') {
      return {
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: options.currentAffairs || null }),
          }),
        }),
      };
    }

    if (table === 'notifications') {
      return { insert: mockInsert };
    }

    return {};
  });
}

// --- Tests ---

describe('POST /api/cron/daily-plans', () => {
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
    const res = await POST(makeRequest('Bearer bad'));
    expect(res.status).toBe(401);
  });

  it('returns usersProcessed:0 when no active users exist', async () => {
    setupFullMock({ users: [] });

    const res = await POST(makeRequest('Bearer test-cron-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.usersProcessed).toBe(0);
  });

  it('generates a daily plan with weak nodes, SRS due, and CA items', async () => {
    setupFullMock({
      users: [{ id: 'user-1' }],
      weakNodes: [
        {
          node_id: 'n1',
          accuracy_score: 0.3,
          knowledge_nodes: { id: 'n1', title: 'Indian Constitution', subject: 'Polity' },
        },
      ],
      dueNodes: [
        {
          node_id: 'n2',
          next_revision_at: new Date().toISOString(),
          knowledge_nodes: { id: 'n2', title: 'Monetary Policy', subject: 'Economy' },
        },
      ],
      currentAffairs: [
        { id: 'ca-1', title: 'G20 Summit Recap', node_id: 'ca-node-1' },
      ],
    });

    const res = await POST(makeRequest('Bearer test-cron-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.usersProcessed).toBe(1);
    expect(body.totalUsers).toBe(1);

    // Notification was inserted with plan items
    expect(mockInsert).toHaveBeenCalledTimes(1);
    const insertArg = mockInsert.mock.calls[0][0];
    expect(insertArg.user_id).toBe('user-1');
    expect(insertArg.type).toBe('daily_plan');
    expect(insertArg.read).toBe(false);

    // Parse the plan items from the message JSON
    const plan = JSON.parse(insertArg.message);
    // Should have: 1 weak node (revise) + 1 SRS due (revise) + 1 CA (read) + 1 practice
    expect(plan.length).toBe(4);
    expect(plan[0].action).toBe('revise');
    expect(plan[0].topic).toBe('Indian Constitution');
    expect(plan[1].action).toBe('revise');
    expect(plan[1].reason).toBe('SRS revision due');
    expect(plan[2].action).toBe('read');
    expect(plan[3].action).toBe('practice');
  });

  it('skips notification insert when plan is empty', async () => {
    setupFullMock({
      users: [{ id: 'user-empty' }],
      weakNodes: [],
      dueNodes: [],
      currentAffairs: [],
    });

    const res = await POST(makeRequest('Bearer test-cron-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    // No plan items, so user was not "processed"
    expect(body.usersProcessed).toBe(0);
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
