/**
 * Tests for /api/cron/ca-ingestion route
 *
 * Validates authentication, successful CA article ingestion,
 * quality scoring of ingested articles, and error handling.
 */
import { NextRequest } from 'next/server';

// --- Mocks ---

const mockExecute = jest.fn();
const mockScoreContent = jest.fn();

jest.mock('@/lib/agents/ca-ingestion-agent', () => ({
  caIngestionAgent: {
    execute: (...args: any[]) => mockExecute(...args),
  },
}));

jest.mock('@/lib/agents/quality-agent', () => ({
  qualityAgent: {
    scoreContent: (...args: any[]) => mockScoreContent(...args),
  },
}));

import { POST } from '@/app/api/cron/ca-ingestion/route';

// --- Helpers ---

function makeRequest(token?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (token) headers['authorization'] = token;
  return new NextRequest('http://localhost/api/cron/ca-ingestion', {
    method: 'POST',
    headers,
  });
}

// --- Tests ---

describe('POST /api/cron/ca-ingestion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when authorization header is missing', async () => {
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when authorization token is wrong', async () => {
    const res = await POST(makeRequest('Bearer wrong'));
    expect(res.status).toBe(401);
  });

  it('processes ingested articles and runs quality scoring', async () => {
    mockExecute.mockResolvedValue({
      processed: 5,
      articles: [
        { nodeId: 'ca-1', title: 'Budget 2024', summary: 'Union budget summary' },
        { nodeId: 'ca-2', title: 'SC Ruling', summary: 'Supreme Court landmark ruling' },
      ],
      errors: [],
    });
    mockScoreContent.mockResolvedValue({ score: 0.9 });

    const res = await POST(makeRequest('Bearer test-cron-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.processed).toBe(5);
    expect(body.articles).toBe(2);
    expect(body.errors).toBe(0);
    expect(body.date).toBeDefined();

    // Quality agent scored both articles
    expect(mockScoreContent).toHaveBeenCalledTimes(2);
    expect(mockScoreContent).toHaveBeenCalledWith(
      expect.objectContaining({
        contentId: 'ca-1',
        contentType: 'ca_brief',
      })
    );
  });

  it('handles zero articles gracefully without calling quality agent', async () => {
    mockExecute.mockResolvedValue({
      processed: 0,
      articles: [],
      errors: [],
    });

    const res = await POST(makeRequest('Bearer test-cron-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.processed).toBe(0);
    expect(body.articles).toBe(0);
    expect(mockScoreContent).not.toHaveBeenCalled();
  });

  it('returns 500 when ca-ingestion agent throws', async () => {
    mockExecute.mockRejectedValue(new Error('Network timeout'));

    const res = await POST(makeRequest('Bearer test-cron-secret'));
    expect(res.status).toBe(500);
    const body = await res.json();

    expect(body.error).toBe('CA ingestion failed');
    expect(body.details).toBe('Network timeout');
  });
});
