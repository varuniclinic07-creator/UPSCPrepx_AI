/** @jest-environment node */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/lectures/[id]/status/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockRequireSession = jest.fn();

jest.mock('@/lib/auth/session', () => ({
  requireSession: (...args: unknown[]) => mockRequireSession(...args),
}));

const mockSingle = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: (...args: unknown[]) => mockSingle(...args),
        })),
      })),
    })),
  }),
}));

const mockGetLectureJobStatus = jest.fn();

jest.mock('@/lib/queues/lecture-queue', () => ({
  getLectureJobStatus: (...args: unknown[]) => mockGetLectureJobStatus(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function getReq(id: string) {
  return new NextRequest(new URL(`http://localhost/api/lectures/${id}/status`));
}

const fakeJob = {
  id: 'lec-1',
  user_id: 'u1',
  topic: 'Polity',
  subject_slug: 'GS2',
  status: 'processing',
  current_phase: 'outline',
  current_chapter: 1,
  total_chapters: 5,
  progress_percent: 20,
  outline: null,
  video_url: null,
  notes_pdf_url: null,
  error_message: null,
  started_at: '2024-01-01T00:00:00Z',
  estimated_completion: '2024-01-01T00:10:00Z',
  completed_at: null,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/lectures/[id]/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireSession.mockResolvedValue({ user: { id: 'u1' } });
    mockSingle.mockResolvedValue({ data: fakeJob, error: null });
    mockGetLectureJobStatus.mockResolvedValue({ position: 0, state: 'active' });
  });

  it('returns 401 when session is missing', async () => {
    mockRequireSession.mockRejectedValueOnce(Object.assign(new Error('Unauthorized'), { message: 'Unauthorized' }));

    const res = await GET(getReq('lec-1'), makeParams('lec-1'));
    expect(res.status).toBe(401);
  });

  it('returns 404 when lecture is not found', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

    const res = await GET(getReq('lec-1'), makeParams('lec-1'));
    expect(res.status).toBe(404);
  });

  it('returns 403 when user does not own the lecture', async () => {
    mockSingle.mockResolvedValueOnce({ data: { ...fakeJob, user_id: 'other-user' }, error: null });

    const res = await GET(getReq('lec-1'), makeParams('lec-1'));
    expect(res.status).toBe(403);
  });

  it('returns status with queue info for processing lecture', async () => {
    const res = await GET(getReq('lec-1'), makeParams('lec-1'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id).toBe('lec-1');
    expect(json.status).toBe('processing');
    expect(json.topic).toBe('Polity');
    expect(json.queueStatus).toEqual({ position: 0, state: 'active' });
    expect(mockGetLectureJobStatus).toHaveBeenCalledWith('lec-1');
  });

  it('does not fetch queue status for ready lectures', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { ...fakeJob, status: 'ready', video_url: 'https://example.com/video.mp4' },
      error: null,
    });

    const res = await GET(getReq('lec-1'), makeParams('lec-1'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('ready');
    expect(json.queueStatus).toBeNull();
    expect(mockGetLectureJobStatus).not.toHaveBeenCalled();
  });

  it('does not fetch queue status for failed lectures', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { ...fakeJob, status: 'failed', error_message: 'Generation failed' },
      error: null,
    });

    const res = await GET(getReq('lec-1'), makeParams('lec-1'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('failed');
    expect(json.queueStatus).toBeNull();
    expect(mockGetLectureJobStatus).not.toHaveBeenCalled();
  });

  it('returns 500 on unexpected error', async () => {
    mockRequireSession.mockRejectedValueOnce(new Error('crash'));

    const res = await GET(getReq('lec-1'), makeParams('lec-1'));
    expect(res.status).toBe(500);
  });
});
