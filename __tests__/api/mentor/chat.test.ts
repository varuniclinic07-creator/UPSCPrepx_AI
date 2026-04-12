/** @jest-environment node */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/mentor/chat/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSendMessage = jest.fn();
const mockGetMessages = jest.fn();

jest.mock('@/lib/mentor/chat-service', () => ({
  mentorChat: {
    sendMessage: (...args: unknown[]) => mockSendMessage(...args),
    getMessages: (...args: unknown[]) => mockGetMessages(...args),
  },
}));

jest.mock('@/lib/auth/check-access', () => ({
  checkAccess: jest.fn().mockResolvedValue({ allowed: true, remaining: 5 }),
}));

jest.mock('@/lib/security/rate-limiter', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ success: true }),
  RATE_LIMITS: { aiChat: { windowMs: 60000, max: 10 } },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function postReq(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/mentor/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

function getReq(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/mentor/chat');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url);
}

// ---------------------------------------------------------------------------
// POST /api/mentor/chat
// ---------------------------------------------------------------------------

describe('POST /api/mentor/chat', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when x-user-id header is missing', async () => {
    const res = await POST(postReq({ session_id: 's1', message: 'hi' }));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it('returns 400 when session_id or message is missing', async () => {
    const res = await POST(postReq({ message: 'hi' }, { 'x-user-id': 'u1' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Missing required fields/i);
  });

  it('returns 429 when rate-limited', async () => {
    const { checkRateLimit } = require('@/lib/security/rate-limiter');
    checkRateLimit.mockResolvedValueOnce({ success: false, retryAfter: 30 });

    const res = await POST(
      postReq({ session_id: 's1', message: 'hi' }, { 'x-user-id': 'u1' }),
    );
    expect(res.status).toBe(429);
  });

  it('returns 403 when access is denied', async () => {
    const { checkAccess } = require('@/lib/auth/check-access');
    checkAccess.mockResolvedValueOnce({ allowed: false, reason: 'limit reached', remaining: 0 });

    const res = await POST(
      postReq({ session_id: 's1', message: 'hi' }, { 'x-user-id': 'u1' }),
    );
    expect(res.status).toBe(403);
  });

  it('sends message and returns success', async () => {
    mockSendMessage.mockResolvedValueOnce({ reply: 'Hello aspirant!' });

    const res = await POST(
      postReq({ session_id: 's1', message: 'hi' }, { 'x-user-id': 'u1' }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.reply).toBe('Hello aspirant!');
    expect(mockSendMessage).toHaveBeenCalledWith('u1', 's1', 'hi');
  });

  it('returns 500 on unexpected error', async () => {
    mockSendMessage.mockRejectedValueOnce(new Error('boom'));

    const res = await POST(
      postReq({ session_id: 's1', message: 'hi' }, { 'x-user-id': 'u1' }),
    );
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// GET /api/mentor/chat
// ---------------------------------------------------------------------------

describe('GET /api/mentor/chat', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when session_id is missing', async () => {
    const res = await GET(getReq());
    expect(res.status).toBe(400);
  });

  it('returns messages for a valid session', async () => {
    const msgs = [{ role: 'assistant', content: 'hi' }];
    mockGetMessages.mockResolvedValueOnce(msgs);

    const res = await GET(getReq({ session_id: 's1' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual(msgs);
  });

  it('returns 500 on unexpected error', async () => {
    mockGetMessages.mockRejectedValueOnce(new Error('db down'));

    const res = await GET(getReq({ session_id: 's1' }));
    expect(res.status).toBe(500);
  });
});
