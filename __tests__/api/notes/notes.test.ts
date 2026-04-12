/** @jest-environment node */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/notes/route';

// --- Mocks ---

const mockGetUserNotes = jest.fn();
const mockSearchNotes = jest.fn();
const mockGetBookmarkedNotes = jest.fn();

jest.mock('@/lib/services/notes-service', () => ({
  getUserNotes: (...args: any[]) => mockGetUserNotes(...args),
  searchNotes: (...args: any[]) => mockSearchNotes(...args),
  getBookmarkedNotes: (...args: any[]) => mockGetBookmarkedNotes(...args),
}));

const mockRequireUser = jest.fn();

jest.mock('@/lib/auth/auth-config', () => ({
  requireUser: (...args: any[]) => mockRequireUser(...args),
  requireSession: jest.fn(),
  getCurrentUser: jest.fn(),
}));

// --- Helpers ---

function makeRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

// --- Tests ---

describe('GET /api/notes', () => {
  const fakeUser = { id: 'user-123', email: 'test@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireUser.mockResolvedValue(fakeUser);
  });

  it('returns all notes for the authenticated user', async () => {
    const notes = [
      { id: '1', topic: 'Polity', content: 'Test content' },
      { id: '2', topic: 'History', content: 'More content' },
    ];
    mockGetUserNotes.mockResolvedValue(notes);

    const res = await GET(makeRequest('/api/notes'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.notes).toEqual(notes);
    expect(body.count).toBe(2);
    expect(mockGetUserNotes).toHaveBeenCalledWith('user-123');
  });

  it('searches notes when search param is provided', async () => {
    const notes = [{ id: '1', topic: 'Polity', content: 'Constitution' }];
    mockSearchNotes.mockResolvedValue(notes);

    const res = await GET(makeRequest('/api/notes?search=constitution'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.notes).toEqual(notes);
    expect(mockSearchNotes).toHaveBeenCalledWith('user-123', 'constitution');
    expect(mockGetUserNotes).not.toHaveBeenCalled();
  });

  it('returns bookmarked notes when bookmarked=true', async () => {
    const notes = [{ id: '3', topic: 'Economy', bookmarked: true }];
    mockGetBookmarkedNotes.mockResolvedValue(notes);

    const res = await GET(makeRequest('/api/notes?bookmarked=true'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.notes).toEqual(notes);
    expect(mockGetBookmarkedNotes).toHaveBeenCalledWith('user-123');
  });

  it('returns 401 when user is not authenticated', async () => {
    mockRequireUser.mockRejectedValue(new Error('Authentication required'));

    const res = await GET(makeRequest('/api/notes'));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Please login to view notes');
  });

  it('returns 500 on unexpected errors', async () => {
    mockRequireUser.mockResolvedValue(fakeUser);
    mockGetUserNotes.mockRejectedValue(new Error('DB connection failed'));

    const res = await GET(makeRequest('/api/notes'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to fetch notes');
  });

  it('ignores empty search param and returns all notes', async () => {
    const notes = [{ id: '1', topic: 'Polity' }];
    mockGetUserNotes.mockResolvedValue(notes);

    const res = await GET(makeRequest('/api/notes?search=  '));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockGetUserNotes).toHaveBeenCalledWith('user-123');
    expect(mockSearchNotes).not.toHaveBeenCalled();
  });
});
