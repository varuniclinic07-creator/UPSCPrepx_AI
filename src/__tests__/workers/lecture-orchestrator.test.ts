/**
 * @jest-environment node
 */

const mockGenerateOutline = jest.fn();
const mockGenerateChapterScript = jest.fn();
const mockGenerateVisuals = jest.fn();
const mockGenerateLongTTS = jest.fn();
const mockCompilationAdd = jest.fn();
const mockCreateClient = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));

jest.mock('@/lib/lecture-generator/outline-service', () => ({
  generateOutline: (...args: unknown[]) => mockGenerateOutline(...args),
}));

jest.mock('@/lib/lecture-generator/script-service', () => ({
  generateChapterScript: (...args: unknown[]) => mockGenerateChapterScript(...args),
}));

jest.mock('@/lib/lecture-generator/visual-service', () => ({
  generateVisuals: (...args: unknown[]) => mockGenerateVisuals(...args),
}));

jest.mock('@/lib/lecture-generator/tts-service', () => ({
  generateLongTTS: (...args: unknown[]) => mockGenerateLongTTS(...args),
}));

jest.mock('@/lib/queues/lecture-queue', () => ({
  compilationQueue: {
    get: () => ({
      add: (...args: unknown[]) => mockCompilationAdd(...args),
    }),
  },
}));

describe('lecture orchestrator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
  });

  it('stores chapter script and visual prompts in real lecture_chapters columns', async () => {
    const lectureJob = {
      id: 'lecture-1',
      topic: 'Fundamental Rights',
      subject_slug: 'indian-polity',
      target_duration: 180,
    };

    const chapterRows: Array<Record<string, unknown>> = [];
    const lectureJobUpdates: Array<Record<string, unknown>> = [];

    const supabase = {
      from: jest.fn((table: string) => {
        if (table === 'lecture_jobs') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                returns: jest.fn(() => ({
                  single: jest.fn(async () => ({ data: lectureJob })),
                })),
              })),
            })),
            update: jest.fn((payload: Record<string, unknown>) => {
              lectureJobUpdates.push(payload);
              return {
                eq: jest.fn(async () => ({ error: null })),
              };
            }),
          };
        }

        if (table === 'lecture_chapters') {
          return {
            insert: jest.fn(async (payload: Record<string, unknown>) => {
              chapterRows.push({
                id: `chapter-${chapterRows.length + 1}`,
                ...payload,
              });
              return { error: null };
            }),
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                order: jest.fn(() => ({
                  returns: jest.fn(async () => ({ data: chapterRows })),
                })),
              })),
            })),
            update: jest.fn((payload: Record<string, unknown>) => ({
              eq: jest.fn(async (columnName: string, columnValue: string) => {
                const chapter = chapterRows.find((row) => row[columnName] === columnValue);
                if (chapter) {
                  Object.assign(chapter, payload);
                }
                return { error: null };
              }),
            })),
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    };

    mockCreateClient.mockReturnValue(supabase);
    mockGenerateOutline.mockResolvedValue({
      totalChapters: 1,
      chapters: [
        {
          number: 1,
          title: 'Meaning and Need',
          subtopics: ['definition'],
          keyPoints: ['basic idea'],
          duration: 12,
        },
      ],
    });
    mockGenerateChapterScript.mockResolvedValue({
      script: 'Fundamental Rights protect liberty.',
      visualCues: [{ type: 'diagram', description: 'Articles 12 to 35 map' }],
    });
    mockGenerateVisuals.mockResolvedValue([
      { url: 'https://cdn.example.com/rights.png', type: 'diagram', description: 'Articles 12 to 35 map' },
    ]);
    mockGenerateLongTTS.mockResolvedValue(['/tmp/chapter-1.mp3']);

    const { orchestrateLecture } = await import('@/workers/lecture-orchestrator');
    await orchestrateLecture('lecture-1');

    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'service-role-key'
    );

    expect(chapterRows).toHaveLength(1);
    expect(chapterRows[0]).toMatchObject({
      job_id: 'lecture-1',
      chapter_number: 1,
      title: 'Meaning and Need',
      subtopics: ['definition'],
      script: 'Fundamental Rights protect liberty.',
      visual_prompts: [{ type: 'diagram', description: 'Articles 12 to 35 map' }],
      status: 'audio_ready',
      image_urls: ['https://cdn.example.com/rights.png'],
      audio_url: '/tmp/chapter-1.mp3',
    });
    expect(chapterRows[0]).not.toHaveProperty('content');

    expect(mockCompilationAdd).toHaveBeenCalledWith('compile-lecture', { lectureJobId: 'lecture-1' });
    expect(lectureJobUpdates.some((payload) => payload.status === 'ready')).toBe(false);
  });
});
