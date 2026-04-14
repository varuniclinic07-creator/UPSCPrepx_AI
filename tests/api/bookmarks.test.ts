/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, POST, DELETE } from '@/app/api/bookmarks/route';

const mockSession = { user: { id: 'user-123' } };
jest.mock('@/lib/auth/auth-config', () => ({
  requireSession: jest.fn(() => Promise.resolve(mockSession)),
}));

const mockOrder = jest.fn(() => ({ ascending: false }));
const mockEqChain = jest.fn(() => ({ order: mockOrder }));
const mockSelect = jest.fn(() => ({ eq: mockEqChain }));
const mockSingle = jest.fn();
const mockSelectAfterInsert = jest.fn(() => ({ single: mockSingle }));
const mockInsert = jest.fn(() => ({ select: mockSelectAfterInsert }));
const mockDeleteEq2 = jest.fn();
const mockDeleteEq = jest.fn(() => ({ eq: mockDeleteEq2 }));
const mockDelete = jest.fn(() => ({ eq: mockDeleteEq }));

const mockFrom = jest.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  delete: mockDelete,
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({ from: mockFrom })) as any,
}));

function makeRequest(method: string, body?: any) {
  const opts: any = { method };
  if (body) {
    opts.body = JSON.stringify(body);
    opts.headers = { 'Content-Type': 'application/json' };
  }
  return new NextRequest('http://localhost/api/bookmarks', opts);
}

beforeEach(() => jest.clearAllMocks());

describe('GET /api/bookmarks', () => {
  it('returns bookmarks for authenticated user', async () => {
    mockOrder.mockResolvedValue({ data: [{ id: '1', title: 'Test' }], error: null } as any);
    const res = await GET();
    const data = await res.json();
    expect(data.bookmarks).toHaveLength(1);
    expect(mockEqChain).toHaveBeenCalledWith('user_id', 'user-123');
  });

  it('returns 500 on db error', async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: 'DB error' } } as any);
    const res = await GET();
    expect(res.status).toBe(500);
  });
});

describe('POST /api/bookmarks', () => {
  it('returns 400 if title missing', async () => {
    const res = await POST(makeRequest('POST', { type: 'note', url: '/test' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 if type missing', async () => {
    const res = await POST(makeRequest('POST', { title: 'Test', url: '/test' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 if url missing', async () => {
    const res = await POST(makeRequest('POST', { title: 'Test', type: 'note' }));
    expect(res.status).toBe(400);
  });

  it('creates bookmark on valid input', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'bk-1', title: 'Test' }, error: null });
    const res = await POST(makeRequest('POST', { title: 'Test', type: 'note', url: '/test' }));
    const data = await res.json();
    expect(data.bookmark.id).toBe('bk-1');
  });
});

describe('DELETE /api/bookmarks', () => {
  it('deletes bookmark successfully', async () => {
    mockDeleteEq2.mockResolvedValue({ error: null });
    const res = await DELETE(makeRequest('DELETE', { id: 'bk-1' }));
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
