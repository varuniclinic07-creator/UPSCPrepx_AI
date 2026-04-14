/**
 * Tests for /api/cron/video-generation route
 *
 * Validates authentication, successful video/animation generation,
 * empty subtopic handling, and orchestrator dispatch calls.
 */
import { NextRequest } from 'next/server';

// --- Mocks ---

const mockDispatch = jest.fn();
const mockSelect = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      select: (...args: any[]) => ({
        eq: (...eqArgs: any[]) => ({
          limit: () => Promise.resolve({ data: mockSelect(), error: null }),
        }),
      }),
    }),
  }),
}));

jest.mock('@/lib/agents/orchestrator', () => ({
  hermes: {
    dispatch: (...args: any[]) => mockDispatch(...args),
  },
}));

import { POST } from '@/app/api/cron/video-generation/route';

// --- Helpers ---

function makeRequest(token?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (token) headers['authorization'] = token;
  return new NextRequest('http://localhost/api/cron/video-generation', {
    method: 'POST',
    headers,
  });
}

// --- Tests ---

describe('POST /api/cron/video-generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 without CRON_SECRET header', async () => {
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when authorization token is wrong', async () => {
    const res = await POST(makeRequest('Bearer wrong-token'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 200 on success and dispatches generate_video + generate_animation tasks', async () => {
    mockSelect.mockReturnValue([
      { id: 'node-1', title: 'Fundamental Rights', subject: 'GS2', type: 'subtopic' },
      { id: 'node-2', title: 'Ethics Case Study', subject: 'GS4', type: 'subtopic' },
    ]);

    mockDispatch.mockResolvedValue({ success: true });

    const res = await POST(makeRequest('Bearer test-cron-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.videos).toBe(2);

    // Both nodes should get generate_video dispatches
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'generate_video',
        nodeId: 'node-1',
        topic: 'Fundamental Rights',
      })
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'generate_video',
        nodeId: 'node-2',
        topic: 'Ethics Case Study',
      })
    );

    // GS4 node should get generate_animation dispatch
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'generate_animation',
        nodeId: 'node-2',
        subject: 'GS4',
        payload: expect.objectContaining({ animationType: 'case_study' }),
      })
    );

    // Subtopic node-1 also gets animation (all subtopics do)
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'generate_animation',
        nodeId: 'node-1',
      })
    );
  });

  it('handles empty subtopic list gracefully', async () => {
    mockSelect.mockReturnValue([]);

    const res = await POST(makeRequest('Bearer test-cron-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.processed).toBe(0);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('returns 500 when orchestrator dispatch throws', async () => {
    mockSelect.mockReturnValue([
      { id: 'node-fail', title: 'Failing Topic', subject: 'GS1', type: 'subtopic' },
    ]);

    mockDispatch.mockRejectedValue(new Error('Orchestrator unavailable'));

    const res = await POST(makeRequest('Bearer test-cron-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();

    // Individual errors are caught; overall response is still 200
    expect(body.success).toBe(true);
    expect(body.errors).toBe(1);
  });
});
