/** @jest-environment node */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/agentic/query/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockQuery = jest.fn();
const mockCheckHealth = jest.fn();

jest.mock('@/lib/agentic/orchestrator', () => ({
  agenticOrchestrator: {
    query: (...args: unknown[]) => mockQuery(...args),
    checkHealth: (...args: unknown[]) => mockCheckHealth(...args),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function postReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/agentic/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// POST /api/agentic/query
// ---------------------------------------------------------------------------

describe('POST /api/agentic/query', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockResolvedValue({
      answer: 'The answer is...',
      servicesUsed: ['rag', 'web'],
      intent: 'factual',
      processingTime: 1234,
    });
  });

  it('returns 400 when query is missing', async () => {
    const res = await POST(postReq({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Query is required/i);
  });

  it('returns orchestrator response on success', async () => {
    const res = await POST(postReq({ query: 'What is Article 21?' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.answer).toBe('The answer is...');
    expect(json.servicesUsed).toContain('rag');
    expect(res.headers.get('X-Intent')).toBe('factual');
  });

  it('passes options to orchestrator', async () => {
    await POST(postReq({
      query: 'test',
      combineServices: false,
      includeWebSearch: false,
    }));
    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'test',
        options: expect.objectContaining({
          combineServices: false,
          includeWebSearch: false,
        }),
      }),
    );
  });

  it('returns 500 on orchestrator error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('service down'));

    const res = await POST(postReq({ query: 'test' }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Query failed');
  });
});

// ---------------------------------------------------------------------------
// GET /api/agentic/query (health check)
// ---------------------------------------------------------------------------

describe('GET /api/agentic/query', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckHealth.mockResolvedValue({ rag: 'ok', web: 'ok' });
  });

  it('returns health status', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('healthy');
    expect(json.services).toEqual({ rag: 'ok', web: 'ok' });
    expect(json.timestamp).toBeDefined();
  });

  it('returns 500 when health check fails', async () => {
    mockCheckHealth.mockRejectedValueOnce(new Error('unhealthy'));

    const res = await GET();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.status).toBe('error');
  });
});
