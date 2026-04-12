/** @jest-environment node */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/legal/explain/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/auth/session', () => ({
  requireSession: jest.fn().mockResolvedValue({ user: { id: 'u1' } }),
}));

const mockExplainArticle = jest.fn();
const mockCompareArticles = jest.fn();
const mockGetExamSummary = jest.fn();

jest.mock('@/lib/legal/explainer-service', () => ({
  explainArticle: (...args: unknown[]) => mockExplainArticle(...args),
  compareArticles: (...args: unknown[]) => mockCompareArticles(...args),
  getExamSummary: (...args: unknown[]) => mockGetExamSummary(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function postReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/legal/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/legal/explain', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExplainArticle.mockResolvedValue({ explanation: 'Explained!' });
    mockCompareArticles.mockResolvedValue({ comparison: 'Compared!' });
    mockGetExamSummary.mockResolvedValue({ summary: 'Summary!' });
  });

  it('returns 400 when articleId is missing', async () => {
    const res = await POST(postReq({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Article ID is required/i);
  });

  it('explains article in default mode', async () => {
    const res = await POST(postReq({ articleId: 'art14', query: 'significance' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.explanation).toBe('Explained!');
    expect(mockExplainArticle).toHaveBeenCalledWith('art14', 'significance');
  });

  it('compares two articles in compare mode', async () => {
    const res = await POST(postReq({ articleId: 'art14', mode: 'compare', compareWithId: 'art19' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.comparison).toBe('Compared!');
    expect(mockCompareArticles).toHaveBeenCalledWith('art14', 'art19');
  });

  it('returns 400 when compare mode lacks compareWithId', async () => {
    const res = await POST(postReq({ articleId: 'art14', mode: 'compare' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Second article ID required/i);
  });

  it('returns exam summary in summary mode', async () => {
    const res = await POST(postReq({ articleId: 'art14', mode: 'summary' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.summary).toBe('Summary!');
    expect(mockGetExamSummary).toHaveBeenCalledWith('art14');
  });

  it('returns 401 when user is unauthenticated', async () => {
    const { requireSession } = require('@/lib/auth/session');
    requireSession.mockRejectedValueOnce(new Error('Unauthorized'));

    const res = await POST(postReq({ articleId: 'art14' }));
    expect(res.status).toBe(401);
  });

  it('returns 500 on service error', async () => {
    mockExplainArticle.mockRejectedValueOnce(new Error('AI fail'));

    const res = await POST(postReq({ articleId: 'art14' }));
    expect(res.status).toBe(500);
  });
});
