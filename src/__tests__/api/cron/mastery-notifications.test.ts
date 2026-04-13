/**
 * Tests for /api/cron/mastery-notifications route
 *
 * Validates authentication, user processing, streak milestones,
 * SRS due reminders, and Sunday weekly digest generation.
 */
import { NextRequest } from 'next/server';

// --- Mocks ---

const mockFrom = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
  })),
}));

const mockGetMasteryStats = jest.fn();
jest.mock('@/lib/mastery/mastery-service', () => ({
  getMasteryStats: (...args: any[]) => mockGetMasteryStats(...args),
}));

const mockCheckStreakMilestones = jest.fn();
const mockGenerateDueReminders = jest.fn();
const mockGenerateWeeklyDigest = jest.fn();
jest.mock('@/lib/mastery/mastery-notifications', () => ({
  checkStreakMilestones: (...args: any[]) => mockCheckStreakMilestones(...args),
  generateDueReminders: (...args: any[]) => mockGenerateDueReminders(...args),
  generateWeeklyDigest: (...args: any[]) => mockGenerateWeeklyDigest(...args),
}));

import { POST } from '@/app/api/cron/mastery-notifications/route';

// --- Helpers ---

function makeRequest(token?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (token) headers['authorization'] = token;
  return new NextRequest('http://localhost/api/cron/mastery-notifications', {
    method: 'POST',
    headers,
  });
}

function setupUsersQuery(users: Array<{ id: string }> | null) {
  mockFrom.mockReturnValue({
    select: jest.fn().mockReturnValue({
      gte: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue({ data: users }),
      }),
    }),
  });
}

// --- Tests ---

describe('POST /api/cron/mastery-notifications', () => {
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
    const res = await POST(makeRequest('Bearer wrong-secret'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns processed:0 when no active users found', async () => {
    setupUsersQuery([]);

    const res = await POST(makeRequest('Bearer test-cron-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.processed).toBe(0);
  });

  it('processes users — calls mastery stats, streak milestones, and due reminders', async () => {
    setupUsersQuery([{ id: 'user-1' }, { id: 'user-2' }]);

    mockGetMasteryStats.mockResolvedValue({ current_streak: 7 });
    mockCheckStreakMilestones.mockResolvedValue(undefined);
    mockGenerateDueReminders.mockResolvedValue(undefined);
    mockGenerateWeeklyDigest.mockResolvedValue(undefined);

    const res = await POST(makeRequest('Bearer test-cron-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.processed).toBe(2);
    expect(body.totalUsers).toBe(2);
    expect(mockGetMasteryStats).toHaveBeenCalledTimes(2);
    expect(mockCheckStreakMilestones).toHaveBeenCalledWith('user-1', 7);
    expect(mockCheckStreakMilestones).toHaveBeenCalledWith('user-2', 7);
    expect(mockGenerateDueReminders).toHaveBeenCalledTimes(2);
  });

  it('triggers weekly digest on Sundays', async () => {
    // Mock Date to be a Sunday (2024-01-07 is a Sunday)
    const realDate = global.Date;
    const sundayDate = new Date('2024-01-07T06:00:00Z');
    const mockDate = class extends realDate {
      constructor(...args: any[]) {
        if (args.length === 0) return sundayDate as any;
        // @ts-ignore
        return new realDate(...args);
      }
      static now() { return sundayDate.getTime(); }
    } as any;
    global.Date = mockDate;

    setupUsersQuery([{ id: 'user-sun' }]);
    mockGetMasteryStats.mockResolvedValue({ current_streak: 3 });
    mockCheckStreakMilestones.mockResolvedValue(undefined);
    mockGenerateDueReminders.mockResolvedValue(undefined);
    mockGenerateWeeklyDigest.mockResolvedValue(undefined);

    const res = await POST(makeRequest('Bearer test-cron-secret'));
    const body = await res.json();

    expect(body.isSunday).toBe(true);
    expect(mockGenerateWeeklyDigest).toHaveBeenCalledWith('user-sun');

    global.Date = realDate;
  });
});
