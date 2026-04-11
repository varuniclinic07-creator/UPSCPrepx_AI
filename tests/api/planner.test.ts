/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/planner/route';

const mockSession = { user: { id: 'user-123' } };
jest.mock('@/lib/auth/session', () => ({
  requireSession: jest.fn(() => Promise.resolve(mockSession)),
}));

const mockOrder = jest.fn();
const mockLt = jest.fn(() => ({ order: mockOrder }));
const mockGte = jest.fn(() => ({ lt: mockLt }));
const mockEqSessions = jest.fn(() => ({ gte: mockGte }));
const mockEqPlans = jest.fn(() => ({ order: mockOrder }));
const mockSelectPlans = jest.fn(() => ({ eq: mockEqPlans }));
const mockSelectSessions = jest.fn(() => ({ eq: mockEqSessions }));
const mockSingle = jest.fn();
const mockSelectAfterInsert = jest.fn(() => ({ single: mockSingle }));
const mockInsert = jest.fn();

let fromCallCount = 0;
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    from: jest.fn((table: string) => {
      if (table === 'study_plans') return { select: mockSelectPlans, insert: jest.fn(() => ({ select: mockSelectAfterInsert })) };
      if (table === 'study_sessions') return { select: mockSelectSessions, insert: mockInsert };
      return {};
    }),
  })),
}));

beforeEach(() => jest.clearAllMocks());

describe('GET /api/planner', () => {
  it('returns plans, tasks and stats', async () => {
    mockOrder.mockResolvedValueOnce({ data: [{ id: 'plan-1', plan_name: 'UPSC 2025' }], error: null });
    mockOrder.mockResolvedValueOnce({
      data: [
        { id: 's1', subject: 'GS1', topic: 'History', duration_minutes: 60, is_completed: true, scheduled_time: '09:00' },
        { id: 's2', subject: 'GS2', topic: 'Polity', duration_minutes: 60, is_completed: false, scheduled_time: '10:00' },
      ],
      error: null,
    });

    const res = await GET();
    const data = await res.json();
    expect(data.plans).toHaveLength(1);
    expect(data.todayTasks).toHaveLength(2);
    expect(data.stats.weeklyProgress).toBe(50);
  });
});

describe('POST /api/planner', () => {
  it('returns 400 if name missing', async () => {
    const req = new NextRequest('http://localhost/api/planner', {
      method: 'POST',
      body: JSON.stringify({ subjects: ['GS1'] }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 if subjects empty', async () => {
    const req = new NextRequest('http://localhost/api/planner', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Plan', subjects: [] }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('creates plan successfully', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'plan-new', plan_name: 'Test Plan' }, error: null });
    mockInsert.mockResolvedValue({ error: null });

    const req = new NextRequest('http://localhost/api/planner', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Plan', daily_hours: 6, subjects: ['GS1', 'GS2'] }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.id).toBe('plan-new');
  });
});
