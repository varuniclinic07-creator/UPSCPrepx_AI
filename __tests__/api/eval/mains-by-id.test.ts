/** @jest-environment node */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/eval/mains/[id]/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetSession = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: {
      getSession: () => mockGetSession(),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  }),
}));

const mockGetEvaluationById = jest.fn();

jest.mock('@/lib/eval/mains-evaluator-service', () => ({
  getEvaluationById: (...args: unknown[]) => mockGetEvaluationById(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function getReq(id: string) {
  return new NextRequest(new URL(`http://localhost/api/eval/mains/${id}`));
}

function postReq(id: string, body: Record<string, unknown>) {
  return new NextRequest(new URL(`http://localhost/api/eval/mains/${id}`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const fakeSession = { user: { id: 'u1' } };
const fakeEvaluation = {
  id: 'eval-1',
  answer_id: 'ans-1',
  scores: { content: 8, structure: 7 },
};

// ---------------------------------------------------------------------------
// Tests — GET
// ---------------------------------------------------------------------------

describe('GET /api/eval/mains/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: fakeSession }, error: null });
    mockGetEvaluationById.mockResolvedValue(fakeEvaluation);
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { user_id: 'u1' }, error: null }),
        }),
      }),
    });
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: null }, error: { message: 'no auth' } });

    const res = await GET(getReq('eval-1'), makeParams('eval-1'));
    expect(res.status).toBe(401);
  });

  it('returns 404 when evaluation is not found', async () => {
    mockGetEvaluationById.mockResolvedValueOnce(null);

    const res = await GET(getReq('eval-1'), makeParams('eval-1'));
    expect(res.status).toBe(404);
  });

  it('returns 403 when user does not own the evaluation', async () => {
    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { user_id: 'other-user' }, error: null }),
        }),
      }),
    });

    const res = await GET(getReq('eval-1'), makeParams('eval-1'));
    expect(res.status).toBe(403);
  });

  it('returns evaluation on success', async () => {
    const res = await GET(getReq('eval-1'), makeParams('eval-1'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.id).toBe('eval-1');
  });

  it('returns 500 on unexpected error', async () => {
    mockGetSession.mockRejectedValueOnce(new Error('crash'));

    const res = await GET(getReq('eval-1'), makeParams('eval-1'));
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// Tests — POST (feedback)
// ---------------------------------------------------------------------------

describe('POST /api/eval/mains/[id] (feedback)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: fakeSession }, error: null });
    // No existing feedback
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
      insert: jest.fn().mockResolvedValue({ error: null }),
    });
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: null }, error: null });

    const res = await POST(postReq('eval-1', { rating: 4 }), makeParams('eval-1'));
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid rating', async () => {
    const res = await POST(postReq('eval-1', { rating: 10 }), makeParams('eval-1'));
    expect(res.status).toBe(400);
  });

  it('inserts new feedback on success', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
      insert: mockInsert,
    });

    const res = await POST(
      postReq('eval-1', { rating: 4, was_helpful: true, feedback_text: 'Good' }),
      makeParams('eval-1'),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it('updates existing feedback', async () => {
    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 'fb-1' }, error: null }),
          }),
        }),
      }),
      update: mockUpdate,
    });

    const res = await POST(
      postReq('eval-1', { rating: 5, was_helpful: true }),
      makeParams('eval-1'),
    );
    expect(res.status).toBe(200);
  });

  it('returns 500 on unexpected error', async () => {
    mockGetSession.mockRejectedValueOnce(new Error('crash'));

    const res = await POST(postReq('eval-1', { rating: 3 }), makeParams('eval-1'));
    expect(res.status).toBe(500);
  });
});
