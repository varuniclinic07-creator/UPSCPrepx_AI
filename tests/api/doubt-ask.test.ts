/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/doubt/ask/route';

const mockGetUser = jest.fn();
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

jest.mock('@/lib/security/rate-limiter', () => ({
  checkRateLimit: jest.fn(() => Promise.resolve({ success: true })),
  RATE_LIMITS: { aiChat: {} },
}));

const mockCheckAccess = jest.fn();
jest.mock('@/lib/auth/check-access', () => ({
  checkAccess: (...args: any[]) => mockCheckAccess(...args),
}));

const mockCreateDoubt = jest.fn();
const mockSaveAnswer = jest.fn();
const mockGetUserUsage = jest.fn();
jest.mock('@/lib/doubt/doubt-service', () => ({
  doubtService: {
    createDoubt: (...args: any[]) => mockCreateDoubt(...args),
    saveAnswer: (...args: any[]) => mockSaveAnswer(...args),
    getUserUsage: (...args: any[]) => mockGetUserUsage(...args),
  },
  createDoubtSchema: {},
}));

const mockGenerateAnswer = jest.fn();
jest.mock('@/lib/doubt/answer-generator', () => ({
  answerGenerator: { generateAnswer: (...args: any[]) => mockGenerateAnswer(...args) },
}));

jest.mock('@/lib/doubt/image-processor', () => ({
  imageProcessor: { performOCR: jest.fn() },
}));

jest.mock('@/lib/doubt/voice-processor', () => ({
  voiceProcessor: {},
}));

function makeRequest(body: any) {
  return new NextRequest('http://localhost/api/doubt/ask', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => jest.clearAllMocks());

const validBody = {
  title: { en: 'What is Article 370?' },
  subject: 'GS2',
  question: 'Explain the significance of Article 370 in Indian polity.',
};

describe('POST /api/doubt/ask', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(401);
  });

  it('returns 429 when rate limited', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    const { checkRateLimit } = require('@/lib/security/rate-limiter');
    checkRateLimit.mockResolvedValueOnce({ success: false, retryAfter: 30 });

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(429);
  });

  it('returns 403 when access denied', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    mockCheckAccess.mockResolvedValue({ allowed: false, reason: 'Daily limit reached', remaining: 0 });

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(403);
  });

  it('returns 400 on invalid request body', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    mockCheckAccess.mockResolvedValue({ allowed: true, remaining: 5 });

    const res = await POST(makeRequest({ title: { en: 'Hi' }, subject: 'GS2', question: 'short' }));
    expect(res.status).toBe(400);
  });

  it('returns success with answer on valid doubt', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    mockCheckAccess.mockResolvedValue({ allowed: true, remaining: 5 });
    mockCreateDoubt.mockResolvedValue({ threadId: 't1', questionId: 'q1' });
    mockGenerateAnswer.mockResolvedValue({
      text: 'Article 370 was...', textHi: null, sources: [], followUpQuestions: [],
      keyPoints: [], wordCount: 50, aiProvider: 'groq', responseTimeMs: 500,
    });
    mockSaveAnswer.mockResolvedValue({ answerId: 'a1' });
    mockGetUserUsage.mockResolvedValue({ limit_remaining: 4, total_doubts: 1 });

    const res = await POST(makeRequest(validBody));
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.threadId).toBe('t1');
    expect(data.data.answer.text).toContain('Article 370');
  });
});
