/** @jest-environment node */

import { GET } from '@/app/api/quiz/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockRequireUser = jest.fn();
jest.mock('@/lib/auth/auth-config', () => ({
  requireUser: (...args: unknown[]) => mockRequireUser(...args),
}));

const mockGetUserQuizzes = jest.fn();
const mockGetUserQuizStats = jest.fn();
jest.mock('@/lib/services/quiz-service', () => ({
  getUserQuizzes: (...args: unknown[]) => mockGetUserQuizzes(...args),
  getUserQuizStats: (...args: unknown[]) => mockGetUserQuizStats(...args),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/quiz', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    mockRequireUser.mockRejectedValue(new Error('Authentication required'));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Please login to view quizzes');
  });

  it('returns quizzes and stats for an authenticated user', async () => {
    const fakeUser = { id: 'user-1', email: 'test@example.com' };
    const fakeQuizzes = [
      { id: 'q1', title: 'Indian Polity' },
      { id: 'q2', title: 'Geography' },
    ];
    const fakeStats = { totalAttempts: 5, avgScore: 72 };

    mockRequireUser.mockResolvedValue(fakeUser);
    mockGetUserQuizzes.mockResolvedValue(fakeQuizzes);
    mockGetUserQuizStats.mockResolvedValue(fakeStats);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.quizzes).toEqual(fakeQuizzes);
    expect(body.stats).toEqual(fakeStats);
    expect(body.count).toBe(2);
    expect(mockGetUserQuizzes).toHaveBeenCalledWith('user-1');
    expect(mockGetUserQuizStats).toHaveBeenCalledWith('user-1');
  });

  it('returns 500 on unexpected error', async () => {
    mockRequireUser.mockRejectedValue(new Error('DB connection failed'));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to fetch quizzes');
  });
});
