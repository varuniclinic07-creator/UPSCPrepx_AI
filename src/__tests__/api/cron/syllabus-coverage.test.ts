/**
 * Tests for /api/cron/syllabus-coverage route
 *
 * Validates authentication, processing of uncovered subtopics
 * through the research/notes/quiz pipeline, and empty-result handling.
 */
import { NextRequest } from 'next/server';

// --- Mocks ---

const mockUpdate = jest.fn().mockReturnValue({
  eq: jest.fn().mockResolvedValue({ data: null, error: null }),
});

const mockFrom = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
  })),
}));

const mockDispatch = jest.fn();
jest.mock('@/lib/agents/orchestrator', () => ({
  hermes: {
    dispatch: (...args: any[]) => mockDispatch(...args),
  },
}));

import { POST } from '@/app/api/cron/syllabus-coverage/route';

// --- Helpers ---

function makeRequest(token?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (token) headers['authorization'] = token;
  return new NextRequest('http://localhost/api/cron/syllabus-coverage', {
    method: 'POST',
    headers,
  });
}

function setupKnowledgeNodesQuery(nodes: Array<{ id: string; title: string; subject: string; type: string }> | null) {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'knowledge_nodes') {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: nodes }),
            }),
          }),
        }),
        update: mockUpdate,
      };
    }
    return {};
  });
}

// --- Tests ---

describe('POST /api/cron/syllabus-coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when authorization header is missing', async () => {
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when authorization token is invalid', async () => {
    const res = await POST(makeRequest('Bearer nope'));
    expect(res.status).toBe(401);
  });

  it('returns processed:0 when all subtopics are covered', async () => {
    setupKnowledgeNodesQuery([]);

    const res = await POST(makeRequest('Bearer test-cron-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.processed).toBe(0);
    expect(body.message).toBe('All subtopics covered');
  });

  it('processes uncovered nodes through research, notes, and quiz pipeline', async () => {
    setupKnowledgeNodesQuery([
      { id: 'node-1', title: 'Fundamental Rights', subject: 'Polity', type: 'subtopic' },
    ]);

    // Research returns sources, notes and quiz succeed
    mockDispatch
      .mockResolvedValueOnce({ success: true, data: { sources: ['src1'] } })  // research
      .mockResolvedValueOnce({ success: true })  // notes
      .mockResolvedValueOnce({ success: true });  // quiz

    const res = await POST(makeRequest('Bearer test-cron-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.processed).toBe(1);
    expect(body.notes).toBe(1);
    expect(body.quizzes).toBe(1);
    expect(body.errors).toBe(0);

    // Verify dispatch calls
    expect(mockDispatch).toHaveBeenCalledTimes(3);
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'research_topic', topic: 'Fundamental Rights' })
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'generate_notes', topic: 'Fundamental Rights' })
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'generate_quiz', topic: 'Fundamental Rights' })
    );

    // Verify freshness update
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ freshness_score: 1.0 })
    );
  });

  it('counts errors when a node pipeline fails', async () => {
    setupKnowledgeNodesQuery([
      { id: 'node-fail', title: 'GST', subject: 'Economy', type: 'subtopic' },
    ]);

    mockDispatch.mockRejectedValue(new Error('Agent timeout'));

    const res = await POST(makeRequest('Bearer test-cron-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.processed).toBe(0);
    expect(body.errors).toBe(1);
  });
});
