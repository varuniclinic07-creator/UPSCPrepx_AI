/** @jest-environment node */

import { NextRequest } from 'next/server';
import { GET, POST, DELETE } from '@/app/api/bookmarks/route';

// --- Mocks ---

const mockRequireSession = jest.fn();

jest.mock('@/lib/auth/auth-config', () => ({
  requireSession: () => mockRequireSession(),
  requireUser: jest.fn(),
  getCurrentUser: jest.fn(),
}));

let mockQueryResult: { data: any; error: any } = { data: [], error: null };
let mockInsertResult: { data: any; error: any } = { data: null, error: null };
let mockDeleteResult: { error: any } = { error: null };

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    from: () => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockImplementation(() => Promise.resolve(mockQueryResult)),
        }),
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockImplementation(() => Promise.resolve(mockInsertResult)),
        }),
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockImplementation(() => Promise.resolve(mockDeleteResult)),
        }),
      }),
    }),
  }),
  createServerSupabaseClient: jest.fn(),
}));

// --- Helpers ---

function makeRequest(method: string, body?: Record<string, unknown>): NextRequest {
  const init: Record<string, any> = { method };
  if (body) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(body);
  }
  return new NextRequest(new URL('/api/bookmarks', 'http://localhost:3000'), init);
}

// --- Tests ---

describe('GET /api/bookmarks', () => {
  const fakeSession = { user: { id: 'user-bm-1' } };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireSession.mockResolvedValue(fakeSession);
    mockQueryResult = { data: [], error: null };
  });

  it('returns bookmarks for authenticated user', async () => {
    mockQueryResult = {
      data: [
        { id: 'bm-1', title: 'Note 1', type: 'note', url: '/notes/1', created_at: '2026-01-01' },
        { id: 'bm-2', title: 'Note 2', type: 'note', url: '/notes/2', created_at: '2026-01-02' },
      ],
      error: null,
    };

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.bookmarks).toHaveLength(2);
    expect(body.bookmarks[0].id).toBe('bm-1');
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireSession.mockRejectedValue(new Error('Unauthorized'));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 500 on database error', async () => {
    mockQueryResult = { data: null, error: { message: 'DB error' } };

    // The route throws on error
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
  });
});

describe('POST /api/bookmarks', () => {
  const fakeSession = { user: { id: 'user-bm-1' } };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireSession.mockResolvedValue(fakeSession);
    mockInsertResult = { data: null, error: null };
  });

  it('creates a bookmark successfully', async () => {
    mockInsertResult = {
      data: {
        id: 'bm-new-1',
        title: 'My Bookmark',
        type: 'note',
        url: '/notes/123',
        metadata: {},
      },
      error: null,
    };

    const res = await POST(makeRequest('POST', {
      title: 'My Bookmark',
      type: 'note',
      url: '/notes/123',
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.bookmark.id).toBe('bm-new-1');
    expect(body.bookmark.title).toBe('My Bookmark');
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await POST(makeRequest('POST', {
      title: 'My Bookmark',
    }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Title, type, and URL are required');
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireSession.mockRejectedValue(new Error('Unauthorized'));

    const res = await POST(makeRequest('POST', {
      title: 'My Bookmark',
      type: 'note',
      url: '/notes/123',
    }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });
});

describe('DELETE /api/bookmarks', () => {
  const fakeSession = { user: { id: 'user-bm-1' } };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireSession.mockResolvedValue(fakeSession);
    mockDeleteResult = { error: null };
  });

  it('deletes a bookmark successfully', async () => {
    mockDeleteResult = { error: null };

    const res = await DELETE(makeRequest('DELETE', { id: 'bm-1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireSession.mockRejectedValue(new Error('Unauthorized'));

    const res = await DELETE(makeRequest('DELETE', { id: 'bm-1' }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 500 on database error', async () => {
    mockDeleteResult = { error: { message: 'Delete failed' } };

    const res = await DELETE(makeRequest('DELETE', { id: 'bm-1' }));
    const body = await res.json();

    expect(res.status).toBe(500);
  });
});
