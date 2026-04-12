/** @jest-environment node */

import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockRequireSession = jest.fn();
jest.mock('@/lib/auth/session', () => ({
  requireSession: () => mockRequireSession(),
}));

const mockGradeAnswer = jest.fn();
const mockSaveGradingResult = jest.fn();
const mockGetGradingHistory = jest.fn();
jest.mock('@/lib/grading/grader-service', () => ({
  gradeAnswer: (...args: any[]) => mockGradeAnswer(...args),
  saveGradingResult: (...args: any[]) => mockSaveGradingResult(...args),
  getGradingHistory: (...args: any[]) => mockGetGradingHistory(...args),
}));

const mockCheckRateLimit = jest.fn();
jest.mock('@/lib/security/rate-limiter', () => ({
  checkRateLimit: (...args: any[]) => mockCheckRateLimit(...args),
  RATE_LIMITS: { aiGenerate: { maxRequests: 10, windowMs: 60000 } },
}));

jest.mock('@/lib/security/error-sanitizer', () => ({
  errors: {
    validation: (issues: any[]) => {
      const { NextResponse } = require('next/server');
      return NextResponse.json({ error: 'Validation error', issues }, { status: 400 });
    },
    internal: (err: any) => {
      const { NextResponse } = require('next/server');
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    },
  },
}));

// ---------------------------------------------------------------------------
// SUT
// ---------------------------------------------------------------------------

import { GET, POST } from '@/app/api/grade/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(method: string, url: string, body?: any): NextRequest {
  const init: RequestInit = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/grade', () => {
  beforeEach(() => jest.clearAllMocks());

  it('grades an answer and returns result', async () => {
    mockRequireSession.mockResolvedValue({ id: 'user-1' });
    mockCheckRateLimit.mockResolvedValue({ success: true });
    mockGradeAnswer.mockResolvedValue({
      score: 7,
      feedback: 'Good answer',
      suggestions: ['Add more examples'],
    });

    const req = makeRequest('POST', '/api/grade', {
      question: 'Discuss the importance of fundamental rights.',
      answer: 'Fundamental rights are important because...',
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.result.score).toBe(7);
    expect(mockGradeAnswer).toHaveBeenCalledWith(
      'Discuss the importance of fundamental rights.',
      'Fundamental rights are important because...',
    );
  });

  it('saves grading result when save flag is true', async () => {
    mockRequireSession.mockResolvedValue({ id: 'user-1' });
    mockCheckRateLimit.mockResolvedValue({ success: true });
    mockGradeAnswer.mockResolvedValue({ score: 8 });

    const req = makeRequest('POST', '/api/grade', {
      question: 'Q1',
      answer: 'A1',
      save: true,
    });
    await POST(req);

    expect(mockSaveGradingResult).toHaveBeenCalledWith(
      'user-1',
      'Q1',
      'A1',
      { score: 8 },
    );
  });

  it('returns 400 when question or answer is missing', async () => {
    mockRequireSession.mockResolvedValue({ id: 'user-1' });
    mockCheckRateLimit.mockResolvedValue({ success: true });

    const req = makeRequest('POST', '/api/grade', {
      question: '',
      answer: '',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 429 when rate-limited', async () => {
    mockRequireSession.mockResolvedValue({ id: 'user-1' });
    mockCheckRateLimit.mockResolvedValue({ success: false, retryAfter: 60 });

    const req = makeRequest('POST', '/api/grade', {
      question: 'Q',
      answer: 'A',
    });
    const res = await POST(req);

    expect(res.status).toBe(429);
  });

  it('returns 500 when session is missing (auth error)', async () => {
    mockRequireSession.mockRejectedValue(new Error('Unauthorized'));

    const req = makeRequest('POST', '/api/grade', {
      question: 'Q',
      answer: 'A',
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
  });
});

describe('GET /api/grade', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns grading history for authenticated user', async () => {
    mockRequireSession.mockResolvedValue({ id: 'user-1' });
    mockGetGradingHistory.mockResolvedValue([
      { id: 'g1', question: 'Q1', score: 7 },
      { id: 'g2', question: 'Q2', score: 9 },
    ]);

    const req = makeRequest('GET', '/api/grade');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.history).toHaveLength(2);
  });

  it('returns 500 when unauthenticated', async () => {
    mockRequireSession.mockRejectedValue(new Error('Unauthorized'));

    const req = makeRequest('GET', '/api/grade');
    const res = await GET(req);

    expect(res.status).toBe(500);
  });
});
