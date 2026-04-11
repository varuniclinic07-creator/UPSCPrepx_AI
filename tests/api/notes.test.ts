/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/notes/route';

const mockUser = { id: 'user-123' };
const mockGetUserNotes = jest.fn();
const mockSearchNotes = jest.fn();
const mockGetBookmarkedNotes = jest.fn();

jest.mock('@/lib/auth/auth-config', () => ({
  requireUser: jest.fn(() => Promise.resolve(mockUser)),
}));

jest.mock('@/lib/services/notes-service', () => ({
  getUserNotes: (...args: any[]) => mockGetUserNotes(...args),
  searchNotes: (...args: any[]) => mockSearchNotes(...args),
  getBookmarkedNotes: (...args: any[]) => mockGetBookmarkedNotes(...args),
}));

beforeEach(() => jest.clearAllMocks());

describe('GET /api/notes', () => {
  it('returns all notes for user', async () => {
    mockGetUserNotes.mockResolvedValue([{ id: '1', title: 'Note 1' }]);
    const req = new NextRequest('http://localhost/api/notes');
    const res = await GET(req);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.notes).toHaveLength(1);
    expect(data.count).toBe(1);
    expect(mockGetUserNotes).toHaveBeenCalledWith('user-123');
  });

  it('searches notes when search param provided', async () => {
    mockSearchNotes.mockResolvedValue([{ id: '2', title: 'Found' }]);
    const req = new NextRequest('http://localhost/api/notes?search=polity');
    const res = await GET(req);
    const data = await res.json();
    expect(data.notes).toHaveLength(1);
    expect(mockSearchNotes).toHaveBeenCalledWith('user-123', 'polity');
  });

  it('returns bookmarked notes when bookmarked=true', async () => {
    mockGetBookmarkedNotes.mockResolvedValue([{ id: '3', title: 'Bookmarked' }]);
    const req = new NextRequest('http://localhost/api/notes?bookmarked=true');
    const res = await GET(req);
    const data = await res.json();
    expect(mockGetBookmarkedNotes).toHaveBeenCalledWith('user-123');
  });

  it('returns 401 when not authenticated', async () => {
    const { requireUser } = require('@/lib/auth/auth-config');
    requireUser.mockRejectedValueOnce(new Error('Authentication required'));
    const req = new NextRequest('http://localhost/api/notes');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});
