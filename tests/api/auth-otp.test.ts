/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/auth/otp/route';

const mockSendOTP = jest.fn();
const mockGetOTPStatus = jest.fn();
jest.mock('@/lib/sms/otp-service', () => ({
  sendOTP: (...args: any[]) => mockSendOTP(...args),
  getOTPStatus: (...args: any[]) => mockGetOTPStatus(...args),
}));

jest.mock('@/lib/security/rate-limiter', () => ({
  withRateLimit: jest.fn((_req: any, _config: any, callback: () => any) => callback()),
  RATE_LIMITS: { otp: { maxRequests: 3, windowMs: 60000, prefix: 'rl:otp' } },
}));

function makePostRequest(body: any) {
  return new NextRequest('http://localhost/api/auth/otp', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeGetRequest(phone?: string) {
  const url = phone
    ? `http://localhost/api/auth/otp?phone=${phone}`
    : 'http://localhost/api/auth/otp';
  return new NextRequest(url);
}

beforeEach(() => jest.clearAllMocks());

describe('POST /api/auth/otp', () => {
  it('returns 400 for missing phone', async () => {
    const res = await POST(makePostRequest({}));
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid phone', async () => {
    const res = await POST(makePostRequest({ phone: '1234' }));
    expect(res.status).toBe(400);
  });

  it('calls sendOTP on valid phone', async () => {
    mockSendOTP.mockResolvedValue({ success: true });
    const res = await POST(makePostRequest({ phone: '9876543210' }));
    const data = await res.json();
    expect(mockSendOTP).toHaveBeenCalledWith('9876543210');
    expect(data.success).toBe(true);
  });
});

describe('GET /api/auth/otp', () => {
  it('returns 400 if phone missing', async () => {
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(400);
  });

  it('returns status on valid phone', async () => {
    mockGetOTPStatus.mockResolvedValue({ sent: true, expiresIn: 300 });
    const res = await GET(makeGetRequest('9876543210'));
    const data = await res.json();
    expect(data.sent).toBe(true);
  });
});
