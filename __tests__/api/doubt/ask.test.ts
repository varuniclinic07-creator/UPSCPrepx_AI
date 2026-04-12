/** @jest-environment node */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/doubt/ask/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetUser = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: {
      getUser: () => mockGetUser(),
    },
  }),
}));

jest.mock('@/lib/auth/check-access', () => ({
  checkAccess: jest.fn().mockResolvedValue({ allowed: true, remaining: 3 }),
}));

jest.mock('@/lib/security/rate-limiter', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ success: true }),
  RATE_LIMITS: { aiChat: { windowMs: 60000, max: 10 } },
}));

const mockCreateDoubt = jest.fn();
const mockSaveAnswer = jest.fn();
const mockGetUserUsage = jest.fn();

jest.mock('@/lib/doubt/doubt-service', () => ({
  doubtService: {
    createDoubt: (...args: unknown[]) => mockCreateDoubt(...args),
    saveAnswer: (...args: unknown[]) => mockSaveAnswer(...args),
    getUserUsage: (...args: unknown[]) => mockGetUserUsage(...args),
  },
  createDoubtSchema: {},
}));

jest.mock('@/lib/doubt/answer-generator', () => ({
  answerGenerator: {
    generateAnswer: jest.fn().mockResolvedValue({
      text: 'AI answer',
      textHi: 'AI answer hi',
      aiProvider: 'groq',
      responseTimeMs: 500,
      sources: [],
      followUpQuestions: [],
      keyPoints: [],
      wordCount: 10,
    }),
  },
}));

jest.mock('@/lib/doubt/image-processor', () => ({
  imageProcessor: { performOCR: jest.fn().mockResolvedValue({ success: true, text: 'ocr' }) },
}));

jest.mock('@/lib/doubt/voice-processor', () => ({
  voiceProcessor: {},
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function postReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/doubt/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validBody = {
  title: { en: 'What is Article 370?' },
  subject: 'GS2',
  question: 'Explain the significance of Article 370 in Indian polity.',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/doubt/ask', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    mockCreateDoubt.mockResolvedValue({ threadId: 't1', questionId: 'q1', error: null });
    mockSaveAnswer.mockResolvedValue({ answerId: 'a1', error: null });
    mockGetUserUsage.mockResolvedValue({ limit_remaining: 2, total_doubts: 1 });
  });

  it('returns 401 when user is unauthenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'no auth' } });

    const res = await POST(postReq(validBody));
    expect(res.status).toBe(401);
  });

  it('returns 429 when rate-limited', async () => {
    const { checkRateLimit } = require('@/lib/security/rate-limiter');
    checkRateLimit.mockResolvedValueOnce({ success: false, retryAfter: 30 });

    const res = await POST(postReq(validBody));
    expect(res.status).toBe(429);
  });

  it('returns 403 when access is denied', async () => {
    const { checkAccess } = require('@/lib/auth/check-access');
    checkAccess.mockResolvedValueOnce({ allowed: false, reason: 'limit', remaining: 0 });

    const res = await POST(postReq(validBody));
    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid body', async () => {
    const res = await POST(postReq({ title: { en: '' }, subject: 'INVALID', question: '' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it('creates doubt and returns answer on success', async () => {
    const res = await POST(postReq(validBody));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.threadId).toBe('t1');
    expect(json.data.answer.text).toBe('AI answer');
    expect(mockCreateDoubt).toHaveBeenCalled();
  });

  it('returns 500 when doubt creation fails', async () => {
    mockCreateDoubt.mockResolvedValueOnce({ error: 'db error', threadId: null, questionId: null });

    const res = await POST(postReq(validBody));
    expect(res.status).toBe(500);
  });

  it('returns 500 on unexpected error', async () => {
    mockGetUser.mockRejectedValueOnce(new Error('crash'));

    const res = await POST(postReq(validBody));
    expect(res.status).toBe(500);
  });
});
