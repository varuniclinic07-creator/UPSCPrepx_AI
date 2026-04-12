/** @jest-environment node */

import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/search/query/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockRpc = jest.fn();
const mockGetUser = jest.fn().mockResolvedValue({ data: { user: null } });
const mockInsert = jest.fn().mockResolvedValue({ error: null });
const mockFrom = jest.fn(() => ({ insert: mockInsert }));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      rpc: (...args: unknown[]) => mockRpc(...args),
      from: (...args: unknown[]) => mockFrom(...args),
      auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    })
  ),
}));

const mockGenerate = jest.fn();

jest.mock('@/lib/search/embedding-service', () => ({
  embeddingService: { generate: (...args: unknown[]) => mockGenerate(...args) },
}));

const mockCallAI = jest.fn();

jest.mock('@/lib/ai/ai-provider-client', () => ({
  callAI: (...args: unknown[]) => mockCallAI(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildPostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/search/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/search/query', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerate.mockResolvedValue([0.1, 0.2, 0.3]);
    mockCallAI.mockResolvedValue('');
    mockRpc.mockResolvedValue({ data: [], error: null });
  });

  it('returns 400 when query is missing', async () => {
    const res = await POST(buildPostRequest({}));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain('Query is required');
  });

  it('returns 400 when query is empty string', async () => {
    const res = await POST(buildPostRequest({ query: '   ' }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain('Query is required');
  });

  it('returns search results on valid query', async () => {
    const rpcResults = [
      {
        id: 'r1',
        title: 'Indian Constitution',
        content_text: 'The Constitution of India was adopted on 26 November 1949.',
        source: 'ncert',
        source_url: null,
        book_reference: null,
        syllabus_tags: ['polity'],
        similarity: 0.92,
        content_type: 'note',
      },
    ];
    mockRpc.mockResolvedValue({ data: rpcResults, error: null });
    mockCallAI
      .mockResolvedValueOnce('The Constitution was adopted in 1949.')
      .mockResolvedValueOnce('["related query 1","related query 2"]');

    const res = await POST(buildPostRequest({ query: 'Indian Constitution' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.results).toHaveLength(1);
    expect(json.results[0].id).toBe('r1');
    expect(json.total_results).toBe(1);
    expect(typeof json.search_time_ms).toBe('number');
    expect(json.suggested_answer_snippet).toBeDefined();
    expect(json.related_queries).toBeDefined();
  });

  it('passes filters to rpc call', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });

    await POST(
      buildPostRequest({
        query: 'economy',
        filters: { sources: ['ncert'], content_type: ['note'] },
        limit: 5,
      })
    );

    expect(mockRpc).toHaveBeenCalledWith('search_content', expect.objectContaining({
      filter_sources: ['ncert'],
      filter_content_types: ['note'],
      limit_results: 5,
    }));
  });

  it('clamps limit to max 100', async () => {
    await POST(buildPostRequest({ query: 'test', limit: 999 }));

    expect(mockRpc).toHaveBeenCalledWith(
      'search_content',
      expect.objectContaining({ limit_results: 100 })
    );
  });

  it('returns 500 when rpc fails', async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error('rpc failure') });

    const res = await POST(buildPostRequest({ query: 'test' }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Search failed');
  });
});

describe('GET /api/search/query', () => {
  it('returns API documentation', async () => {
    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.name).toBe('RAG Search Engine API');
    expect(json.endpoints).toBeDefined();
    expect(Array.isArray(json.sources)).toBe(true);
    expect(Array.isArray(json.content_types)).toBe(true);
  });
});
