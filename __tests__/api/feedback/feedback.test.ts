/** @jest-environment node */

import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockInsert = jest.fn();
const mockFrom = jest.fn().mockReturnValue({ insert: mockInsert });

jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn().mockResolvedValue({
    from: (...args: any[]) => mockFrom(...args),
  }),
}));

// ---------------------------------------------------------------------------
// SUT
// ---------------------------------------------------------------------------

import { POST } from '@/app/api/feedback/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: any): NextRequest {
  return new NextRequest(new URL('/api/feedback', 'http://localhost:3000'), {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/feedback', () => {
  beforeEach(() => jest.clearAllMocks());

  it('submits feedback successfully', async () => {
    mockInsert.mockResolvedValue({ error: null });

    const req = makeRequest({
      type: 'bug',
      message: 'The quiz page is broken',
      rating: 3,
      userId: 'user-1',
      context: { page: '/quiz' },
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('feedback');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'bug',
        message: 'The quiz page is broken',
        rating: 3,
        user_id: 'user-1',
      }),
    );
  });

  it('returns 400 when type is missing', async () => {
    const req = makeRequest({ message: 'Some feedback' });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/Missing required fields/i);
  });

  it('returns 400 when message is missing', async () => {
    const req = makeRequest({ type: 'feature' });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/Missing required fields/i);
  });

  it('handles null optional fields', async () => {
    mockInsert.mockResolvedValue({ error: null });

    const req = makeRequest({ type: 'suggestion', message: 'Add dark mode' });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        rating: null,
        user_id: null,
        context: null,
      }),
    );
  });

  it('returns 500 when Supabase insert fails', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'DB error' } });

    const req = makeRequest({ type: 'bug', message: 'Error report' });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toMatch(/Failed to save feedback/i);
  });
});
