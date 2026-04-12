/** @jest-environment node */

import { GET } from '@/app/api/mind-maps/route';

// --- Mocks ---

const mockRequireSession = jest.fn();

jest.mock('@/lib/auth/auth-config', () => ({
  requireSession: (...args: any[]) => mockRequireSession(...args),
  requireUser: jest.fn(),
  getCurrentUser: jest.fn(),
}));

const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    from: () => ({
      select: (...args: any[]) => {
        mockSelect(...args);
        return {
          eq: (...eqArgs: any[]) => {
            mockEq(...eqArgs);
            return {
              order: (...orderArgs: any[]) => {
                mockOrder(...orderArgs);
                return Promise.resolve({
                  data: mockNotesData,
                  error: mockNotesError,
                });
              },
            };
          },
        };
      },
    }),
  }),
  createServerSupabaseClient: jest.fn(),
}));

// Mutable test data
let mockNotesData: any[] | null = [];
let mockNotesError: any = null;

// --- Tests ---

describe('GET /api/mind-maps', () => {
  const fakeSession = { user: { id: 'user-789' } };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireSession.mockResolvedValue(fakeSession);
    mockNotesData = [];
    mockNotesError = null;
  });

  it('returns mind maps filtered from notes', async () => {
    mockNotesData = [
      {
        id: 'mm-1',
        topic: 'Indian Constitution',
        subject: 'GS2',
        content: { type: 'mind_map', nodes: [{ id: 'root', label: 'Constitution' }] },
        created_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 'note-1',
        topic: 'Regular Note',
        subject: 'GS1',
        content: { type: 'text', body: 'Some text' },
        created_at: '2026-01-02T00:00:00Z',
      },
    ];

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.mindMaps).toHaveLength(1);
    expect(body.mindMaps[0].id).toBe('mm-1');
    expect(body.mindMaps[0].topic).toBe('Indian Constitution');
    expect(body.mindMaps[0].nodes).toEqual([{ id: 'root', label: 'Constitution' }]);
  });

  it('returns empty array when no mind maps exist', async () => {
    mockNotesData = [];

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.mindMaps).toEqual([]);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockRequireSession.mockRejectedValue(new Error('Unauthorized'));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 500 on database error', async () => {
    mockNotesError = { message: 'DB connection failed' };
    mockNotesData = null;

    // The route throws on error, so we need the order mock to reject
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
  });
});
