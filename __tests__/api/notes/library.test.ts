/** @jest-environment node */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/notes/library/route';

// --- Mocks ---

const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockFrom = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (...args: any[]) => mockFrom(...args),
  }),
}));

// --- Helpers ---

function makeGetRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

function makePostRequest(body: Record<string, unknown>, headers?: Record<string, string>): NextRequest {
  return new NextRequest(new URL('/api/notes/library', 'http://localhost:3000'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

// --- Tests ---

describe('GET /api/notes/library', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns library notes with default pagination', async () => {
    const mockNotes = [
      {
        id: 'lib-1',
        title: 'Indian Constitution Overview',
        topic: 'Constitution',
        subject: 'GS2',
        brevity_level: 'comprehensive',
        word_count: 1500,
        views_count: 100,
        downloads_count: 50,
        likes_count: 25,
        is_premium: false,
        thumbnail_url: null,
        created_at: '2026-01-01T00:00:00Z',
        notes_tags: [{ tag: 'polity' }, { tag: 'constitution' }],
      },
    ];

    // Build the chainable query mock
    const chainable = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({
        data: mockNotes,
        error: null,
        count: 1,
      }),
    };
    mockFrom.mockReturnValue(chainable);

    const res = await GET(makeGetRequest('/api/notes/library'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.notes).toHaveLength(1);
    expect(body.notes[0].title).toBe('Indian Constitution Overview');
    expect(body.notes[0].tags).toEqual(['polity', 'constitution']);
    expect(body.total).toBe(1);
    expect(mockFrom).toHaveBeenCalledWith('notes_library');
  });

  it('applies subject filter', async () => {
    const chainable = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
    };
    mockFrom.mockReturnValue(chainable);

    await GET(makeGetRequest('/api/notes/library?subject=GS2'));

    // eq is called for is_published and subject
    expect(chainable.eq).toHaveBeenCalledWith('is_published', true);
    expect(chainable.eq).toHaveBeenCalledWith('subject', 'GS2');
  });

  it('returns 500 on database error', async () => {
    const chainable = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
        count: 0,
      }),
    };
    mockFrom.mockReturnValue(chainable);

    const res = await GET(makeGetRequest('/api/notes/library'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch notes');
  });
});

describe('POST /api/notes/library', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a library note when authorized', async () => {
    const insertedNote = {
      id: 'lib-new-1',
      title: 'New Note',
      topic: 'Economics',
      subject: 'GS3',
    };

    const chainable = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: insertedNote, error: null }),
    };
    mockFrom.mockReturnValue(chainable);

    const res = await POST(makePostRequest(
      {
        title: 'New Note',
        topic: 'Economics',
        subject: 'GS3',
        content_markdown: '# Economics\nKey concepts...',
      },
      { Authorization: 'Bearer admin-token-123' },
    ));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.note.id).toBe('lib-new-1');
  });

  it('returns 401 when no authorization header', async () => {
    const res = await POST(makePostRequest({
      title: 'New Note',
      topic: 'Economics',
      subject: 'GS3',
      content_markdown: '# Economics',
    }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await POST(makePostRequest(
      { title: 'New Note' },
      { Authorization: 'Bearer admin-token-123' },
    ));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Missing required field');
  });

  it('returns 500 on database insert error', async () => {
    const chainable = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      }),
    };
    mockFrom.mockReturnValue(chainable);

    const res = await POST(makePostRequest(
      {
        title: 'New Note',
        topic: 'Economics',
        subject: 'GS3',
        content_markdown: '# Economics',
      },
      { Authorization: 'Bearer admin-token-123' },
    ));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to create note');
  });
});
