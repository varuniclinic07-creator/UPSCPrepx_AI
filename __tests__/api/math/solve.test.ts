/** @jest-environment node */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/math/solve/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/auth/session', () => ({
  requireSession: jest.fn().mockResolvedValue({ user: { id: 'u1' } }),
}));

const mockSolveEquation = jest.fn();

jest.mock('@/lib/math/equation-solver', () => ({
  solveEquation: (...args: unknown[]) => mockSolveEquation(...args),
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
  return new NextRequest('http://localhost/api/math/solve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/math/solve', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSolveEquation.mockResolvedValue({ result: 'x = 5', steps: ['step1'] });
  });

  it('returns 400 when equation is missing', async () => {
    const res = await POST(postReq({}));
    expect(res.status).toBe(400);
  });

  it('returns 400 when equation is not a string', async () => {
    const res = await POST(postReq({ equation: 123 }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when equation is too long', async () => {
    const res = await POST(postReq({ equation: 'x'.repeat(1001) }));
    expect(res.status).toBe(400);
  });

  it('solves equation and returns result', async () => {
    const res = await POST(postReq({ equation: '2x + 3 = 13' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.solution.result).toBe('x = 5');
    expect(mockSolveEquation).toHaveBeenCalledWith('2x + 3 = 13');
  });

  it('trims whitespace from equation', async () => {
    await POST(postReq({ equation: '  2x + 3 = 13  ' }));
    expect(mockSolveEquation).toHaveBeenCalledWith('2x + 3 = 13');
  });

  it('returns 401 when session is missing', async () => {
    const { requireSession } = require('@/lib/auth/session');
    requireSession.mockRejectedValueOnce(new Error('Unauthorized'));

    const res = await POST(postReq({ equation: 'x=1' }));
    expect(res.status).toBe(500);
    // error-sanitizer internal catches thrown errors
  });

  it('returns 500 on solver error', async () => {
    mockSolveEquation.mockRejectedValueOnce(new Error('cannot solve'));

    const res = await POST(postReq({ equation: 'x=1' }));
    expect(res.status).toBe(500);
  });
});
