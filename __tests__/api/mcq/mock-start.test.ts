/** @jest-environment node */

import { POST } from '@/app/api/mcq/mock/start/route';
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

const mockGetMockTestById = jest.fn();
const mockStartMockAttempt = jest.fn();
jest.mock('@/lib/mcq/mock-test', () => ({
  mockTest: {
    getMockTestById: (...args: unknown[]) => mockGetMockTestById(...args),
    startMockAttempt: (...args: unknown[]) => mockStartMockAttempt(...args),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_ID = '33333333-3333-4333-a333-333333333333';

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/mcq/mock/start', {
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

describe('POST /api/mcq/mock/start', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') });

    const res = await POST(makeRequest({ mockId: MOCK_ID }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Authentication required');
  });

  it('returns 400 for invalid mockId', async () => {
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });

    const res = await POST(makeRequest({ mockId: 'not-a-uuid' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid request');
  });

  it('returns 404 when mock test is not found', async () => {
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });
    mockGetMockTestById.mockResolvedValue(null);

    const res = await POST(makeRequest({ mockId: MOCK_ID }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Mock test not found');
  });

  it('returns 403 when premium is required but user is on free tier', async () => {
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });
    mockGetMockTestById.mockResolvedValue({
      id: MOCK_ID,
      title: 'UPSC Prelims Mock 1',
      isPremium: true,
      totalQuestions: 100,
      totalMarks: 200,
      durationMin: 120,
    });

    const profileChain = mockSupabaseChain({
      data: { subscription_tier: 'basic' },
    });
    mockFrom.mockReturnValue(profileChain);

    const res = await POST(makeRequest({ mockId: MOCK_ID }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe('Premium subscription required');
  });

  it('returns 409 when user already has an active attempt', async () => {
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });
    mockGetMockTestById.mockResolvedValue({
      id: MOCK_ID,
      title: 'Free Mock',
      isPremium: false,
      totalQuestions: 100,
      totalMarks: 200,
      durationMin: 120,
    });

    // No premium check needed for free mock; first from call is active attempt check
    const activeAttemptChain = mockSupabaseChain({
      data: { id: 'existing-attempt-1' },
    });
    mockFrom.mockReturnValue(activeAttemptChain);

    const res = await POST(makeRequest({ mockId: MOCK_ID }));
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toBe('You already have an active attempt for this mock');
    expect(body.resume).toBe(true);
  });

  it('starts a mock test successfully', async () => {
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });
    mockGetMockTestById.mockResolvedValue({
      id: MOCK_ID,
      title: 'Free Mock Test',
      description: 'Full-length UPSC prelims mock',
      isPremium: false,
      totalQuestions: 100,
      totalMarks: 200,
      durationMin: 120,
    });
    mockStartMockAttempt.mockResolvedValue({ attemptId: 'attempt-99' });

    // active attempt check returns null
    const noActiveChain = mockSupabaseChain({ data: null });
    // mock questions query
    const questionsChain: Record<string, jest.Mock> = {};
    questionsChain.select = jest.fn().mockReturnValue(questionsChain);
    questionsChain.eq = jest.fn().mockReturnValue(questionsChain);
    questionsChain.order = jest.fn().mockResolvedValue({
      data: [
        {
          question_number: 1,
          section: 'GS',
          question: {
            id: 'q1',
            question_text: 'What is...?',
            options: ['A', 'B', 'C', 'D'],
            subject: 'GS1',
            topic: 'History',
            difficulty: 'Medium',
            marks: 2,
            negative_marks: 0.66,
            time_estimate_sec: 90,
          },
        },
      ],
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return noActiveChain; // active attempt check
      return questionsChain; // mock questions
    });

    const res = await POST(makeRequest({ mockId: MOCK_ID }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.attemptId).toBe('attempt-99');
    expect(body.data.mock.title).toBe('Free Mock Test');
    expect(body.data.mock.durationMin).toBe(120);
    expect(body.data.questions).toHaveLength(1);
    expect(body.data.settings.timed).toBe(true);
    expect(body.data.settings.durationSec).toBe(7200);
    expect(body.data.settings.negativeMarking).toBe(true);
    expect(mockStartMockAttempt).toHaveBeenCalledWith('user-1', MOCK_ID);
  });
});
