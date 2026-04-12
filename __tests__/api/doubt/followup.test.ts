/** @jest-environment node */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/doubt/followup/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetUser = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: {
      getUser: () => mockGetUser(),
    },
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ error: null }),
      })),
    })),
  }),
}));

const mockGetThread = jest.fn();
const mockAddFollowUp = jest.fn();
const mockSaveAnswer = jest.fn();

jest.mock('@/lib/doubt/doubt-service', () => ({
  doubtService: {
    getThread: (...args: unknown[]) => mockGetThread(...args),
    addFollowUp: (...args: unknown[]) => mockAddFollowUp(...args),
    saveAnswer: (...args: unknown[]) => mockSaveAnswer(...args),
  },
}));

jest.mock('@/lib/doubt/answer-generator', () => ({
  answerGenerator: {
    generateAnswer: jest.fn().mockResolvedValue({
      text: 'Follow-up answer',
      textHi: 'Follow-up answer hi',
      aiProvider: 'groq',
      responseTimeMs: 300,
      sources: [],
      followUpQuestions: [],
      keyPoints: [],
      wordCount: 5,
    }),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function postReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/doubt/followup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validBody = {
  thread_id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  question: 'Can you explain more about Article 370?',
};

const fakeThread = {
  thread: { id: validBody.thread_id, subject: 'GS2', topic: 'Polity' },
  questions: [{ question_text: 'Original question', created_at: '2024-01-01' }],
  answers: [{ answer_text: 'Original answer', created_at: '2024-01-01' }],
  error: null,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/doubt/followup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    mockGetThread.mockResolvedValue(fakeThread);
    mockAddFollowUp.mockResolvedValue({ questionId: 'q2', error: null });
    mockSaveAnswer.mockResolvedValue({ answerId: 'a2', error: null });
  });

  it('returns 401 when user is unauthenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'no auth' } });

    const res = await POST(postReq(validBody));
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid body (missing thread_id)', async () => {
    const res = await POST(postReq({ question: 'A valid question here?' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it('returns 400 when question is too short', async () => {
    const res = await POST(postReq({ thread_id: validBody.thread_id, question: 'short' }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when thread is not found', async () => {
    mockGetThread.mockResolvedValueOnce({ thread: null, questions: [], answers: [], error: 'not found' });

    const res = await POST(postReq(validBody));
    expect(res.status).toBe(404);
  });

  it('returns 400 when follow-up limit (10) is reached', async () => {
    const tenQuestions = Array.from({ length: 10 }, (_, i) => ({
      question_text: `Q${i}`,
      created_at: '2024-01-01',
    }));
    mockGetThread.mockResolvedValueOnce({
      ...fakeThread,
      questions: tenQuestions,
    });

    const res = await POST(postReq(validBody));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Maximum 10/);
  });

  it('returns 500 when addFollowUp fails', async () => {
    mockAddFollowUp.mockResolvedValueOnce({ questionId: null, error: 'db error' });

    const res = await POST(postReq(validBody));
    expect(res.status).toBe(500);
  });

  it('returns follow-up answer on success', async () => {
    const res = await POST(postReq(validBody));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.questionId).toBe('q2');
    expect(json.data.answer.text).toBe('Follow-up answer');
    expect(json.data.thread.remainingFollowUps).toBe(8);
    expect(json.data.metadata.isFollowUp).toBe(true);
  });

  it('returns 500 on unexpected error', async () => {
    mockGetUser.mockRejectedValueOnce(new Error('crash'));

    const res = await POST(postReq(validBody));
    expect(res.status).toBe(500);
  });
});
