/** @jest-environment node */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/admin/users/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(() =>
    Promise.resolve({
      auth: { getSession: (...args: any[]) => mockGetSession(...args) },
    })
  ),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: (...args: any[]) => mockFrom(...args),
    auth: { admin: { updateUserById: (...args: any[]) => mockUpdateUserById(...args) } },
  })),
}));

const mockGetSession = jest.fn();
const mockUpdateUserById = jest.fn();

const mockUpsert = jest.fn().mockReturnThis();
const mockSelect = jest.fn().mockReturnThis();
const mockInsert = jest.fn().mockReturnThis();
const mockFrom = jest.fn(() => ({
  upsert: mockUpsert,
  select: mockSelect,
  insert: mockInsert,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildRequest(body: object): NextRequest {
  return new NextRequest(new URL('/api/admin/users', 'http://localhost:3000'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function mockAdminSession() {
  mockGetSession.mockResolvedValue({
    data: {
      session: {
        user: { user_metadata: { role: 'admin' }, app_metadata: {} },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/admin/users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFrom.mockReturnValue({
      upsert: mockUpsert,
      select: mockSelect,
      insert: mockInsert,
    });
    mockUpsert.mockReturnValue({ select: mockSelect });
    mockSelect.mockResolvedValue({ data: null, error: null });
    mockInsert.mockResolvedValue({ data: null, error: null });
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const res = await POST(buildRequest({ userId: 'u1', action: 'suspend' }));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 403 when user is not admin', async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: { user_metadata: { role: 'student' }, app_metadata: {} },
        },
      },
    });

    const res = await POST(buildRequest({ userId: 'u1', action: 'suspend' }));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe('Forbidden: admin role required');
  });

  it('returns 400 when required fields are missing', async () => {
    mockAdminSession();

    const res = await POST(buildRequest({ userId: '' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Missing required fields');
  });

  it('grants XP successfully', async () => {
    mockAdminSession();

    const res = await POST(buildRequest({ userId: 'u1', action: 'grant_xp', amount: 100 }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.message).toContain('Granted 100 XP');
    expect(mockFrom).toHaveBeenCalledWith('user_xp_stats');
  });

  it('suspends user successfully', async () => {
    mockAdminSession();
    mockUpdateUserById.mockResolvedValue({ error: null });
    mockInsert.mockResolvedValue({ data: null, error: null });

    const res = await POST(buildRequest({ userId: 'u1', action: 'suspend' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockUpdateUserById).toHaveBeenCalledWith('u1', expect.objectContaining({
      user_metadata: expect.objectContaining({ suspended: true }),
    }));
  });

  it('bans user successfully', async () => {
    mockAdminSession();
    mockUpdateUserById.mockResolvedValue({ error: null });
    mockInsert.mockResolvedValue({ data: null, error: null });

    const res = await POST(buildRequest({ userId: 'u1', action: 'ban' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockUpdateUserById).toHaveBeenCalledWith('u1', expect.objectContaining({
      user_metadata: expect.objectContaining({ banned: true }),
    }));
  });

  it('activates user successfully', async () => {
    mockAdminSession();
    mockUpdateUserById.mockResolvedValue({ error: null });
    mockInsert.mockResolvedValue({ data: null, error: null });

    const res = await POST(buildRequest({ userId: 'u1', action: 'activate' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockUpdateUserById).toHaveBeenCalledWith('u1', expect.objectContaining({
      user_metadata: expect.objectContaining({ suspended: false, banned: false }),
    }));
  });

  it('returns 500 when suspend/ban auth update fails', async () => {
    mockAdminSession();
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    mockUpdateUserById.mockResolvedValue({ error: { message: 'Auth error' } });

    const res = await POST(buildRequest({ userId: 'u1', action: 'suspend' }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Failed to update user status');
    consoleError.mockRestore();
  });

  it('returns 500 when activate auth update fails', async () => {
    mockAdminSession();
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    mockUpdateUserById.mockResolvedValue({ error: { message: 'Auth error' } });

    const res = await POST(buildRequest({ userId: 'u1', action: 'activate' }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Failed to activate user');
    consoleError.mockRestore();
  });

  it('returns 500 on unexpected error', async () => {
    mockAdminSession();
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    mockUpdateUserById.mockRejectedValue(new Error('Unexpected'));

    const res = await POST(buildRequest({ userId: 'u1', action: 'suspend' }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Internal Server Error');
    consoleError.mockRestore();
  });

  it('logs action to admin_logs audit trail', async () => {
    mockAdminSession();
    mockUpdateUserById.mockResolvedValue({ error: null });
    mockInsert.mockResolvedValue({ data: null, error: null });

    await POST(buildRequest({ userId: 'u1', action: 'suspend' }));

    expect(mockFrom).toHaveBeenCalledWith('admin_logs');
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      action: 'SUSPEND',
      target_id: 'u1',
      target_type: 'USER',
    }));
  });
});
