/** @jest-environment node */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/eval/mains/submit/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetSession = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: { getSession: () => mockGetSession() },
    from: (...args: unknown[]) => mockFrom(...args),
  }),
}));

jest.mock('@/lib/auth/check-access', () => ({
  checkAccess: jest.fn().mockResolvedValue({ allowed: true, remaining: 3 }),
}));

jest.mock('@/lib/security/rate-limiter', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ success: true }),
  RATE_LIMITS: { aiGenerate: { windowMs: 60000, max: 5 } },
}));

const mockEvaluateAnswer = jest.fn();

jest.mock('@/lib/eval/mains-evaluator-service', () => ({
  evaluateAnswer: (...args: unknown[]) => mockEvaluateAnswer(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function postReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/eval/mains/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validBody = {
  question_id: '550e8400-e29b-41d4-a716-446655440000',
  answer_text: 'A'.repeat(60),
  word_count: 200,
  time_taken_sec: 600,
};

const fakeSession = {
  user: { id: 'u1' },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/eval/mains/submit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: fakeSession }, error: null });

    // Default: premium user (subscription found)
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { status: 'active', plan_id: 'premium' }, error: null }),
          }),
        }),
      }),
    });

    mockEvaluateAnswer.mockResolvedValue({
      answer_id: 'a1',
      evaluation: {
        structure_score: 8,
        overall_score: 30,
        evaluation_time_sec: 5,
        ai_model_used: 'groq',
      },
    });
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: null }, error: null });

    const res = await POST(postReq(validBody));
    expect(res.status).toBe(401);
  });

  it('returns 429 when rate-limited', async () => {
    const { checkRateLimit } = require('@/lib/security/rate-limiter');
    checkRateLimit.mockResolvedValueOnce({ success: false, retryAfter: 60 });

    const res = await POST(postReq(validBody));
    expect(res.status).toBe(429);
  });

  it('returns 400 for invalid body', async () => {
    const res = await POST(postReq({ question_id: 'not-uuid', answer_text: 'short', word_count: -1, time_taken_sec: 0 }));
    expect(res.status).toBe(400);
  });

  it('returns evaluation on success', async () => {
    const res = await POST(postReq(validBody));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.answer_id).toBe('a1');
    expect(json.evaluation.structure_score).toBe(8);
    expect(mockEvaluateAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ question_id: validBody.question_id, user_id: 'u1' }),
    );
  });

  it('returns 500 on evaluator error', async () => {
    mockEvaluateAnswer.mockRejectedValueOnce(new Error('AI down'));

    const res = await POST(postReq(validBody));
    expect(res.status).toBe(500);
  });
});

describe('GET /api/eval/mains/submit', () => {
  it('returns API documentation', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.endpoint).toBe('/api/eval/mains/submit');
    expect(json.method).toBe('POST');
  });
});
