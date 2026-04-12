/** @jest-environment node */

import { POST } from '@/app/api/quiz/generate/route';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockRequireUser = jest.fn();
const mockCanAccessFeature = jest.fn();
jest.mock('@/lib/auth/auth-config', () => ({
  requireUser: (...args: unknown[]) => mockRequireUser(...args),
  canAccessFeature: (...args: unknown[]) => mockCanAccessFeature(...args),
}));

const mockCheckRateLimit = jest.fn();
const mockGetRateLimitHeaders = jest.fn();
jest.mock('@/lib/ai/rate-limiter', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  getRateLimitHeaders: (...args: unknown[]) => mockGetRateLimitHeaders(...args),
}));

const mockGenerateQuiz = jest.fn();
jest.mock('@/lib/services/quiz-service', () => ({
  generateQuiz: (...args: unknown[]) => mockGenerateQuiz(...args),
}));

jest.mock('@/types', () => ({
  SUBJECTS: [
    'History', 'Geography', 'Polity', 'Economy', 'Science & Technology',
    'Environment', 'Ethics', 'Current Affairs', 'Art & Culture', 'International Relations',
  ],
}));

jest.mock('@/lib/security/error-sanitizer', () => ({
  errors: {
    unauthorized: () =>
      new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 }),
    forbidden: () =>
      new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
    validation: (details: Array<{ field: string; message: string }>) =>
      new Response(JSON.stringify({ error: 'Validation error', details }), { status: 400 }),
    internal: () =>
      new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 }),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/quiz/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const fakeUser = { id: 'user-1', email: 'test@example.com', subscriptionTier: 'trial' };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/quiz/generate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanAccessFeature.mockReturnValue(true);
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 9 });
    mockGetRateLimitHeaders.mockReturnValue({ 'X-RateLimit-Remaining': '9' });
  });

  it('returns 401 when user is not authenticated', async () => {
    mockRequireUser.mockRejectedValue(new Error('Authentication required'));

    const res = await POST(makeRequest({ topic: 'Polity', subject: 'Polity' }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Authentication required');
  });

  it('returns 403 when user cannot access the feature', async () => {
    mockRequireUser.mockResolvedValue(fakeUser);
    mockCanAccessFeature.mockReturnValue(false);

    const res = await POST(makeRequest({ topic: 'Polity', subject: 'Polity' }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe('Forbidden');
  });

  it('returns 429 when rate limited', async () => {
    mockRequireUser.mockResolvedValue(fakeUser);
    mockCheckRateLimit.mockResolvedValue({ allowed: false, retryAfter: 60 });
    mockGetRateLimitHeaders.mockReturnValue({ 'Retry-After': '60' });

    const res = await POST(makeRequest({ topic: 'Polity', subject: 'Polity' }));
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.retryAfter).toBe(60);
  });

  it('returns 400 when topic is missing', async () => {
    mockRequireUser.mockResolvedValue(fakeUser);

    const res = await POST(makeRequest({ subject: 'GS2' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'topic' })]),
    );
  });

  it('returns 400 when topic is too short', async () => {
    mockRequireUser.mockResolvedValue(fakeUser);

    const res = await POST(makeRequest({ topic: 'ab', subject: 'GS2' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'topic' })]),
    );
  });

  it('returns 400 when subject is invalid', async () => {
    mockRequireUser.mockResolvedValue(fakeUser);

    const res = await POST(makeRequest({ topic: 'Indian Polity', subject: 'INVALID_SUBJECT' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'subject' })]),
    );
  });

  it('generates quiz successfully with valid inputs', async () => {
    mockRequireUser.mockResolvedValue(fakeUser);
    const fakeQuiz = { id: 'quiz-1', title: 'Indian Polity Quiz', questions: [] };
    mockGenerateQuiz.mockResolvedValue(fakeQuiz);

    const res = await POST(
      makeRequest({ topic: 'Indian Polity', subject: 'Polity', questionCount: 10 }),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.quiz).toEqual(fakeQuiz);
    expect(mockGenerateQuiz).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: 'Indian Polity',
        subject: 'Polity',
        userId: 'user-1',
        questionCount: 10,
        difficulty: 'mixed',
      }),
    );
  });

  it('defaults questionCount to 10 and difficulty to mixed', async () => {
    mockRequireUser.mockResolvedValue(fakeUser);
    mockGenerateQuiz.mockResolvedValue({ id: 'quiz-2' });

    await POST(makeRequest({ topic: 'Geography basics', subject: 'Geography' }));

    expect(mockGenerateQuiz).toHaveBeenCalledWith(
      expect.objectContaining({ questionCount: 10, difficulty: 'mixed' }),
    );
  });
});
