/** @jest-environment node */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/legal/articles/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/auth/session', () => ({
  requireSession: jest.fn().mockResolvedValue({ user: { id: 'u1' } }),
}));

jest.mock('@/lib/legal/constitution-data', () => {
  const articles = [
    { id: 'art14', title: 'Right to Equality', relevance: 'high' },
    { id: 'art19', title: 'Right to Freedom', relevance: 'high' },
    { id: 'art100', title: 'Some article', relevance: 'low' },
  ];
  return {
    CONSTITUTIONAL_ARTICLES: articles,
    searchArticles: jest.fn((q: string) =>
      articles.filter((a) => a.title.toLowerCase().includes(q.toLowerCase())),
    ),
    getHighRelevanceArticles: jest.fn(() =>
      articles.filter((a) => a.relevance === 'high'),
    ),
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getReq(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/legal/articles');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/legal/articles', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns all articles when no filter is specified', async () => {
    const res = await GET(getReq());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.articles).toHaveLength(3);
    expect(json.total).toBe(3);
  });

  it('searches articles by query parameter', async () => {
    const res = await GET(getReq({ q: 'Freedom' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.articles).toHaveLength(1);
    expect(json.articles[0].title).toBe('Right to Freedom');
  });

  it('filters high relevance articles', async () => {
    const res = await GET(getReq({ relevance: 'high' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.articles).toHaveLength(2);
  });

  it('returns 401 when user is unauthenticated', async () => {
    const { requireSession } = require('@/lib/auth/session');
    requireSession.mockRejectedValueOnce(new Error('Unauthorized'));

    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });
});
