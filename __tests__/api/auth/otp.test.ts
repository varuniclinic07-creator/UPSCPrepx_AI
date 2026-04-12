/** @jest-environment node */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';

// --- Mocks ---

const mockSendOTP = jest.fn();
const mockGetOTPStatus = jest.fn();

jest.mock('@/lib/sms/otp-service', () => ({
  sendOTP: (...args: unknown[]) => mockSendOTP(...args),
  getOTPStatus: (...args: unknown[]) => mockGetOTPStatus(...args),
}));

jest.mock('@/lib/security/rate-limiter', () => ({
  withRateLimit: jest.fn(
    async (_req: unknown, _opts: unknown, handler: () => Promise<unknown>) => handler()
  ),
  RATE_LIMITS: {
    otp: { maxRequests: 3, windowMs: 60000, prefix: 'rl:otp' },
  },
}));

// --- Helpers ---

function makePostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/otp', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeGetRequest(phone?: string): NextRequest {
  const url = phone
    ? `http://localhost:3000/api/auth/otp?phone=${phone}`
    : 'http://localhost:3000/api/auth/otp';
  return new NextRequest(url, { method: 'GET' });
}

// --- Tests ---

describe('POST /api/auth/otp', () => {
  let POST: typeof import('@/app/api/auth/otp/route').POST;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await import('@/app/api/auth/otp/route');
    POST = mod.POST;
  });

  it('should send OTP successfully for a valid phone number', async () => {
    mockSendOTP.mockResolvedValue({ success: true, message: 'OTP sent' } as never);

    const res = await POST(makePostRequest({ phone: '9876543210' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockSendOTP).toHaveBeenCalledWith('9876543210');
  });

  it('should return 400 for missing phone number', async () => {
    const res = await POST(makePostRequest({}));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Invalid phone number');
  });

  it('should return 400 for invalid phone number format', async () => {
    const res = await POST(makePostRequest({ phone: '1234567890' }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Invalid phone number');
  });

  it('should return 400 for phone number with wrong length', async () => {
    const res = await POST(makePostRequest({ phone: '987654' }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Invalid phone number');
  });

  it('should return 500 when OTP service throws', async () => {
    mockSendOTP.mockRejectedValue(new Error('Service unavailable') as never);

    const res = await POST(makePostRequest({ phone: '9876543210' }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Failed to send OTP');
  });
});

describe('GET /api/auth/otp', () => {
  let GET: typeof import('@/app/api/auth/otp/route').GET;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await import('@/app/api/auth/otp/route');
    GET = mod.GET;
  });

  it('should return OTP status for a valid phone number', async () => {
    mockGetOTPStatus.mockResolvedValue({
      verified: false,
      attemptsRemaining: 3,
    } as never);

    const res = await GET(makeGetRequest('9876543210'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.verified).toBe(false);
    expect(json.attemptsRemaining).toBe(3);
    expect(mockGetOTPStatus).toHaveBeenCalledWith('9876543210');
  });

  it('should return 400 when phone query param is missing', async () => {
    const res = await GET(makeGetRequest());
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Phone number required');
  });

  it('should return 500 when status check throws', async () => {
    mockGetOTPStatus.mockRejectedValue(new Error('Redis down') as never);

    const res = await GET(makeGetRequest('9876543210'));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Failed to get OTP status');
  });
});
