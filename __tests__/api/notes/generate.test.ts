/** @jest-environment node */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/notes/generate/route';

// --- Mocks ---

const mockRequireSession = jest.fn();

jest.mock('@/lib/auth/session', () => ({
  requireSession: (...args: any[]) => mockRequireSession(...args),
}));

const mockCheckRateLimit = jest.fn();

jest.mock('@/lib/security/rate-limiter', () => ({
  checkRateLimit: (...args: any[]) => mockCheckRateLimit(...args),
  RATE_LIMITS: { notesGen: { windowMs: 60000, max: 5 } },
}));

const mockCheckAccess = jest.fn();

jest.mock('@/lib/auth/check-access', () => ({
  checkAccess: (...args: any[]) => mockCheckAccess(...args),
}));

const mockGenerateNotes = jest.fn();

jest.mock('@/lib/notes/agentic-notes-generator', () => ({
  getAgenticNotesGenerator: () => ({
    generateNotes: mockGenerateNotes,
  }),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: { id: 'note-saved-1' }, error: null }),
        }),
      }),
    }),
  }),
}));

// --- Helpers ---

function makePostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(new URL('/api/notes/generate', 'http://localhost:3000'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// --- Tests ---

describe('POST /api/notes/generate', () => {
  const fakeSession = { id: 'user-456' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireSession.mockResolvedValue(fakeSession);
    mockCheckRateLimit.mockResolvedValue({ success: true });
    mockCheckAccess.mockResolvedValue({ allowed: true });
  });

  it('generates notes successfully with a valid topic', async () => {
    const generated = {
      id: 'gen-1',
      topic: 'Indian Constitution',
      subject: 'GS2',
      content: '# Indian Constitution\nKey points...',
      contentHtml: '<h1>Indian Constitution</h1>',
      wordCount: 250,
      brevityLevel: '250',
      sources: [{ name: 'Laxmikanth', type: 'book' }],
      agenticSystemsUsed: ['research', 'synthesis'],
      aiProviderUsed: 'groq',
      processingTimeMs: 1200,
      hasDiagrams: false,
      hasVideoSummary: false,
    };
    mockGenerateNotes.mockResolvedValue(generated);

    const res = await POST(makePostRequest({
      topic: 'Indian Constitution',
      brevityLevel: '250',
      subject: 'GS2',
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.note.topic).toBe('Indian Constitution');
    expect(body.note.wordCount).toBe(250);
    expect(body.note.aiProviderUsed).toBe('groq');
  });

  it('returns 400 when topic is missing', async () => {
    const res = await POST(makePostRequest({
      brevityLevel: '250',
    }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Topic and brevity level are required');
  });

  it('returns 400 when brevityLevel is missing', async () => {
    const res = await POST(makePostRequest({
      topic: 'Indian Constitution',
    }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Topic and brevity level are required');
  });

  it('returns 401 when user is not authenticated', async () => {
    mockRequireSession.mockRejectedValue(new Error('Unauthorized'));

    const res = await POST(makePostRequest({
      topic: 'Indian Constitution',
      brevityLevel: '250',
    }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Authentication required');
  });

  it('returns 429 when rate limit is exceeded', async () => {
    mockCheckRateLimit.mockResolvedValue({ success: false, retryAfter: 30 });

    const res = await POST(makePostRequest({
      topic: 'Indian Constitution',
      brevityLevel: '250',
    }));
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Rate limit exceeded');
  });

  it('returns 403 when access is denied', async () => {
    mockCheckAccess.mockResolvedValue({ allowed: false, reason: 'Daily limit reached' });

    const res = await POST(makePostRequest({
      topic: 'Indian Constitution',
      brevityLevel: '250',
    }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Daily limit reached');
  });
});
