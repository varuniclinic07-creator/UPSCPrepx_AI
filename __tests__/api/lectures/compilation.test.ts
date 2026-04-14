/** @jest-environment node */

import { compileVideo } from '@/workers/compilation-worker';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockChapters = [
  {
    id: 'ch1',
    job_id: 'job-1',
    chapter_number: 1,
    title: 'Chapter 1',
    duration: 5,
    audio_url: '/tmp/audio_1.mp3',
    image_urls: ['https://example.com/img1.png'],
    content: {},
  },
  {
    id: 'ch2',
    job_id: 'job-1',
    chapter_number: 2,
    title: 'Chapter 2',
    duration: 5,
    audio_url: null,
    image_urls: [],
    content: {},
  },
];

const mockUpload = jest.fn().mockResolvedValue({ error: null });
const mockGetPublicUrl = jest.fn().mockReturnValue({
  data: { publicUrl: 'https://storage.example.com/lectures/job-1/final.mp4' },
});

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table: string) => {
      if (table === 'lecture_chapters') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockChapters }),
            }),
          }),
        };
      }
      if (table === 'lecture_jobs') {
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      return {};
    }),
    storage: {
      from: jest.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      })),
    },
  })),
}));

jest.mock('child_process', () => ({
  exec: jest.fn((_cmd: string, callback: any) => callback(null, { stdout: '', stderr: '' })),
}));

jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue(Buffer.from('video-bytes')),
  rm: jest.fn().mockResolvedValue(undefined),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('compileVideo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a public URL on success', async () => {
    const url = await compileVideo('job-1');
    expect(url).toBe('https://storage.example.com/lectures/job-1/final.mp4');
  });

  it('uploads the compiled video to storage', async () => {
    await compileVideo('job-1');
    expect(mockUpload).toHaveBeenCalledWith(
      'lectures/job-1/final.mp4',
      expect.any(Buffer),
      expect.objectContaining({ contentType: 'video/mp4' })
    );
  });

  it('creates temp directory and writes concat file', async () => {
    const fsp = require('fs/promises');
    await compileVideo('job-1');
    expect(fsp.mkdir).toHaveBeenCalled();
    expect(fsp.writeFile).toHaveBeenCalled();
  });

  it('throws when no chapters are found', async () => {
    // Override chapter query to return empty
    const { createClient } = require('@supabase/supabase-js');
    createClient.mockReturnValueOnce({
      from: jest.fn((table: string) => {
        if (table === 'lecture_chapters') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({ data: [] }),
              }),
            }),
          };
        }
        if (table === 'lecture_jobs') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        return {};
      }),
      storage: {
        from: jest.fn(() => ({
          upload: mockUpload,
          getPublicUrl: mockGetPublicUrl,
        })),
      },
    });

    await expect(compileVideo('job-1')).rejects.toThrow('No chapters found');
  });
});
