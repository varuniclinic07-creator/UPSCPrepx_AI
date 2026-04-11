/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/feedback/route';

const mockInsert = jest.fn();
const mockFrom = jest.fn(() => ({ insert: mockInsert }));
jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(() => Promise.resolve({ from: mockFrom })),
}));

function makeRequest(body: any) {
  return new NextRequest('http://localhost/api/feedback', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockInsert.mockResolvedValue({ error: null });
});

describe('POST /api/feedback', () => {
  it('returns 400 if message missing', async () => {
    const res = await POST(makeRequest({ type: 'bug' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 if type missing', async () => {
    const res = await POST(makeRequest({ message: 'hello' }));
    expect(res.status).toBe(400);
  });

  it('returns success on valid feedback', async () => {
    const res = await POST(makeRequest({ type: 'feedback', message: 'Great app!', rating: 5 }));
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('feedback');
  });

  it('returns 500 on database error', async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: 'DB error' } });
    const res = await POST(makeRequest({ type: 'bug', message: 'Something broke' }));
    expect(res.status).toBe(500);
  });
});
