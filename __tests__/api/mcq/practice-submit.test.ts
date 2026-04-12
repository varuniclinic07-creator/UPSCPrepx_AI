/** @jest-environment node */

import { POST } from '@/app/api/mcq/practice/submit/route';
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

const mockGenerateExplanation = jest.fn();
jest.mock('@/lib/mcq/explanation-generator', () => ({
  explanationGenerator: {
    generateExplanation: (...args: unknown[]) => mockGenerateExplanation(...args),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/mcq/practice/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const fakeUser = { id: 'user-1', email: 'test@example.com' };
const SESSION_ID = '11111111-1111-4111-a111-111111111111';
const QUESTION_ID = '22222222-2222-4222-a222-222222222222';

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

describe('POST /api/mcq/practice/submit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') });

    const res = await POST(
      makeRequest({
        sessionId: SESSION_ID,
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

    const res = await POST(makeRequest({ sessionId: 'not-a-uuid', answers: [] }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid request');
  });

  it('returns 404 when session is not found', async () => {
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });

    const attemptChain = mockSupabaseChain({ data: null, error: { message: 'Not found' } });
    mockFrom.mockReturnValue(attemptChain);

    const res = await POST(
      makeRequest({
        sessionId: SESSION_ID,
        answers: [{ questionId: QUESTION_ID, selectedOption: 2, timeSpent: 45 }],
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Session not found');
  });

  it('submits answers and returns score with explanations', async () => {
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });

    const attemptData = {
      id: SESSION_ID,
      user_id: 'user-1',
      total_questions: 2,
      started_at: new Date(Date.now() - 120000).toISOString(),
    };

    const questionsData = [
      {
        id: QUESTION_ID,
        correct_option: 2,
        options: [{ text: { en: 'A' } }],
        explanation: 'Because...',
        subject: 'GS1',
        topic: 'History',
        difficulty: 'Medium',
        marks: 2,
        negative_marks: 0.66,
      },
    ];

    // First from('mcq_attempts') => attempt lookup
    // Second from('mcq_questions') => questions lookup
    // Third from('mcq_answers') => insert
    // Fourth from('mcq_attempts') => update
    // Fifth from('mcq_analytics') => upsert
    let callIndex = 0;
    mockFrom.mockImplementation((table: string) => {
      callIndex++;
      if (table === 'mcq_attempts' && callIndex === 1) {
        return mockSupabaseChain({ data: attemptData, error: null });
      }
      if (table === 'mcq_questions') {
        return mockSupabaseChain({ data: questionsData });
      }
      // All other calls: answers insert, attempts update, analytics upsert
      return mockSupabaseChain({ data: null, error: null });
    });

    mockGenerateExplanation.mockResolvedValue('Option 2 is correct because...');

    const res = await POST(
      makeRequest({
        sessionId: SESSION_ID,
        answers: [{ questionId: QUESTION_ID, selectedOption: 2, timeSpent: 45 }],
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.score).toBeDefined();
    expect(body.data.score.correctAnswers).toBe(1);
    expect(body.data.score.incorrectAnswers).toBe(0);
    expect(body.data.score.totalMarks).toBe(2);
    expect(body.data.score.accuracy).toBe(100);
    expect(body.data.xpEarned).toBeGreaterThan(0);
    expect(body.data.explanations).toHaveLength(1);
    expect(body.data.explanations[0].questionId).toBe(QUESTION_ID);
    // XP was awarded
    expect(mockRpc).toHaveBeenCalledWith('award_xp', expect.objectContaining({
      p_user_id: 'user-1',
    }));
  });

  it('applies negative marks for incorrect answers', async () => {
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });

    const attemptData = {
      id: SESSION_ID,
      user_id: 'user-1',
      total_questions: 1,
      started_at: new Date(Date.now() - 60000).toISOString(),
    };

    const questionsData = [
      {
        id: QUESTION_ID,
        correct_option: 3,
        options: [{ text: { en: 'A' } }],
        explanation: 'Because...',
        subject: 'GS1',
        topic: 'History',
        difficulty: 'Easy',
        marks: 2,
        negative_marks: 0.66,
      },
    ];

    let callIndex = 0;
    mockFrom.mockImplementation((table: string) => {
      callIndex++;
      if (table === 'mcq_attempts' && callIndex === 1) {
        return mockSupabaseChain({ data: attemptData, error: null });
      }
      if (table === 'mcq_questions') {
        return mockSupabaseChain({ data: questionsData });
      }
      return mockSupabaseChain({ data: null, error: null });
    });

    mockGenerateExplanation.mockResolvedValue('Correct answer is 3.');

    const res = await POST(
      makeRequest({
        sessionId: SESSION_ID,
        answers: [{ questionId: QUESTION_ID, selectedOption: 1, timeSpent: 30 }],
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.score.incorrectAnswers).toBe(1);
    expect(body.data.score.correctAnswers).toBe(0);
    expect(body.data.score.negativeMarks).toBe(0.66);
    expect(body.data.score.netMarks).toBeLessThan(0);
  });
});
