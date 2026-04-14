/** @jest-environment node */

import { orchestrateLecture } from '@/workers/lecture-orchestrator';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockSingle = jest.fn();
const mockReturns = jest.fn();

const mockChapterRows = [
  {
    id: 'ch1',
    job_id: 'job-1',
    chapter_number: 1,
    title: 'Chapter 1',
    duration: 5,
    content: { script: 'Hello world', visual_prompts: ['diagram of polity'] },
    status: 'script_ready',
    image_urls: [],
    audio_url: null,
  },
];

function buildChain() {
  const chain: any = {};
  chain.select = jest.fn().mockReturnValue(chain);
  chain.insert = jest.fn().mockReturnValue(chain);
  chain.update = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.order = jest.fn().mockReturnValue(chain);
  chain.returns = jest.fn().mockReturnValue(chain);
  chain.single = jest.fn();
  return chain;
}

let fromCalls = 0;
const jobChain = buildChain();
const chapterChain = buildChain();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    from: jest.fn((table: string) => {
      if (table === 'lecture_jobs') return jobChain;
      if (table === 'lecture_chapters') return chapterChain;
      return buildChain();
    }),
  }),
}));

jest.mock('@/lib/lecture-generator/outline-service', () => ({
  generateOutline: jest.fn().mockResolvedValue({
    totalChapters: 1,
    chapters: [
      { number: 1, title: 'Polity Basics', subtopics: ['Constitution'], keyPoints: ['Key 1'], duration: 5 },
    ],
  }),
}));

jest.mock('@/lib/lecture-generator/script-service', () => ({
  generateChapterScript: jest.fn().mockResolvedValue({
    script: 'Welcome to this lecture on polity.',
    visualCues: ['parliament diagram'],
  }),
}));

jest.mock('@/lib/lecture-generator/visual-service', () => ({
  generateVisuals: jest.fn().mockResolvedValue([{ url: 'https://example.com/img1.png' }]),
}));

jest.mock('@/lib/lecture-generator/tts-service', () => ({
  generateLongTTS: jest.fn().mockResolvedValue(['/tmp/audio_1.mp3']),
}));

jest.mock('@/lib/queues/lecture-queue', () => ({
  compilationQueue: {
    get: jest.fn().mockReturnValue({
      add: jest.fn().mockResolvedValue({ id: 'compile-1' }),
    }),
  },
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('orchestrateLecture', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // job fetch
    jobChain.single.mockResolvedValue({
      data: {
        id: 'job-1',
        topic: 'Polity',
        subject_slug: 'gs2',
        target_duration: 180,
        status: 'queued',
      },
    });

    // chapter fetch after script phase
    chapterChain.single = jest.fn();
    chapterChain.order.mockReturnValue({
      returns: jest.fn().mockResolvedValue({ data: mockChapterRows }),
    });

    // update calls return successfully
    jobChain.eq.mockResolvedValue({ error: null });
    chapterChain.eq.mockResolvedValue({ error: null });
    chapterChain.insert.mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });
  });

  it('calls all generation phases in order', async () => {
    const { generateOutline } = require('@/lib/lecture-generator/outline-service');
    const { generateChapterScript } = require('@/lib/lecture-generator/script-service');
    const { generateVisuals } = require('@/lib/lecture-generator/visual-service');
    const { generateLongTTS } = require('@/lib/lecture-generator/tts-service');

    await orchestrateLecture('job-1');

    expect(generateOutline).toHaveBeenCalledWith('Polity', 'gs2', 180);
    expect(generateChapterScript).toHaveBeenCalledTimes(1);
    expect(generateVisuals).toHaveBeenCalledTimes(1);
    expect(generateLongTTS).toHaveBeenCalledTimes(1);
  });

  it('queues compilation after all phases', async () => {
    const { compilationQueue } = require('@/lib/queues/lecture-queue');

    await orchestrateLecture('job-1');

    const queue = compilationQueue.get();
    expect(queue.add).toHaveBeenCalledWith('compile-lecture', { lectureJobId: 'job-1' });
  });

  it('throws and updates status on failure', async () => {
    jobChain.single.mockResolvedValue({ data: null });

    await expect(orchestrateLecture('job-1')).rejects.toThrow('Job not found');
  });
});
