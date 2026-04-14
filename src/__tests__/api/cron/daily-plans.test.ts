/**
 * Tests for /api/cron/daily-plans route
 *
 * Validates authentication, daily plan generation for active users
 * (weak nodes, SRS due nodes, untouched nodes, current affairs,
 * CA-to-weak cross-reference), and notification insertion.
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
 * - user_mastery (weak): returns weak nodes (call 1)
 * - user_mastery (SRS due): returns due nodes (call 2)
 * - user_mastery (touched node IDs): returns node_id list (call 3)
 * - knowledge_nodes: returns untouched nodes
 * - current_affairs: returns today's CA
 * - knowledge_edges: returns edge links for CA-to-weak
 * - notifications: insert
 */
function setupFullMock(options: {
  users: Array<{ id: string }> | null;
  weakNodes?: any[] | null;
  dueNodes?: any[] | null;
  touchedNodeIds?: Array<{ node_id: string }> | null;
  untouchedNodes?: any[] | null;
  currentAffairs?: any[] | null;
  linkedEdges?: any[] | null;
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
      const callType = masteryCallCount % 3;
      if (callType === 1) {
        // Weak nodes query (first call per user): .select().eq().eq().limit()
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data: options.weakNodes || null }),
              }),
            }),
          }),
        };
      } else if (callType === 2) {
        // SRS due nodes query (second call per user): .select().eq().lte().limit()
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data: options.dueNodes || null }),
              }),
            }),
          }),
        };
      } else {
        // Touched node IDs query (third call per user): .select().eq() -> resolves
        const resolvedData = { data: options.touchedNodeIds || null };
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue(resolvedData),
          }),
        };
      }
    }

    if (table === 'knowledge_nodes') {
      // Build a chainable mock: .select().limit() returns a thenable builder
      // that also supports .not() for further filtering.
      const resolvedData = { data: options.untouchedNodes || null };
      const makeThenableBuilder = () => {
        const builder: any = {
          not: jest.fn().mockReturnValue({
            then: (resolve: any) => resolve(resolvedData),
          }),
          then: (resolve: any) => resolve(resolvedData),
        };
        return builder;
      };
      return {
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue(makeThenableBuilder()),
          not: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(resolvedData),
          }),
        }),
      };
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

    if (table === 'knowledge_edges') {
      return {
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: options.linkedEdges || null }),
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

  it('generates a daily plan with weak nodes, SRS due, untouched, and CA items', async () => {
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
      touchedNodeIds: [{ node_id: 'n1' }, { node_id: 'n2' }],
      untouchedNodes: [
        { id: 'n3', title: 'Ancient India', subject: 'History' },
      ],
      currentAffairs: [
        { id: 'ca-1', title: 'G20 Summit Recap', node_id: 'ca-node-1' },
      ],
      linkedEdges: [],
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
    // Should have: 1 weak (revise) + 1 SRS (revise) + 1 untouched (new)
    //            + 1 CA (read) + 1 practice = 5
    expect(plan.length).toBe(5);
    expect(plan[0].action).toBe('revise');
    expect(plan[0].topic).toBe('Indian Constitution');
    expect(plan[1].action).toBe('revise');
    expect(plan[1].reason).toBe('SRS revision due');
    expect(plan[2].action).toBe('new');
    expect(plan[2].topic).toBe('Ancient India');
    expect(plan[2].reason).toBe('New topic \u2014 not yet started');
    expect(plan[3].action).toBe('read');
    expect(plan[4].action).toBe('practice');
  });

  it('includes CA-to-weak cross-reference when CA node matches a weak node', async () => {
    setupFullMock({
      users: [{ id: 'user-2' }],
      weakNodes: [
        {
          node_id: 'weak-1',
          accuracy_score: 0.25,
          knowledge_nodes: { id: 'weak-1', title: 'Federalism', subject: 'Polity' },
        },
      ],
      dueNodes: [],
      touchedNodeIds: [{ node_id: 'weak-1' }],
      untouchedNodes: [],
      currentAffairs: [
        { id: 'ca-2', title: 'Supreme Court on State Rights', node_id: 'weak-1' },
      ],
      linkedEdges: [],
    });

    const res = await POST(makeRequest('Bearer test-cron-secret'));
    const body = await res.json();
    expect(body.usersProcessed).toBe(1);

    const plan = JSON.parse(mockInsert.mock.calls[0][0].message);
    // Should include a CA-to-weak cross-reference item
    const crossRef = plan.find((item: any) =>
      item.reason.includes("Related to today's news")
    );
    expect(crossRef).toBeDefined();
    expect(crossRef.action).toBe('revise');
    expect(crossRef.nodeId).toBe('weak-1');
  });

  it('includes CA-to-weak via knowledge_edges', async () => {
    setupFullMock({
      users: [{ id: 'user-3' }],
      weakNodes: [
        {
          node_id: 'weak-edge',
          accuracy_score: 0.4,
          knowledge_nodes: { id: 'weak-edge', title: 'Parliament', subject: 'Polity' },
        },
      ],
      dueNodes: [],
      touchedNodeIds: [{ node_id: 'weak-edge' }],
      untouchedNodes: [],
      currentAffairs: [
        { id: 'ca-3', title: 'New Bill Passed', node_id: 'ca-node-3' },
      ],
      linkedEdges: [
        { from_node_id: 'ca-node-3', to_node_id: 'weak-edge' },
      ],
    });

    const res = await POST(makeRequest('Bearer test-cron-secret'));
    const body = await res.json();
    expect(body.usersProcessed).toBe(1);

    const plan = JSON.parse(mockInsert.mock.calls[0][0].message);
    const edgeCrossRef = plan.find((item: any) =>
      item.reason.includes('New Bill Passed')
    );
    expect(edgeCrossRef).toBeDefined();
    expect(edgeCrossRef.nodeId).toBe('weak-edge');
  });

  it('skips notification insert when plan is empty', async () => {
    setupFullMock({
      users: [{ id: 'user-empty' }],
      weakNodes: [],
      dueNodes: [],
      touchedNodeIds: [],
      untouchedNodes: [],
      currentAffairs: [],
      linkedEdges: [],
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
