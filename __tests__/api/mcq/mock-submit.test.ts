/** @jest-environment node */

import { POST } from '@/app/api/mcq/mock/submit/route';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockRpc = jest.fn().mockResolvedValue({ data: null, error: null });
const mockSupabase = {
  auth: { getUser: () => mockGetUser() },
  from: (...args: unknown[]) => mockFrom(...args),
  rpc: (...args: unknown[]) => mockRpc(...args),
};
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase)),
}));

const mockSubmitMockAttempt = jest.fn();
jest.mock('@/lib/mcq/mock-test', () => ({
  mockTest: {
    submitMockAttempt: (...args: unknown[]) => mockSubmitMockAttempt(...args),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ATTEMPT_ID = '44444444-4444-4444-a444-444444444444';
const QUESTION_ID = '55555555-5555-4555-a555-555555555555';

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/mcq/mock/submit', {
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

describe('POST /api/mcq/mock/submit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') });

    const res = await POST(
      makeRequest({
        attemptId: ATTEMPT_ID,
        answers: [{ questionId: QUESTION_ID, selectedOption: 1, timeSpent: 30 }],
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Authentication required');
  });

  it('returns 400 for invalid request body', async () => {
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });

    const res = await POST(makeRequest({ attemptId: 'bad', answers: 'not-array' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid request');
  });

  it('returns 500 when mock submission fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });
    mockSubmitMockAttempt.mockResolvedValue(null);

    const res = await POST(
      makeRequest({
        attemptId: ATTEMPT_ID,
        answers: [{ questionId: QUESTION_ID, selectedOption: 2, timeSpent: 45 }],
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to submit mock test');
  });

  it('submits mock test and returns score with percentile', async () => {
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });

    mockSubmitMockAttempt.mockResolvedValue({
      netMarks: 120,
      accuracy: 75,
      percentile: 85.5,
      rank: 150,
    });

    // attempt query
    const attemptChain = mockSupabaseChain({
      data: {
        id: ATTEMPT_ID,
        correct_answers: 75,
        incorrect_answers: 15,
        unattempted: 10,
        total_marks: 200,
        time_taken_sec: 6000,
        duration_min: 120,
        avg_time_per_question: 60,
        mock: { title: 'UPSC Mock 1', avg_score: 100 },
      },
    });

    // answer details query
    const answersChain = mockSupabaseChain({
      data: [
        {
          is_correct: true,
          is_skipped: false,
          question: { id: QUESTION_ID, correct_option: 2, subject: 'GS1', topic: 'History', difficulty: 'Medium' },
        },
      ],
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return attemptChain;
      return answersChain;
    });

    const res = await POST(
      makeRequest({
        attemptId: ATTEMPT_ID,
        answers: [{ questionId: QUESTION_ID, selectedOption: 2, timeSpent: 60 }],
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.attemptId).toBe(ATTEMPT_ID);
    expect(body.data.score.netMarks).toBe(120);
    expect(body.data.score.accuracy).toBe(75);
    expect(body.data.score.percentile).toBe(85.5);
    expect(body.data.score.rank).toBe(150);
    expect(body.data.breakdown.correct).toBe(75);
    expect(body.data.breakdown.incorrect).toBe(15);
    expect(body.data.breakdown.unattempted).toBe(10);
    expect(body.data.breakdown.sections).toBeDefined();
    expect(body.data.timeStats.timeTakenSec).toBe(6000);
    expect(body.data.xpEarned).toBeGreaterThan(0);
    expect(body.data.comparison).toBeDefined();
    // Verify XP was awarded
    expect(mockRpc).toHaveBeenCalledWith('award_xp', expect.objectContaining({
      p_user_id: 'user-1',
      p_source: 'mock_test',
    }));
    expect(mockSubmitMockAttempt).toHaveBeenCalledWith(ATTEMPT_ID, {
      answers: [{ questionId: QUESTION_ID, selectedOption: 2, timeSpent: 60 }],
    });
  });
});
