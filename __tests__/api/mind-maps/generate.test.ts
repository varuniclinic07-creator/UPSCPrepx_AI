/** @jest-environment node */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/mind-maps/generate/route';

// --- Mocks ---

const mockRequireSession = jest.fn();

jest.mock('@/lib/auth/auth-config', () => ({
  requireSession: (...args: any[]) => mockRequireSession(...args),
  requireUser: jest.fn(),
  getCurrentUser: jest.fn(),
}));

const mockCheckRateLimit = jest.fn();

jest.mock('@/lib/security/rate-limiter', () => ({
  checkRateLimit: (...args: any[]) => mockCheckRateLimit(...args),
  RATE_LIMITS: { aiGenerate: { windowMs: 60000, max: 5 } },
}));

const mockCheckAccess = jest.fn();

jest.mock('@/lib/auth/check-access', () => ({
  checkAccess: (...args: any[]) => mockCheckAccess(...args),
}));

const mockInsertResult = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    from: () => ({
      insert: (data: any) => ({
        select: () => ({
          single: () => mockInsertResult(data),
        }),
      }),
    }),
  }),
  createServerSupabaseClient: jest.fn(),
}));

// --- Helpers ---

function makePostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(new URL('/api/mind-maps/generate', 'http://localhost:3000'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// --- Tests ---

describe('POST /api/mind-maps/generate', () => {
  const fakeSession = { user: { id: 'user-mm-1' } };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireSession.mockResolvedValue(fakeSession);
    mockCheckRateLimit.mockResolvedValue({ success: true });
    mockCheckAccess.mockResolvedValue({ allowed: true });
    mockInsertResult.mockResolvedValue({
      data: {
        id: 'mm-new-1',
        topic: 'Indian Constitution',
        subject: 'GS2',
        content: { type: 'mind_map', nodes: [] },
        created_at: '2026-01-01T00:00:00Z',
      },
      error: null,
    });
  });

  it('generates a mind map successfully', async () => {
    const res = await POST(makePostRequest({
      topic: 'Indian Constitution',
      subject: 'GS2',
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('mm-new-1');
    expect(body.topic).toBe('Indian Constitution');
    expect(body.subject).toBe('GS2');
  });

  it('returns 400 when topic is missing', async () => {
    const res = await POST(makePostRequest({
      subject: 'GS2',
    }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Topic is required');
  });

  it('returns 400 when topic is empty string', async () => {
    const res = await POST(makePostRequest({
      topic: '   ',
      subject: 'GS2',
    }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Topic is required');
  });

  it('returns 401 when user is not authenticated', async () => {
    mockRequireSession.mockRejectedValue(new Error('Unauthorized'));

    const res = await POST(makePostRequest({
      topic: 'Indian Constitution',
      subject: 'GS2',
    }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 429 when rate limit is exceeded', async () => {
    mockCheckRateLimit.mockResolvedValue({ success: false, retryAfter: 45 });

    const res = await POST(makePostRequest({
      topic: 'Indian Constitution',
      subject: 'GS2',
    }));
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toBe('Rate limit exceeded');
  });

  it('returns 403 when access check fails', async () => {
    mockCheckAccess.mockResolvedValue({ allowed: false, reason: 'Daily limit reached', remaining: 0 });

    const res = await POST(makePostRequest({
      topic: 'Indian Constitution',
      subject: 'GS2',
    }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe('Daily limit reached');
  });
});
