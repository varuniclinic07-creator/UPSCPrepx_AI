/** @jest-environment node */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/lectures/generate/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockRpc = jest.fn();
const mockInsert = jest.fn().mockResolvedValue({ error: null });

jest.mock('@/lib/auth/session', () => ({
  requireSession: jest.fn().mockResolvedValue({ user: { id: 'u1' } }),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: jest.fn(() => ({
      insert: (...args: unknown[]) => mockInsert(...args),
    })),
  }),
}));

jest.mock('@/lib/security/rate-limiter', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ success: true }),
  RATE_LIMITS: { lectureGen: { windowMs: 60000, max: 5 } },
}));

jest.mock('@/lib/queues/lecture-queue', () => ({
  addLectureJob: jest.fn().mockResolvedValue({ jobId: 'j1', queuePosition: 2 }),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function postReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/lectures/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/lectures/generate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
    mockRpc.mockImplementation((name: string) => {
      if (name === 'can_generate_lecture') {
        return Promise.resolve({ data: [{ can_generate: true, monthly_remaining: 5, daily_remaining: 3 }] });
      }
      // increment_lecture_usage and others
      return Promise.resolve({ data: null, error: null });
    });
  });

  it('returns 401 when user is unauthenticated', async () => {
    const { requireSession } = require('@/lib/auth/session');
    requireSession.mockRejectedValueOnce(new Error('Unauthorized'));

    const res = await POST(postReq({ topic: 'Polity', subject: 'GS2' }));
    expect(res.status).toBe(401);
  });

  it('returns 429 when rate-limited', async () => {
    const { checkRateLimit } = require('@/lib/security/rate-limiter');
    checkRateLimit.mockResolvedValueOnce({ success: false, retryAfter: 60 });

    const res = await POST(postReq({ topic: 'Polity', subject: 'GS2' }));
    expect(res.status).toBe(429);
  });

  it('returns 400 when topic or subject is missing', async () => {
    const res = await POST(postReq({ topic: 'Polity' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/required/i);
  });

  it('returns 429 when lecture generation limit is reached', async () => {
    mockRpc.mockImplementation((name: string) => {
      if (name === 'can_generate_lecture') {
        return Promise.resolve({ data: [{ can_generate: false, reason: 'monthly limit', monthly_remaining: 0 }] });
      }
      return Promise.resolve({ data: null });
    });

    const res = await POST(postReq({ topic: 'Polity', subject: 'GS2' }));
    expect(res.status).toBe(429);
  });

  it('creates lecture job and returns queue info on success', async () => {
    const res = await POST(postReq({ topic: 'Polity', subject: 'GS2' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.lectureId).toBe('mock-uuid');
    expect(json.queuePosition).toBe(2);
    expect(json.status).toBe('queued');
  });

  it('returns 500 when job insert fails', async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: 'insert fail' } });

    const res = await POST(postReq({ topic: 'Polity', subject: 'GS2' }));
    expect(res.status).toBe(500);
  });
});
