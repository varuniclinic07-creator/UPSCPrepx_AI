/** @jest-environment node */

import { NextRequest } from 'next/server';
import { GET, PATCH, DELETE } from '@/app/api/notes/[id]/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockRequireUser = jest.fn();

jest.mock('@/lib/auth/auth-config', () => ({
  requireUser: (...args: unknown[]) => mockRequireUser(...args),
}));

const mockGetNoteById = jest.fn();
const mockToggleBookmark = jest.fn();
const mockDeleteNote = jest.fn();

jest.mock('@/lib/services/notes-service', () => ({
  getNoteById: (...args: unknown[]) => mockGetNoteById(...args),
  toggleBookmark: (...args: unknown[]) => mockToggleBookmark(...args),
  deleteNote: (...args: unknown[]) => mockDeleteNote(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function getReq(id: string) {
  return new NextRequest(new URL(`http://localhost/api/notes/${id}`));
}

function patchReq(id: string, body: Record<string, unknown>) {
  return new NextRequest(new URL(`http://localhost/api/notes/${id}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function deleteReq(id: string) {
  return new NextRequest(new URL(`http://localhost/api/notes/${id}`), {
    method: 'DELETE',
  });
}

const fakeUser = { id: 'u1', email: 'test@example.com' };
const fakeNote = { id: 'note-1', title: 'Polity Notes', content: 'Details here' };

// ---------------------------------------------------------------------------
// Tests — GET
// ---------------------------------------------------------------------------

describe('GET /api/notes/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireUser.mockResolvedValue(fakeUser);
    mockGetNoteById.mockResolvedValue(fakeNote);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockRequireUser.mockRejectedValueOnce(new Error('Authentication required'));

    const res = await GET(getReq('note-1'), makeParams('note-1'));
    expect(res.status).toBe(401);
  });

  it('returns 404 when note is not found', async () => {
    mockGetNoteById.mockResolvedValueOnce(null);

    const res = await GET(getReq('note-1'), makeParams('note-1'));
    expect(res.status).toBe(404);
  });

  it('returns note on success', async () => {
    const res = await GET(getReq('note-1'), makeParams('note-1'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.note.id).toBe('note-1');
  });

  it('returns 500 on unexpected error', async () => {
    mockGetNoteById.mockRejectedValueOnce(new Error('db error'));

    const res = await GET(getReq('note-1'), makeParams('note-1'));
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// Tests — PATCH
// ---------------------------------------------------------------------------

describe('PATCH /api/notes/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireUser.mockResolvedValue(fakeUser);
    mockToggleBookmark.mockResolvedValue(true);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockRequireUser.mockRejectedValueOnce(new Error('Authentication required'));

    const res = await PATCH(patchReq('note-1', { action: 'toggle_bookmark' }), makeParams('note-1'));
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid action', async () => {
    const res = await PATCH(patchReq('note-1', { action: 'invalid' }), makeParams('note-1'));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Invalid action/i);
  });

  it('toggles bookmark on success (bookmarked)', async () => {
    mockToggleBookmark.mockResolvedValueOnce(true);

    const res = await PATCH(patchReq('note-1', { action: 'toggle_bookmark' }), makeParams('note-1'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.isBookmarked).toBe(true);
    expect(mockToggleBookmark).toHaveBeenCalledWith('note-1', 'u1');
  });

  it('toggles bookmark on success (unbookmarked)', async () => {
    mockToggleBookmark.mockResolvedValueOnce(false);

    const res = await PATCH(patchReq('note-1', { action: 'toggle_bookmark' }), makeParams('note-1'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.isBookmarked).toBe(false);
  });

  it('returns 404 when note is not found', async () => {
    mockToggleBookmark.mockRejectedValueOnce(new Error('Note not found'));

    const res = await PATCH(patchReq('note-1', { action: 'toggle_bookmark' }), makeParams('note-1'));
    expect(res.status).toBe(404);
  });

  it('returns 500 on unexpected error', async () => {
    mockToggleBookmark.mockRejectedValueOnce(new Error('db error'));

    const res = await PATCH(patchReq('note-1', { action: 'toggle_bookmark' }), makeParams('note-1'));
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// Tests — DELETE
// ---------------------------------------------------------------------------

describe('DELETE /api/notes/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireUser.mockResolvedValue(fakeUser);
    mockDeleteNote.mockResolvedValue(undefined);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockRequireUser.mockRejectedValueOnce(new Error('Authentication required'));

    const res = await DELETE(deleteReq('note-1'), makeParams('note-1'));
    expect(res.status).toBe(401);
  });

  it('deletes note on success', async () => {
    const res = await DELETE(deleteReq('note-1'), makeParams('note-1'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.message).toMatch(/deleted/i);
    expect(mockDeleteNote).toHaveBeenCalledWith('note-1', 'u1');
  });

  it('returns 500 on unexpected error', async () => {
    mockDeleteNote.mockRejectedValueOnce(new Error('db error'));

    const res = await DELETE(deleteReq('note-1'), makeParams('note-1'));
    expect(res.status).toBe(500);
  });
});
