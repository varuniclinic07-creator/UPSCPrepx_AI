/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/register/route';

const mockSingle = jest.fn();
const mockEq = jest.fn(() => ({ single: mockSingle }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockInsert = jest.fn();
const mockUpdateEq = jest.fn();
const mockUpdate = jest.fn(() => ({ eq: mockUpdateEq }));
const mockFrom = jest.fn((table: string) => {
  if (table === 'users') {
    return { select: mockSelect, insert: mockInsert, update: mockUpdate };
  }
  return { insert: mockInsert };
});

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({ from: mockFrom })),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => Promise.resolve('hashed-password')),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

function makeRequest(body: any) {
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockInsert.mockResolvedValue({ error: null });
  mockUpdateEq.mockResolvedValue({ error: null });
});

describe('POST /api/auth/register', () => {
  it('returns 400 if email missing', async () => {
    const res = await POST(makeRequest({ password: 'pass123', name: 'Test' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/email/i);
  });

  it('returns 400 if password missing', async () => {
    const res = await POST(makeRequest({ email: 'a@b.com', name: 'Test' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 if name missing', async () => {
    const res = await POST(makeRequest({ email: 'a@b.com', password: 'pass123' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 if user already exists', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'existing' } });
    const res = await POST(makeRequest({ email: 'a@b.com', password: 'pass123', name: 'Test' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/already exists/i);
  });

  it('returns 200 with user data on success', async () => {
    mockSingle.mockResolvedValue({ data: null });
    const res = await POST(makeRequest({ email: 'a@b.com', password: 'pass123', name: 'Test', phone: '9999999999' }));
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.email).toBe('a@b.com');
    expect(data.user.name).toBe('Test');
    expect(data.user.id).toBe('test-uuid-1234');
  });

  it('returns 500 on database error', async () => {
    mockSingle.mockResolvedValue({ data: null });
    mockInsert.mockResolvedValueOnce({ error: { message: 'DB error' } });
    const res = await POST(makeRequest({ email: 'a@b.com', password: 'pass123', name: 'Test' }));
    expect(res.status).toBe(500);
  });
});
