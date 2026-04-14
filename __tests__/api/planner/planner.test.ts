/** @jest-environment node */

import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFrom = jest.fn();
const mockSupabase = { from: mockFrom };

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    from: (table: any) => mockFrom(table),
  }),
  createServerSupabaseClient: jest.fn().mockResolvedValue({
    from: (table: any) => mockFrom(table),
  }),
}));

const mockRequireSession = jest.fn();
jest.mock('@/lib/auth/session', () => ({
  requireSession: () => mockRequireSession(),
}));

// ---------------------------------------------------------------------------
// SUT
// ---------------------------------------------------------------------------

import { GET, POST } from '@/app/api/planner/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function chainable(resolvedValue: any) {
  const chain: any = {};
  const methods = ['select', 'eq', 'order', 'gte', 'lt', 'insert', 'single'];
  methods.forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  // The last call in a Supabase chain resolves to { data, error }
  chain.then = (resolve: any) => resolve(resolvedValue);
  // Make it thenable so `await` works
  chain[Symbol.toStringTag] = 'Promise';
  return chain;
}

function makeRequest(method: string, url: string, body?: any): NextRequest {
  const init: Record<string, any> = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/planner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns plans, todayTasks, and stats for authenticated user', async () => {
    mockRequireSession.mockResolvedValue({ user: { id: 'user-1' } });

    const plans = [{ id: 'plan-1', plan_name: 'UPSC 2025' }];
    const sessions = [
      {
        id: 's1',
        subject: 'History',
        topic: 'Modern India',
        duration_minutes: 60,
        is_completed: true,
        scheduled_time: '09:00',
      },
      {
        id: 's2',
        subject: 'Polity',
        topic: 'Constitution',
        duration_minutes: 90,
        is_completed: false,
        scheduled_time: '11:00',
      },
    ];

    // First from() call -> study_plans
    const plansChain = chainable({ data: plans, error: null });
    // Second from() call -> study_sessions
    const sessionsChain = chainable({ data: sessions, error: null });

    mockFrom.mockReturnValueOnce(plansChain).mockReturnValueOnce(sessionsChain);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.plans).toHaveLength(1);
    expect(json.todayTasks).toHaveLength(2);
    expect(json.stats).toHaveProperty('totalHoursToday');
    expect(json.stats).toHaveProperty('completedHours');
    expect(json.stats).toHaveProperty('weeklyProgress');
  });

  it('returns 401 when session is missing', async () => {
    mockRequireSession.mockRejectedValue(new Error('Unauthorized'));

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });
});

describe('POST /api/planner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a study plan and returns it', async () => {
    mockRequireSession.mockResolvedValue({ user: { id: 'user-1' } });

    const createdPlan = { id: 'plan-new', plan_name: 'My Plan' };
    const insertChain = chainable({ data: createdPlan, error: null });
    const sessionsInsertChain = chainable({ data: null, error: null });

    mockFrom.mockReturnValueOnce(insertChain).mockReturnValueOnce(sessionsInsertChain);

    const req = makeRequest('POST', '/api/planner', {
      name: 'My Plan',
      exam_date: '2025-06-01',
      daily_hours: 6,
      subjects: ['History', 'Polity'],
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.id).toBe('plan-new');
  });

  it('returns 400 when name is missing', async () => {
    mockRequireSession.mockResolvedValue({ user: { id: 'user-1' } });

    const req = makeRequest('POST', '/api/planner', {
      name: '',
      subjects: ['History'],
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/Plan name is required/i);
  });

  it('returns 400 when subjects is empty', async () => {
    mockRequireSession.mockResolvedValue({ user: { id: 'user-1' } });

    const req = makeRequest('POST', '/api/planner', {
      name: 'My Plan',
      subjects: [],
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/subject/i);
  });

  it('returns 401 when unauthenticated', async () => {
    mockRequireSession.mockRejectedValue(new Error('Unauthorized'));

    const req = makeRequest('POST', '/api/planner', {
      name: 'Plan',
      subjects: ['History'],
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
