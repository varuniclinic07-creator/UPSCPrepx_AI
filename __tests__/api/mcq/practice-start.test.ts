/** @jest-environment node */

import { POST } from '@/app/api/mcq/practice/start/route';
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

const mockGetPracticeQuestions = jest.fn();
jest.mock('@/lib/mcq/question-bank', () => ({
  questionBank: {
    getPracticeQuestions: (...args: unknown[]) => mockGetPracticeQuestions(...args),
  },
}));

const mockIdentifyAreas = jest.fn();
jest.mock('@/lib/mcq/adaptive-engine', () => ({
  adaptiveEngine: {
    identifyAreas: (...args: unknown[]) => mockIdentifyAreas(...args),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/mcq/practice/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
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

describe('POST /api/mcq/practice/start', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') });

    const res = await POST(makeRequest({ subject: 'GS1' }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Authentication required');
  });

  it('returns 400 for invalid subject', async () => {
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });

    const res = await POST(makeRequest({ subject: 'INVALID' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid request');
  });

  it('starts a practice session with subject and difficulty', async () => {
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });

    // user_profiles query
    const profileChain = mockSupabaseChain({
      data: { subscription_tier: 'premium', daily_practice_limit: 100 },
    });
    // mcq_attempts count query
    const attemptsCountChain = mockSupabaseChain({ count: 5 });
    // mcq_attempts insert query
    const insertChain = mockSupabaseChain({
      data: { id: 'attempt-1' },
      error: null,
    });

    let fromCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'user_profiles') return profileChain;
      if (table === 'mcq_attempts') {
        fromCallCount++;
        // First call is the count check, second is the insert
        return fromCallCount === 1 ? attemptsCountChain : insertChain;
      }
      return mockSupabaseChain({ data: null });
    });

    const fakeQuestions = [
      {
        id: 'q1',
        questionText: 'Sample question',
        options: ['A', 'B', 'C', 'D'],
        subject: 'GS1',
        topic: 'History',
        difficulty: 'Medium',
        timeEstimateSec: 90,
        marks: 2,
        negativeMarks: 0.66,
        isPyy: false,
        year: null,
        explanation: 'Detailed explanation',
      },
    ];
    mockGetPracticeQuestions.mockResolvedValue(fakeQuestions);

    const res = await POST(
      makeRequest({ subject: 'GS1', difficulty: 'Medium', questionCount: 10 }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.sessionId).toBe('attempt-1');
    expect(body.data.questions).toHaveLength(1);
    // Ensure explanation is stripped from response
    expect(body.data.questions[0]).not.toHaveProperty('explanation');
    expect(body.data.settings.subject).toBe('GS1');
    expect(body.data.settings.difficulty).toBe('Medium');
  });

  it('returns 404 when no questions are available', async () => {
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });
    mockIdentifyAreas.mockResolvedValue({ initialDifficulty: 'Medium' });

    const profileChain = mockSupabaseChain({
      data: { subscription_tier: 'basic', daily_practice_limit: 20 },
    });
    const attemptsCountChain = mockSupabaseChain({ count: 0 });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'user_profiles') return profileChain;
      if (table === 'mcq_attempts') return attemptsCountChain;
      return mockSupabaseChain({ data: null });
    });

    mockGetPracticeQuestions.mockResolvedValue([]);

    const res = await POST(makeRequest({ subject: 'GS1' }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('No questions available for selected filters');
  });

  it('uses adaptive difficulty when not specified', async () => {
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });
    mockIdentifyAreas.mockResolvedValue({ initialDifficulty: 'Hard' });

    const profileChain = mockSupabaseChain({
      data: { subscription_tier: 'premium', daily_practice_limit: 100 },
    });
    const attemptsCountChain = mockSupabaseChain({ count: 0 });
    const insertChain = mockSupabaseChain({ data: { id: 'attempt-2' }, error: null });

    let fromCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'user_profiles') return profileChain;
      if (table === 'mcq_attempts') {
        fromCallCount++;
        return fromCallCount === 1 ? attemptsCountChain : insertChain;
      }
      return mockSupabaseChain({ data: null });
    });

    mockGetPracticeQuestions.mockResolvedValue([
      {
        id: 'q1', questionText: 'Q', options: [], subject: 'GS2',
        topic: 'T', difficulty: 'Hard', timeEstimateSec: 90,
        marks: 2, negativeMarks: 0.66, isPyy: false, year: null,
      },
    ]);

    const res = await POST(makeRequest({ subject: 'GS2' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockIdentifyAreas).toHaveBeenCalledWith('user-1');
    expect(body.data.settings.difficulty).toBe('Hard');
  });
});
