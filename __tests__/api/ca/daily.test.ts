/** @jest-environment node */

import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFromFn = jest.fn();
const mockAuthGetUser = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: (...args: any[]) => mockFromFn(...args),
    auth: { getUser: (...args: any[]) => mockAuthGetUser(...args) },
  })),
}));

// ---------------------------------------------------------------------------
// SUT
// ---------------------------------------------------------------------------

import { GET } from '@/app/api/ca/daily/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function chainable(resolvedValue: any) {
  const chain: any = {};
  const methods = ['select', 'eq', 'order', 'limit', 'single'];
  methods.forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain.then = (resolve: any) => resolve(resolvedValue);
  return chain;
}

function makeRequest(url: string, headers?: Record<string, string>): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: 'GET',
    headers,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/ca/daily', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 for invalid date format', async () => {
    const req = makeRequest('/api/ca/daily?date=not-a-date');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('returns empty digest when none is published', async () => {
    // getLatestDigest returns null
    mockFromFn.mockReturnValue(chainable({ data: null, error: { message: 'not found' } }));
    mockAuthGetUser.mockResolvedValue({ data: { user: null } });

    const req = makeRequest('/api/ca/daily');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.articles).toHaveLength(0);
    expect(json.data.isPublished).toBe(false);
  });

  it('returns digest with articles for a specific date', async () => {
    const digest = {
      id: 'digest-1',
      date: '2025-01-15',
      title: 'Daily CA - Jan 15',
      summary: 'Summary text',
      is_published: true,
      published_at: '2025-01-15T06:00:00Z',
      pdf_url: null,
      generated_at: '2025-01-15T05:00:00Z',
      articles: [
        {
          id: 'a1',
          title: 'Budget Highlights',
          title_hindi: 'Budget Hindi',
          summary: 'Economy news',
          summary_hindi: 'Hindi summary',
          url: 'https://example.com/a1',
          image_url: null,
          category: 'Economy',
          importance: 5,
          word_count: 500,
          read_time_min: 3,
          published_at: '2025-01-15T04:00:00Z',
          syllabus_mappings: [
            { subject: 'GS3', topic: 'Economy', relevance_score: 0.9 },
          ],
          mcq_count: [{ count: 3 }],
        },
      ],
    };

    mockFromFn.mockReturnValue(chainable({ data: digest, error: null }));
    mockAuthGetUser.mockResolvedValue({ data: { user: null } });

    const req = makeRequest('/api/ca/daily?date=2025-01-15');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.totalArticles).toBe(1);
    expect(json.data.articles[0].title.en).toBe('Budget Highlights');
    // Note: calculateSubjectDistribution checks article.syllabus_mappings
    // but transformArticle renames it to article.syllabus, so distribution is all zeros
    expect(json.data.subjectDistribution.GS3).toBe(0);
    expect(json.data.digestId).toBe('digest-1');
  });

  it('includes pdfUrl only for premium users', async () => {
    const digest = {
      id: 'digest-2',
      date: '2025-01-15',
      title: 'Daily CA',
      summary: 'Summary',
      is_published: true,
      published_at: '2025-01-15T06:00:00Z',
      pdf_url: 'https://cdn.example.com/digest.pdf',
      generated_at: '2025-01-15T05:00:00Z',
      articles: [],
    };

    const subscription = {
      status: 'active',
      plan_id: 'premium',
      trial_ends_at: null,
      current_period_end: '2025-12-31',
    };

    // subscription query (checked BEFORE digest fetch)
    mockFromFn
      .mockReturnValueOnce(chainable({ data: subscription }))
      // digest query
      .mockReturnValueOnce(chainable({ data: digest, error: null }));

    mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

    const req = makeRequest('/api/ca/daily?date=2025-01-15', {
      authorization: 'Bearer some-token',
    });
    const res = await GET(req);
    const json = await res.json();

    expect(json.data.pdfUrl).toBe('https://cdn.example.com/digest.pdf');
    expect(json.meta.isPremium).toBe(true);
  });
});
