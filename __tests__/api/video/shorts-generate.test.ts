/** @jest-environment node */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/video/shorts/generate/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockInsert = jest.fn();
const mockSelect = jest.fn();
const mockSingle = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: (...args: unknown[]) => {
        mockInsert(...args);
        return {
          select: (...a: unknown[]) => {
            mockSelect(...a);
            return { single: () => mockSingle() };
          },
        };
      },
    })),
  })),
}));

jest.mock('@/lib/video/shorts-generator', () => ({
  getVideoShortsGenerator: jest.fn(() => ({
    generateVideo: jest.fn().mockResolvedValue({
      title: 'Test Video',
      topic: 'Polity',
      subject: 'GS2',
      script: 'script text',
      duration: 60,
      seoDescription: 'desc',
      hashtags: ['#upsc'],
      socialCaptions: { youtube: 'caption' },
    }),
    renderVideo: jest.fn().mockResolvedValue({
      videoUrl: 'https://cdn/video.mp4',
      thumbnailUrl: 'https://cdn/thumb.jpg',
    }),
  })),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function postReq(body: Record<string, unknown>, authHeader?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authHeader) headers['authorization'] = authHeader;
  return new NextRequest('http://localhost/api/video/shorts/generate', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/video/shorts/generate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSingle.mockResolvedValue({
      data: {
        id: 'q1',
        status: 'pending',
        estimated_completion_at: '2025-01-01T00:05:00Z',
      },
      error: null,
    });
  });

  it('returns 400 when topic is missing', async () => {
    const res = await POST(postReq({}, 'Bearer user1'));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Topic is required/i);
  });

  it('returns 401 when no authorization header', async () => {
    const res = await POST(postReq({ topic: 'Polity' }));
    expect(res.status).toBe(401);
  });

  it('queues video generation and returns queue data', async () => {
    const res = await POST(postReq({ topic: 'Polity', subject: 'GS2' }, 'Bearer user1'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.queueId).toBe('q1');
    expect(json.video.topic).toBe('Polity');
    expect(json.video.duration).toBe(60);
  });

  it('returns 500 when queue insert fails', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'db fail' } });

    const res = await POST(postReq({ topic: 'Polity' }, 'Bearer user1'));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/Failed to queue/i);
  });
});
