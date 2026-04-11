/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/mcq/practice/submit/route';

const mockGetUser = jest.fn();
const mockAttemptSingle = jest.fn();
const mockQuestionIn = jest.fn();
const mockInsert = jest.fn();
const mockUpdateEq = jest.fn();
const mockRpc = jest.fn();
const mockUpsert = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: jest.fn((table: string) => {
      if (table === 'mcq_attempts') return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({ eq: jest.fn(() => ({ single: mockAttemptSingle })) })),
        })),
        update: jest.fn(() => ({ eq: mockUpdateEq })),
      };
      if (table === 'mcq_questions') return {
        select: jest.fn(() => ({ in: mockQuestionIn })),
      };
      if (table === 'mcq_answers') return { insert: mockInsert };
      if (table === 'mcq_analytics') return { upsert: mockUpsert };
      return {};
    }),
    rpc: mockRpc,
  })),
}));

const mockGenerateExplanation = jest.fn();
jest.mock('@/lib/mcq/explanation-generator', () => ({
  explanationGenerator: { generateExplanation: (...args: any[]) => mockGenerateExplanation(...args) },
}));

function makeRequest(body: any) {
  return new NextRequest('http://localhost/api/mcq/practice/submit', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockInsert.mockResolvedValue({ error: null });
  mockUpdateEq.mockResolvedValue({ error: null });
  mockRpc.mockResolvedValue({ error: null });
  mockUpsert.mockResolvedValue({ error: null });
});

const validBody = {
  sessionId: '550e8400-e29b-41d4-a716-446655440000',
  answers: [
    { questionId: '550e8400-e29b-41d4-a716-446655440001', selectedOption: 2, timeSpent: 45 },
  ],
};

describe('POST /api/mcq/practice/submit', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid body', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    const res = await POST(makeRequest({ sessionId: 'not-uuid', answers: [] }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when session not found', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    mockAttemptSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(404);
  });

  it('returns score on successful submission', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    mockAttemptSingle.mockResolvedValue({
      data: { id: validBody.sessionId, user_id: 'u1', total_questions: 1, started_at: new Date(Date.now() - 60000).toISOString(), subject: 'GS1', topic: 'History', difficulty: 'Medium' },
      error: null,
    });
    mockQuestionIn.mockResolvedValue({
      data: [{ id: validBody.answers[0].questionId, correct_option: 2, options: [], explanation: 'Correct!', subject: 'GS1', topic: 'History', difficulty: 'Medium', marks: 2, negative_marks: 0.66 }],
    });
    mockGenerateExplanation.mockResolvedValue({ text: 'Explanation here' });

    const res = await POST(makeRequest(validBody));
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.score.correctAnswers).toBe(1);
    expect(data.data.score.accuracy).toBe(100);
    expect(data.data.xpEarned).toBeGreaterThan(0);
  });
});
