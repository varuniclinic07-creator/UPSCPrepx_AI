/** @jest-environment node */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/doubt/rate/route';

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

const mockRateAnswer = jest.fn();

jest.mock('@/lib/doubt/doubt-service', () => {
  const { z } = require('zod');
  return {
    doubtService: {
      rateAnswer: (...args: unknown[]) => mockRateAnswer(...args),
    },
    ratingSchema: z.object({
      answer_id: z.string().uuid(),
      rating: z.number().min(1).max(5),
      feedback_text: z.string().max(500).optional(),
      is_helpful: z.boolean().optional(),
      is_flagged: z.boolean().optional(),
      flag_reason: z.string().max(200).optional(),
    }),
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function postReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/doubt/rate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validBody = {
  answer_id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  rating: 4,
  is_helpful: true,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/doubt/rate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    mockRateAnswer.mockResolvedValue({ success: true });
  });

  it('returns 401 when user is unauthenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'no auth' } });

    const res = await POST(postReq(validBody));
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid body (missing rating)', async () => {
    const res = await POST(postReq({ answer_id: validBody.answer_id }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it('returns 400 for invalid answer_id format', async () => {
    const res = await POST(postReq({ answer_id: 'not-a-uuid', rating: 3 }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when answer is not found', async () => {
    mockRateAnswer.mockResolvedValueOnce({ success: false, error: 'Answer not found' });

    const res = await POST(postReq(validBody));
    expect(res.status).toBe(404);
  });

  it('returns 500 when rateAnswer fails with generic error', async () => {
    mockRateAnswer.mockResolvedValueOnce({ success: false, error: 'db error' });

    const res = await POST(postReq(validBody));
    expect(res.status).toBe(500);
  });

  it('returns success on valid rating', async () => {
    const res = await POST(postReq(validBody));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.rating).toBe(4);
    expect(json.data.isHelpful).toBe(true);
  });

  it('returns 500 on unexpected error', async () => {
    mockGetUser.mockRejectedValueOnce(new Error('crash'));

    const res = await POST(postReq(validBody));
    expect(res.status).toBe(500);
  });
});
