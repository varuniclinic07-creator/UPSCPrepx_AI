/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';

const mockInsert = jest.fn();
const mockSelect = jest.fn();
const mockSingle = jest.fn();
const mockFrom = jest.fn();
const mockCreateClient = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: (...args: any[]) => mockCreateClient(...args),
}));

const mockRequireSession = jest.fn();
jest.mock('@/lib/auth/session', () => ({
  requireSession: () => mockRequireSession(),
}));

const mockCheckAccess = jest.fn();
jest.mock('@/lib/auth/check-access', () => ({
  checkAccess: (...args: any[]) => mockCheckAccess(...args),
}));

const mockCheckRateLimit = jest.fn();
jest.mock('@/lib/security/rate-limiter', () => ({
  checkRateLimit: (...args: any[]) => mockCheckRateLimit(...args),
  RATE_LIMITS: { notesGen: { windowMs: 60000, maxRequests: 5 } },
}));

const mockNormalizeUPSCInput = jest.fn();
jest.mock('@/lib/agents/normalizer-agent', () => ({
  normalizeUPSCInput: (...args: any[]) => mockNormalizeUPSCInput(...args),
}));

const mockGenerateNotes = jest.fn();
jest.mock('@/lib/notes/agentic-notes-generator', () => ({
  getAgenticNotesGenerator: () => ({
    generateNotes: (...args: any[]) => mockGenerateNotes(...args),
  }),
}));

import { POST } from '@/app/api/notes/generate/route';

function makeRequest(body: Record<string, any>): NextRequest {
  return new NextRequest('http://localhost/api/notes/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/notes/generate', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';

    mockRequireSession.mockResolvedValue({ id: 'user-1' });
    mockCheckRateLimit.mockResolvedValue({ success: true });
    mockCheckAccess.mockResolvedValue({ allowed: true });
    mockNormalizeUPSCInput.mockResolvedValue({ subject: 'GS2' });
    mockGenerateNotes.mockResolvedValue({
      id: 'note-1',
      topic: 'Fundamental Rights',
      subject: 'GS2',
      content: '# Fundamental Rights',
      contentHtml: '<h1>Fundamental Rights</h1>',
      wordCount: 250,
      brevityLevel: '250',
      sources: [],
      agenticSystemsUsed: ['web-search'],
      aiProviderUsed: 'groq',
      hasDiagrams: false,
      hasVideoSummary: false,
      processingTimeMs: 100,
      createdAt: new Date(),
    });

    mockSingle.mockResolvedValue({ data: { id: 'saved-note-1' }, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockFrom.mockReturnValue({ insert: mockInsert });
    mockCreateClient.mockReturnValue({ from: mockFrom });
  });

  it('uses the service role key for server-side note persistence', async () => {
    const response = await POST(
      makeRequest({
        topic: 'Fundamental Rights',
        brevityLevel: '250',
      })
    );

    expect(response.status).toBe(200);
    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'service-role-key'
    );
  });
});
