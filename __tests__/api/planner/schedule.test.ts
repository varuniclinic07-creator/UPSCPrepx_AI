/** @jest-environment node */

import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFromFn = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: (table: any) => mockFromFn(table),
  })),
}));

const mockGetMilestones = jest.fn();
jest.mock('@/lib/planner/milestone-manager', () => ({
  milestoneManager: {
    getMilestones: (planId: any) => mockGetMilestones(planId),
  },
}));

const mockGenerateSchedule = jest.fn();
jest.mock('@/lib/planner/schedule-generator', () => ({
  scheduleGenerator: {
    generateSchedule: (params: any) => mockGenerateSchedule(params),
  },
}));

// ---------------------------------------------------------------------------
// SUT
// ---------------------------------------------------------------------------

import { GET, POST } from '@/app/api/planner/schedule/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function chainable(resolvedValue: any) {
  const chain: any = {};
  const methods = ['select', 'eq', 'order', 'limit', 'single'];
  methods.forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain.then = (resolve: any) => resolve(resolvedValue);
  return chain;
}

function makeRequest(
  method: string,
  url: string,
  body?: any,
  headers?: Record<string, string>,
): NextRequest {
  const init: Record<string, any> = { method, headers: { ...headers } };
  if (body) {
    init.body = JSON.stringify(body);
    (init.headers as Record<string, string>)['Content-Type'] = 'application/json';
  }
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/planner/schedule', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when x-user-id header is missing and no plan_id', async () => {
    const req = makeRequest('GET', '/api/planner/schedule');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
  });

  it('returns active plan for authenticated user', async () => {
    const plan = { id: 'plan-1', is_active: true };
    const milestones = [{ type: 'prelims', title: 'Prelims prep' }];

    mockFromFn.mockReturnValue(chainable({ data: plan }));
    mockGetMilestones.mockResolvedValue(milestones);

    const req = makeRequest('GET', '/api/planner/schedule', undefined, {
      'x-user-id': 'user-1',
    });
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.plan).toEqual(plan);
    expect(json.data.milestones).toEqual(milestones);
  });

  it('returns 404 when no active plan exists', async () => {
    mockFromFn.mockReturnValue(chainable({ data: null }));

    const req = makeRequest('GET', '/api/planner/schedule', undefined, {
      'x-user-id': 'user-1',
    });
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
  });

  it('returns schedule for specific plan_id', async () => {
    const plan = { id: 'plan-1' };
    const schedules = [{ id: 'sched-1', date: '2025-01-01' }];
    const milestones = [{ type: 'mock-test', title: 'Mock 1' }];

    // First from() -> plan lookup, second -> schedules lookup
    mockFromFn
      .mockReturnValueOnce(chainable({ data: plan }))
      .mockReturnValueOnce(chainable({ data: schedules }));

    mockGetMilestones.mockResolvedValue(milestones);

    const req = makeRequest(
      'GET',
      '/api/planner/schedule?plan_id=00000000-0000-0000-0000-000000000001',
    );
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.schedules).toEqual(schedules);
  });
});

describe('POST /api/planner/schedule', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when x-user-id header is missing', async () => {
    const req = makeRequest('POST', '/api/planner/schedule', {
      exam_date: '2025-06-01',
      daily_study_hours: 6,
      subjects: ['History'],
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid input', async () => {
    const req = makeRequest(
      'POST',
      '/api/planner/schedule',
      { exam_date: 'bad-date', daily_study_hours: 0, subjects: [] },
      { 'x-user-id': 'user-1' },
    );
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toMatch(/Invalid input/i);
  });

  it('returns 400 when user already has an active plan', async () => {
    mockFromFn.mockReturnValue(chainable({ data: { id: 'existing-plan' } }));

    const req = makeRequest(
      'POST',
      '/api/planner/schedule',
      { exam_date: '2025-06-01', daily_study_hours: 6, subjects: ['History'] },
      { 'x-user-id': 'user-1' },
    );
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/already have an active/i);
  });

  it('creates schedule successfully', async () => {
    mockFromFn.mockReturnValue(chainable({ data: null }));
    mockGenerateSchedule.mockResolvedValue({
      planId: 'new-plan',
      totalDays: 180,
      totalTasks: 540,
      days: Array.from({ length: 10 }, (_, i) => ({ day: i + 1 })),
    });
    mockGetMilestones.mockResolvedValue([
      { type: 'prelims', title: 'Prelims', estimatedDate: '2025-05-15' },
    ]);

    const req = makeRequest(
      'POST',
      '/api/planner/schedule',
      { exam_date: '2025-06-01', daily_study_hours: 8, subjects: ['History', 'Polity'] },
      { 'x-user-id': 'user-1' },
    );
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.planId).toBe('new-plan');
    expect(json.data.firstWeek).toHaveLength(7);
  });
});
