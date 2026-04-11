/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, PATCH, DELETE } from '@/app/api/notes/[id]/route';

const mockUser = { id: 'user-123' };
const mockGetNoteById = jest.fn();
const mockToggleBookmark = jest.fn();
const mockDeleteNote = jest.fn();

jest.mock('@/lib/auth/auth-config', () => ({
  requireUser: jest.fn(() => Promise.resolve(mockUser)),
}));

jest.mock('@/lib/services/notes-service', () => ({
  getNoteById: (...args: any[]) => mockGetNoteById(...args),
  toggleBookmark: (...args: any[]) => mockToggleBookmark(...args),
  deleteNote: (...args: any[]) => mockDeleteNote(...args),
}));

const makeParams = (id: string) => ({ params: { id } });

beforeEach(() => jest.clearAllMocks());

describe('GET /api/notes/[id]', () => {
  it('returns note by id', async () => {
    mockGetNoteById.mockResolvedValue({ id: 'note-1', title: 'Test Note' });
    const req = new NextRequest('http://localhost/api/notes/note-1');
    const res = await GET(req, makeParams('note-1') as any);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.note.title).toBe('Test Note');
  });

  it('returns 404 if note not found', async () => {
    mockGetNoteById.mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/notes/missing');
    const res = await GET(req, makeParams('missing') as any);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/notes/[id]', () => {
  it('toggles bookmark successfully', async () => {
    mockToggleBookmark.mockResolvedValue(true);
    const req = new NextRequest('http://localhost/api/notes/note-1', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'toggle_bookmark' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, makeParams('note-1') as any);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.isBookmarked).toBe(true);
  });

  it('returns 400 for invalid action', async () => {
    const req = new NextRequest('http://localhost/api/notes/note-1', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'invalid' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, makeParams('note-1') as any);
    expect(res.status).toBe(400);
  });

  it('returns 404 when note not found', async () => {
    mockToggleBookmark.mockRejectedValue(new Error('Note not found'));
    const req = new NextRequest('http://localhost/api/notes/missing', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'toggle_bookmark' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, makeParams('missing') as any);
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/notes/[id]', () => {
  it('deletes note successfully', async () => {
    mockDeleteNote.mockResolvedValue(undefined);
    const req = new NextRequest('http://localhost/api/notes/note-1');
    const res = await DELETE(req, makeParams('note-1') as any);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(mockDeleteNote).toHaveBeenCalledWith('note-1', 'user-123');
  });
});
