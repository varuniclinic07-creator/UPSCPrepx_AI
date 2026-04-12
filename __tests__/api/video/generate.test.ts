/** @jest-environment node */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/video/generate/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockInsert = jest.fn();
const mockSelect = jest.fn();
const mockSingle = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: (...args: unknown[]) => {
        mockInsert(...args);
        return {
          select: (...a: unknown[]) => {
            mockSelect(...a);
            return { single: () => mockSingle() };
          },
        };
      },
    })),
  })),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function postReq(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/video/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/video/generate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSingle.mockResolvedValue({
      data: { id: 'v1', topic: 'Polity', subject: 'General', status: 'PENDING' },
      error: null,
    });
  });

  it('returns 401 when x-user-id header is missing', async () => {
    const res = await POST(postReq({ topic: 'Polity' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when topic is missing', async () => {
    const res = await POST(postReq({}, { 'x-user-id': 'u1' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Topic is required/i);
  });

  it('inserts video request and returns success', async () => {
    const res = await POST(postReq({ topic: 'Polity', subject: 'GS2' }, { 'x-user-id': 'u1' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.id).toBe('v1');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'u1', topic: 'Polity', status: 'PENDING' }),
    );
  });

  it('defaults subject to General when not provided', async () => {
    await POST(postReq({ topic: 'Economy' }, { 'x-user-id': 'u1' }));
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'General' }),
    );
  });

  it('returns 500 when supabase insert fails', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'insert fail' } });

    const res = await POST(postReq({ topic: 'Polity' }, { 'x-user-id': 'u1' }));
    expect(res.status).toBe(500);
  });
});
