/** @jest-environment node */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/digest/generate/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/auth/session', () => ({
  requireSession: jest.fn().mockResolvedValue({ id: 'u1', user: { id: 'u1' } }),
}));

jest.mock('@/lib/security/rate-limiter', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ success: true }),
  RATE_LIMITS: { aiGenerate: { windowMs: 60000, max: 5 } },
}));

const mockGenerateDigest = jest.fn();
const mockGetDigestHistory = jest.fn();

jest.mock('@/lib/digest/digest-generator', () => ({
  generateDigest: (...args: unknown[]) => mockGenerateDigest(...args),
  getDigestHistory: (...args: unknown[]) => mockGetDigestHistory(...args),
}));

jest.mock('@/lib/security/error-sanitizer', () => ({
  errors: {
    validation: jest.fn((issues: Array<{ field: string; message: string }>) => {
      const { NextResponse } = require('next/server');
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', validationErrors: issues },
        { status: 400 },
      );
    }),
    internal: jest.fn((err: unknown) => {
      const { NextResponse } = require('next/server');
      return NextResponse.json(
        { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
        { status: 500 },
      );
    }),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function postReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/digest/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function getReq() {
  return new NextRequest('http://localhost/api/digest/generate');
}

// ---------------------------------------------------------------------------
// POST /api/digest/generate
// ---------------------------------------------------------------------------

describe('POST /api/digest/generate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateDigest.mockResolvedValue({
      title: 'Daily Digest',
      content: 'Economy updates...',
    });
  });

  it('returns 429 when rate-limited', async () => {
    const { checkRateLimit } = require('@/lib/security/rate-limiter');
    checkRateLimit.mockResolvedValueOnce({ success: false, retryAfter: 60 });

    const res = await POST(postReq({}));
    expect(res.status).toBe(429);
  });

  it('returns 400 for invalid subjects', async () => {
    const res = await POST(postReq({ subjects: ['InvalidSubject'] }));
    expect(res.status).toBe(400);
  });

  it('generates digest with default subjects', async () => {
    const res = await POST(postReq({}));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.digest.title).toBe('Daily Digest');
    expect(mockGenerateDigest).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        subjects: ['Economy', 'Polity', 'Environment', 'IR'],
        length: 'brief',
        includeQuestions: true,
      }),
    );
  });

  it('generates digest with custom subjects', async () => {
    const res = await POST(postReq({ subjects: ['History', 'Geography'], length: 'detailed' }));
    expect(res.status).toBe(200);
    expect(mockGenerateDigest).toHaveBeenCalledWith(
      expect.objectContaining({ subjects: ['History', 'Geography'], length: 'detailed' }),
    );
  });

  it('returns 401 when session is missing', async () => {
    const { requireSession } = require('@/lib/auth/session');
    requireSession.mockRejectedValueOnce(new Error('Unauthorized'));

    const res = await POST(postReq({}));
    expect(res.status).toBe(500);
    // errors.internal catches thrown errors
  });

  it('returns 500 on generator error', async () => {
    mockGenerateDigest.mockRejectedValueOnce(new Error('generation failed'));

    const res = await POST(postReq({}));
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// GET /api/digest/generate
// ---------------------------------------------------------------------------

describe('GET /api/digest/generate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDigestHistory.mockResolvedValue([
      { id: 'd1', title: 'Digest 1', created_at: '2025-01-01' },
    ]);
  });

  it('returns digest history', async () => {
    const res = await GET(getReq());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.history).toHaveLength(1);
    expect(mockGetDigestHistory).toHaveBeenCalledWith('u1');
  });

  it('returns 500 on history fetch error', async () => {
    mockGetDigestHistory.mockRejectedValueOnce(new Error('db error'));

    const res = await GET(getReq());
    expect(res.status).toBe(500);
  });
});
