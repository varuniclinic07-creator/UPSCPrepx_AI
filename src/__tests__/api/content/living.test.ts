/**
 * Tests for /api/content/living route
 *
 * Validates session auth, input validation, fresh content return
 * from cache, stale content triggering generation, and error handling.
 */
import { NextRequest } from 'next/server';

// --- Mocks ---

const mockMaybeSingle = jest.fn();
const mockSingle = jest.fn();
const mockFrom = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
  })),
}));

const mockRequireSession = jest.fn();
jest.mock('@/lib/auth/session', () => ({
  requireSession: () => mockRequireSession(),
}));

const mockNormalizeUPSCInput = jest.fn();
jest.mock('@/lib/agents/normalizer-agent', () => ({
  normalizeUPSCInput: (...args: any[]) => mockNormalizeUPSCInput(...args),
}));

const mockDispatch = jest.fn();
jest.mock('@/lib/agents/orchestrator', () => ({
  hermes: {
    dispatch: (...args: any[]) => mockDispatch(...args),
  },
}));

import { POST } from '@/app/api/content/living/route';

// --- Helpers ---

function makeRequest(body: Record<string, any>): NextRequest {
  return new NextRequest('http://localhost/api/content/living', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function setupContentQueueQuery(existing: any | null) {
  mockMaybeSingle.mockResolvedValue({ data: existing, error: null });
  mockSingle.mockResolvedValue({ data: null, error: null });

  mockFrom.mockImplementation((table: string) => {
    if (table === 'content_queue') {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue({
                    maybeSingle: mockMaybeSingle,
                  }),
                }),
              }),
            }),
          }),
        }),
      };
    }
    if (table === 'knowledge_nodes') {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      };
    }
    return {};
  });
}

// --- Tests ---

describe('POST /api/content/living', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireSession.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('returns 400 when topic is missing', async () => {
    const res = await POST(makeRequest({ contentType: 'notes' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('topic');
  });

  it('returns 400 when contentType is missing', async () => {
    const res = await POST(makeRequest({ topic: 'Fundamental Rights' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('contentType');
  });

  it('returns existing fresh content from content_queue without regenerating', async () => {
    mockNormalizeUPSCInput.mockResolvedValue({
      nodeId: 'node-1',
      subject: 'Polity',
      topic: 'Fundamental Rights',
    });

    // Content created 1 day ago (fresh)
    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
    setupContentQueueQuery({
      generated_content: { html: '<h1>Fundamental Rights</h1>' },
      confidence_score: 0.95,
      created_at: oneDayAgo,
    });

    const res = await POST(makeRequest({ topic: 'Fundamental Rights', contentType: 'notes' }));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.generatedNow).toBe(false);
    expect(body.content).toEqual({ html: '<h1>Fundamental Rights</h1>' });
    expect(body.freshness).toBe(0.95);
    expect(body.nodeId).toBe('node-1');

    // Should NOT have called hermes dispatch
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('triggers generation when existing content is stale (older than 7 days)', async () => {
    mockNormalizeUPSCInput.mockResolvedValue({
      nodeId: 'node-stale',
      subject: 'Economy',
      topic: 'GST',
    });

    // Content created 10 days ago (stale)
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    setupContentQueueQuery({
      generated_content: { html: '<p>Old GST content</p>' },
      confidence_score: 0.6,
      created_at: tenDaysAgo,
    });

    // knowledge_nodes also stale
    mockSingle.mockResolvedValue({
      data: { content: 'Old content', freshness_score: 0.3, metadata: {} },
      error: null,
    });

    mockDispatch.mockResolvedValue({
      success: true,
      data: { html: '<p>Fresh GST content</p>' },
    });

    const res = await POST(makeRequest({ topic: 'GST', contentType: 'notes' }));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.generatedNow).toBe(true);
    expect(body.freshness).toBe(1.0);
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'generate_notes',
        topic: 'GST',
        subject: 'Economy',
      })
    );
  });

  it('returns 500 when content generation fails', async () => {
    mockNormalizeUPSCInput.mockResolvedValue({
      nodeId: null,
      subject: 'History',
      topic: 'Mughal Empire',
    });

    // No existing content (nodeId is null, skips cache check)
    mockDispatch.mockResolvedValue({
      success: false,
      error: 'Model rate limited',
    });

    const res = await POST(makeRequest({ topic: 'Mughal Empire', contentType: 'notes' }));
    expect(res.status).toBe(500);
    const body = await res.json();

    expect(body.success).toBe(false);
    expect(body.generatedNow).toBe(true);
    expect(body.error).toBe('Model rate limited');
  });
});
