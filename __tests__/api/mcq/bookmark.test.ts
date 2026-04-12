/** @jest-environment node */

import { GET, POST } from '@/app/api/mcq/bookmark/route';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockSupabase = {
  auth: { getUser: () => mockGetUser() },
  from: (...args: unknown[]) => mockFrom(...args),
};
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase)),
}));

const mockCalculateSpacedRepetition = jest.fn();
jest.mock('@/lib/mcq/adaptive-engine', () => ({
  adaptiveEngine: {
    calculateSpacedRepetition: (...args: unknown[]) => mockCalculateSpacedRepetition(...args),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const QUESTION_ID = '66666666-6666-4666-a666-666666666666';

function makePostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/mcq/bookmark', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeGetRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/mcq/bookmark');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url, { method: 'GET' });
}

const fakeUser = { id: 'user-1', email: 'test@example.com' };

function mockSupabaseChain(returnValue: unknown) {
  const chain: Record<string, jest.Mock> = {};
  const resolved = Promise.resolve(returnValue);
  const proxy = new Proxy(chain, {
    get(_target, prop) {
      if (prop === 'then') return resolved.then.bind(resolved);
      if (!chain[prop as string]) {
        chain[prop as string] = jest.fn().mockReturnValue(proxy);
      }
      return chain[prop as string];
    },
  });
  return proxy;
}

// ---------------------------------------------------------------------------
// POST Tests
// ---------------------------------------------------------------------------

describe('POST /api/mcq/bookmark', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') });

    const res = await POST(
      makePostRequest({ questionId: QUESTION_ID, action: 'add' }),
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Authentication required');
  });

  it('returns 400 for invalid request body', async () => {
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });

    const res = await POST(makePostRequest({ questionId: 'bad', action: 'add' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid request');
  });

  it('adds a bookmark successfully', async () => {
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });

    const nextReviewDate = '2026-04-15T10:00:00Z';
    mockCalculateSpacedRepetition.mockResolvedValue({
      nextReviewDate,
      reviewCount: 1,
    });

    // from('mcq_questions') for question lookup
    const questionChain = mockSupabaseChain({ data: { correct_option: 2 } });
    // from('mcq_bookmarks') for existing check - returns null (not existing)
    const existingChain = mockSupabaseChain({ data: null, error: { code: 'PGRST116' } });
    // from('mcq_bookmarks') for insert
    const insertChain = mockSupabaseChain({ data: null, error: null });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return questionChain;
      if (callCount === 2) return existingChain;
      return insertChain;
    });

    const res = await POST(
      makePostRequest({
        questionId: QUESTION_ID,
        action: 'add',
        notes: 'Review this',
        tags: ['important'],
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Question bookmarked');
    expect(body.nextReview).toBe(nextReviewDate);
    expect(mockCalculateSpacedRepetition).toHaveBeenCalledWith('user-1', QUESTION_ID, true);
  });

  it('returns 409 when question is already bookmarked', async () => {
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });

    const questionChain = mockSupabaseChain({ data: { correct_option: 2 } });
    const existingChain = mockSupabaseChain({
      data: { id: 'bm-1', notes: 'old', tags: [], difficulty_for_user: 'Easy' },
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return questionChain;
      return existingChain;
    });

    const res = await POST(
      makePostRequest({ questionId: QUESTION_ID, action: 'add' }),
    );
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toBe('Question already bookmarked');
  });

  it('removes a bookmark successfully', async () => {
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });

    const deleteChain = mockSupabaseChain({ data: null, error: null });
    mockFrom.mockReturnValue(deleteChain);

    const res = await POST(
      makePostRequest({ questionId: QUESTION_ID, action: 'remove' }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Bookmark removed');
  });

  it('updates an existing bookmark', async () => {
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });

    mockCalculateSpacedRepetition.mockResolvedValue({
      nextReviewDate: '2026-04-20T10:00:00Z',
      reviewCount: 3,
    });

    const questionChain = mockSupabaseChain({ data: { correct_option: 1 } });
    const existingChain = mockSupabaseChain({
      data: { id: 'bm-1', notes: 'old note', tags: ['old'], difficulty_for_user: 'Easy' },
    });
    const updateChain = mockSupabaseChain({ data: null, error: null });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return questionChain;
      if (callCount === 2) return existingChain;
      return updateChain;
    });

    const res = await POST(
      makePostRequest({
        questionId: QUESTION_ID,
        action: 'update',
        notes: 'Updated notes',
        difficulty: 'Hard',
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Bookmark updated');
  });
});

// ---------------------------------------------------------------------------
// GET Tests
// ---------------------------------------------------------------------------

describe('GET /api/mcq/bookmark', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') });

    const res = await GET(makeGetRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Authentication required');
  });

  it('returns bookmarks list', async () => {
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });

    const bookmarksData = [
      {
        id: 'bm-1',
        question_id: QUESTION_ID,
        notes: 'Review',
        tags: ['polity'],
        question: { id: QUESTION_ID, question_text: 'What is...?', subject: 'GS2' },
      },
    ];

    // First from call: bookmarks list query
    const listChain = mockSupabaseChain({ data: bookmarksData, error: null });
    // Second from call: count query
    const countChain = mockSupabaseChain({ count: 5 });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return listChain;
      return countChain;
    });

    const res = await GET(makeGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.bookmarks).toHaveLength(1);
    expect(body.data.total).toBe(5);
  });

  it('filters by due date when due=true', async () => {
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });

    const listChain = mockSupabaseChain({ data: [], error: null });
    const countChain = mockSupabaseChain({ count: 0 });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return listChain;
      return countChain;
    });

    const res = await GET(makeGetRequest({ due: 'true' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.dueCount).toBe(0);
  });

  it('filters by tag query param', async () => {
    mockGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });

    const listChain = mockSupabaseChain({ data: [], error: null });
    const countChain = mockSupabaseChain({ count: 0 });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return listChain;
      return countChain;
    });

    const res = await GET(makeGetRequest({ tag: 'important' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });
});
