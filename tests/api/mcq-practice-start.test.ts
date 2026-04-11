/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/mcq/practice/start/route';

const mockGetUser = jest.fn();
const mockSelectSingle = jest.fn();
const mockSelect = jest.fn(() => ({
  eq: jest.fn(() => ({ single: mockSelectSingle })),
}));
const mockCountSelect = jest.fn();
const mockInsertSingle = jest.fn();
const mockInsert = jest.fn(() => ({ select: jest.fn(() => ({ single: mockInsertSingle })) }));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: jest.fn((table: string) => {
      if (table === 'user_profiles') return { select: mockSelect };
      if (table === 'mcq_attempts') return {
        select: mockCountSelect,
        insert: mockInsert,
      };
      return {};
    }),
  })),
}));

const mockGetPracticeQuestions = jest.fn();
jest.mock('@/lib/mcq/question-bank', () => ({
  questionBank: { getPracticeQuestions: (...args: any[]) => mockGetPracticeQuestions(...args) },
}));

jest.mock('@/lib/mcq/adaptive-engine', () => ({
  adaptiveEngine: { identifyAreas: jest.fn(() => Promise.resolve({ initialDifficulty: 'Medium' })) },
}));

function makeRequest(body: any) {
  return new NextRequest('http://localhost/api/mcq/practice/start', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => jest.clearAllMocks());

describe('POST /api/mcq/practice/start', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } });
    const res = await POST(makeRequest({ subject: 'GS1' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid request', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    const res = await POST(makeRequest({ subject: 'INVALID' }));
    expect(res.status).toBe(400);
  });

  it('returns 403 when daily limit reached', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    mockSelectSingle.mockResolvedValue({ data: { subscription_tier: 'free', daily_practice_limit: 20 } });
    mockCountSelect.mockReturnValue({
      eq: jest.fn(() => ({ eq: jest.fn(() => ({ gte: jest.fn(() => ({ count: 20 })) })) })),
    });

    const res = await POST(makeRequest({ subject: 'GS1', questionCount: 10 }));
    expect(res.status).toBe(403);
  });

  it('returns 404 when no questions available', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    mockSelectSingle.mockResolvedValue({ data: { subscription_tier: 'premium' } });
    mockCountSelect.mockReturnValue({
      eq: jest.fn(() => ({ eq: jest.fn(() => ({ gte: jest.fn(() => ({ count: 0 })) })) })),
    });
    mockGetPracticeQuestions.mockResolvedValue([]);

    const res = await POST(makeRequest({ subject: 'GS1', questionCount: 10 }));
    expect(res.status).toBe(404);
  });

  it('returns session with questions on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    mockSelectSingle.mockResolvedValue({ data: { subscription_tier: 'premium' } });
    mockCountSelect.mockReturnValue({
      eq: jest.fn(() => ({ eq: jest.fn(() => ({ gte: jest.fn(() => ({ count: 0 })) })) })),
    });
    mockGetPracticeQuestions.mockResolvedValue([
      { id: 'q1', questionText: 'Test?', options: [], subject: 'GS1', topic: 'History', difficulty: 'Medium', timeEstimateSec: 90, marks: 2, negativeMarks: 0.66, isPyy: false, year: null },
    ]);
    mockInsertSingle.mockResolvedValue({ data: { id: 'session-1' }, error: null });

    const res = await POST(makeRequest({ subject: 'GS1', questionCount: 10 }));
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.sessionId).toBe('session-1');
    expect(data.data.questions).toHaveLength(1);
    // Explanations should be stripped
    expect(data.data.questions[0].explanation).toBeUndefined();
  });
});
