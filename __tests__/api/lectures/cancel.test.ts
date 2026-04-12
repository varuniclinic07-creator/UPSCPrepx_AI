/** @jest-environment node */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/lectures/[id]/cancel/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockRequireSession = jest.fn();

jest.mock('@/lib/auth/session', () => ({
  requireSession: (...args: unknown[]) => mockRequireSession(...args),
}));

const mockSingle = jest.fn();
const mockUpdate = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: (...args: unknown[]) => mockSingle(...args),
        })),
      })),
      update: (...args: unknown[]) => mockUpdate(...args),
    })),
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function postReq(id: string) {
  return new NextRequest(new URL(`http://localhost/api/lectures/${id}/cancel`), {
    method: 'POST',
  });
}

const fakeJob = {
  id: 'lec-1',
  user_id: 'u1',
  status: 'queued',
  topic: 'Polity',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/lectures/[id]/cancel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireSession.mockResolvedValue({ user: { id: 'u1' } });
    mockSingle.mockResolvedValue({ data: fakeJob, error: null });
    mockUpdate.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });
  });

  it('returns 401 when session is missing', async () => {
    mockRequireSession.mockRejectedValueOnce(new Error('Unauthorized'));

    const res = await POST(postReq('lec-1'), makeParams('lec-1'));
    expect(res.status).toBe(500);
  });

  it('returns 404 when lecture is not found', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

    const res = await POST(postReq('lec-1'), makeParams('lec-1'));
    expect(res.status).toBe(404);
  });

  it('returns 403 when user does not own the lecture', async () => {
    mockSingle.mockResolvedValueOnce({ data: { ...fakeJob, user_id: 'other-user' }, error: null });

    const res = await POST(postReq('lec-1'), makeParams('lec-1'));
    expect(res.status).toBe(403);
  });

  it('returns 400 when lecture is not in cancellable status', async () => {
    mockSingle.mockResolvedValueOnce({ data: { ...fakeJob, status: 'ready' }, error: null });

    const res = await POST(postReq('lec-1'), makeParams('lec-1'));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Cannot cancel/);
  });

  it('cancels lecture in queued status', async () => {
    const res = await POST(postReq('lec-1'), makeParams('lec-1'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.message).toMatch(/cancelled/i);
  });

  it('cancels lecture in processing status', async () => {
    mockSingle.mockResolvedValueOnce({ data: { ...fakeJob, status: 'processing' }, error: null });

    const res = await POST(postReq('lec-1'), makeParams('lec-1'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
