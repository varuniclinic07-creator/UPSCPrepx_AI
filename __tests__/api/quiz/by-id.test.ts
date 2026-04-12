/** @jest-environment node */

import { NextRequest } from 'next/server';
import { GET, DELETE } from '@/app/api/quiz/[id]/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockRequireUser = jest.fn();

jest.mock('@/lib/auth/auth-config', () => ({
  requireUser: (...args: unknown[]) => mockRequireUser(...args),
}));

const mockGetQuizById = jest.fn();
const mockDeleteQuiz = jest.fn();

jest.mock('@/lib/services/quiz-service', () => ({
  getQuizById: (...args: unknown[]) => mockGetQuizById(...args),
  deleteQuiz: (...args: unknown[]) => mockDeleteQuiz(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function getReq(id: string) {
  return new NextRequest(new URL(`http://localhost/api/quiz/${id}`));
}

function deleteReq(id: string) {
  return new NextRequest(new URL(`http://localhost/api/quiz/${id}`), {
    method: 'DELETE',
  });
}

const fakeUser = { id: 'u1', email: 'test@example.com' };
const fakeQuiz = { id: 'quiz-1', title: 'Polity Quiz', questions: [] };

// ---------------------------------------------------------------------------
// Tests — GET
// ---------------------------------------------------------------------------

describe('GET /api/quiz/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireUser.mockResolvedValue(fakeUser);
    mockGetQuizById.mockResolvedValue(fakeQuiz);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockRequireUser.mockRejectedValueOnce(new Error('Authentication required'));

    const res = await GET(getReq('quiz-1'), makeParams('quiz-1'));
    expect(res.status).toBe(401);
  });

  it('returns 404 when quiz is not found', async () => {
    mockGetQuizById.mockResolvedValueOnce(null);

    const res = await GET(getReq('quiz-1'), makeParams('quiz-1'));
    expect(res.status).toBe(404);
  });

  it('returns quiz on success', async () => {
    const res = await GET(getReq('quiz-1'), makeParams('quiz-1'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.quiz.id).toBe('quiz-1');
    expect(mockGetQuizById).toHaveBeenCalledWith('quiz-1', 'u1');
  });

  it('returns 500 on unexpected error', async () => {
    mockGetQuizById.mockRejectedValueOnce(new Error('db error'));

    const res = await GET(getReq('quiz-1'), makeParams('quiz-1'));
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// Tests — DELETE
// ---------------------------------------------------------------------------

describe('DELETE /api/quiz/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireUser.mockResolvedValue(fakeUser);
    mockDeleteQuiz.mockResolvedValue(undefined);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockRequireUser.mockRejectedValueOnce(new Error('Authentication required'));

    const res = await DELETE(deleteReq('quiz-1'), makeParams('quiz-1'));
    expect(res.status).toBe(401);
  });

  it('deletes quiz on success', async () => {
    const res = await DELETE(deleteReq('quiz-1'), makeParams('quiz-1'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.message).toMatch(/deleted/i);
    expect(mockDeleteQuiz).toHaveBeenCalledWith('quiz-1', 'u1');
  });

  it('returns 500 on unexpected error', async () => {
    mockDeleteQuiz.mockRejectedValueOnce(new Error('db error'));

    const res = await DELETE(deleteReq('quiz-1'), makeParams('quiz-1'));
    expect(res.status).toBe(500);
  });
});
