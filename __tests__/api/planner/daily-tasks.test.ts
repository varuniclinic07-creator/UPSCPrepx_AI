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

jest.mock('@/lib/planner/recommendation-engine', () => ({
  recommendationEngine: {
    getDailyRecommendations: jest.fn().mockResolvedValue([]),
  },
}));

// ---------------------------------------------------------------------------
// SUT
// ---------------------------------------------------------------------------

import { GET } from '@/app/api/planner/daily-tasks/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function chainable(resolvedValue: any) {
  const chain: any = {};
  const methods = ['select', 'eq', 'order', 'single'];
  methods.forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain.then = (resolve: any) => resolve(resolvedValue);
  return chain;
}

function makeRequest(url: string, headers?: Record<string, string>): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: 'GET',
    headers,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/planner/daily-tasks', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when x-user-id header is missing', async () => {
    const req = makeRequest('/api/planner/daily-tasks');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
  });

  it('returns 404 when no active study plan exists', async () => {
    mockFromFn.mockReturnValue(chainable({ data: null }));

    const req = makeRequest('/api/planner/daily-tasks', { 'x-user-id': 'user-1' });
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error).toMatch(/No active study plan/i);
  });

  it('returns empty tasks when no schedule exists for the date', async () => {
    // First from() -> study_plans (active plan found)
    // Second from() -> study_schedules (no schedule for date)
    mockFromFn
      .mockReturnValueOnce(chainable({ data: { id: 'plan-1' } }))
      .mockReturnValueOnce(chainable({ data: null }));

    const req = makeRequest('/api/planner/daily-tasks?date=2025-01-01', {
      'x-user-id': 'user-1',
    });
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.tasks).toHaveLength(0);
    expect(json.data.totalTasks).toBe(0);
  });

  it('returns tasks with progress for the requested date', async () => {
    const schedule = {
      id: 'sched-1',
      day_number: 5,
      status: 'in_progress',
      total_estimated_minutes: 360,
      total_actual_minutes: 120,
    };
    const tasks = [
      {
        id: 't1',
        task_type: 'reading',
        subject: 'History',
        topic: 'Modern India',
        subtopic: 'Revolt of 1857',
        estimated_minutes: 60,
        actual_minutes: 55,
        status: 'completed',
        completed_at: '2025-01-01T10:00:00Z',
        content_links: ['https://example.com'],
        order_index: 0,
      },
      {
        id: 't2',
        task_type: 'practice',
        subject: 'Polity',
        topic: 'Constitution',
        subtopic: null,
        estimated_minutes: 45,
        actual_minutes: null,
        status: 'pending',
        completed_at: null,
        content_links: [],
        order_index: 1,
      },
    ];

    mockFromFn
      .mockReturnValueOnce(chainable({ data: { id: 'plan-1' } }))
      .mockReturnValueOnce(chainable({ data: schedule }))
      .mockReturnValueOnce(chainable({ data: tasks }));

    const req = makeRequest('/api/planner/daily-tasks?date=2025-01-01', {
      'x-user-id': 'user-1',
    });
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.totalTasks).toBe(2);
    expect(json.data.completedTasks).toBe(1);
    expect(json.data.progressPercentage).toBe(50);
    expect(json.data.tasks[0].subject).toBe('History');
    expect(json.data.scheduleId).toBe('sched-1');
  });
});
