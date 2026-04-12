/** @jest-environment node */

import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFromFn = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: (...args: any[]) => mockFromFn(...args),
  })),
}));

const mockCompleteTask = jest.fn();
jest.mock('@/lib/planner/progress-tracker', () => ({
  progressTracker: {
    completeTask: (...args: any[]) => mockCompleteTask(...args),
  },
}));

const mockCheckAllMilestones = jest.fn();
jest.mock('@/lib/planner/milestone-manager', () => ({
  milestoneManager: {
    checkAllMilestones: (...args: any[]) => mockCheckAllMilestones(...args),
  },
}));

// ---------------------------------------------------------------------------
// SUT
// ---------------------------------------------------------------------------

import { POST } from '@/app/api/planner/complete/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function chainable(resolvedValue: any) {
  const chain: any = {};
  const methods = ['select', 'eq', 'single'];
  methods.forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain.then = (resolve: any) => resolve(resolvedValue);
  return chain;
}

function makeRequest(body: any, headers?: Record<string, string>): NextRequest {
  return new NextRequest(new URL('/api/planner/complete', 'http://localhost:3000'), {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/planner/complete', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when x-user-id header is missing', async () => {
    const req = makeRequest({ task_id: VALID_UUID, time_spent_minutes: 30 });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid payload (missing task_id)', async () => {
    const req = makeRequest(
      { time_spent_minutes: 30 },
      { 'x-user-id': 'user-1' },
    );
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/Invalid input/i);
  });

  it('returns 404 when task is not found', async () => {
    mockFromFn.mockReturnValue(chainable({ data: null }));

    const req = makeRequest(
      { task_id: VALID_UUID, time_spent_minutes: 30 },
      { 'x-user-id': 'user-1' },
    );
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toMatch(/not found/i);
  });

  it('returns 403 when task does not belong to user', async () => {
    const task = { id: VALID_UUID, status: 'pending', schedules: { plan_id: 'plan-1' } };
    const plan = { user_id: 'other-user' };

    mockFromFn
      .mockReturnValueOnce(chainable({ data: task }))
      .mockReturnValueOnce(chainable({ data: plan }));

    const req = makeRequest(
      { task_id: VALID_UUID, time_spent_minutes: 30 },
      { 'x-user-id': 'user-1' },
    );
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('returns 400 when task is already completed', async () => {
    const task = { id: VALID_UUID, status: 'completed', schedules: { plan_id: 'plan-1' } };
    const plan = { user_id: 'user-1' };

    mockFromFn
      .mockReturnValueOnce(chainable({ data: task }))
      .mockReturnValueOnce(chainable({ data: plan }));

    const req = makeRequest(
      { task_id: VALID_UUID, time_spent_minutes: 30 },
      { 'x-user-id': 'user-1' },
    );
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/already completed/i);
  });

  it('completes task successfully and returns xp and achievements', async () => {
    const task = { id: VALID_UUID, status: 'pending', schedules: { plan_id: 'plan-1' } };
    const plan = { user_id: 'user-1' };

    mockFromFn
      .mockReturnValueOnce(chainable({ data: task }))
      .mockReturnValueOnce(chainable({ data: plan }));

    mockCompleteTask.mockResolvedValue({
      xpEarned: 50,
      streakDays: 3,
      dailyProgress: { completed: 2, total: 5 },
    });

    mockCheckAllMilestones.mockResolvedValue([
      {
        milestone: { type: 'first_task', title: 'First Task Done' },
        xpReward: 100,
        celebrationMessage: 'Congrats!',
      },
    ]);

    const req = makeRequest(
      { task_id: VALID_UUID, time_spent_minutes: 45, quality_rating: 4 },
      { 'x-user-id': 'user-1' },
    );
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.xpEarned).toBe(50);
    expect(json.data.streakDays).toBe(3);
    expect(json.data.achievements).toHaveLength(1);
    expect(json.data.achievements[0].milestoneType).toBe('first_task');
  });
});
