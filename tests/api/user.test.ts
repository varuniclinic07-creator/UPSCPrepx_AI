/**
 * @jest-environment node
 */
import { GET, PATCH, DELETE } from '@/app/api/user/route';

const mockUser = { id: 'user-123', email: 'test@test.com', name: 'Test User' };

jest.mock('@/lib/auth/auth-config', () => ({
  getCurrentUser: jest.fn(() => Promise.resolve(mockUser)),
  requireUser: jest.fn(() => Promise.resolve(mockUser)),
  getSubscriptionDaysRemaining: jest.fn(() => 15),
}));

const mockSingle = jest.fn();
const mockSelectAfterUpdate = jest.fn(() => ({ single: mockSingle }));
const mockUpdateEq = jest.fn(() => ({ select: mockSelectAfterUpdate }));
const mockUpdate = jest.fn(() => ({ eq: mockUpdateEq }));
const mockDeleteEq = jest.fn();
const mockDeleteFn = jest.fn(() => ({ eq: mockDeleteEq }));
const mockSignOut = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    from: jest.fn(() => ({ update: mockUpdate, delete: mockDeleteFn })),
    auth: { signOut: mockSignOut },
  })),
}));

beforeEach(() => jest.clearAllMocks());

describe('GET /api/user', () => {
  it('returns user profile with subscription info', async () => {
    const res = await GET();
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.email).toBe('test@test.com');
    expect(data.user.subscriptionDaysRemaining).toBe(15);
    expect(data.user.isSubscriptionActive).toBe(true);
  });

  it('returns 401 when not authenticated', async () => {
    const { getCurrentUser } = require('@/lib/auth/auth-config');
    getCurrentUser.mockResolvedValueOnce(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/user', () => {
  it('returns 400 if name too short', async () => {
    const req = new Request('http://localhost/api/user', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'A' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  it('updates user profile successfully', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 'user-123', email: 'test@test.com', name: 'Updated', avatar_url: null, role: 'user', subscription_tier: 'free', subscription_ends_at: null, preferences: {} },
      error: null,
    });
    const req = new Request('http://localhost/api/user', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.name).toBe('Updated');
  });
});

describe('DELETE /api/user', () => {
  it('deletes account successfully', async () => {
    mockDeleteEq.mockResolvedValue({ error: null });
    mockSignOut.mockResolvedValue({});
    const res = await DELETE();
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('returns 500 on delete error', async () => {
    mockDeleteEq.mockResolvedValue({ error: { message: 'FK constraint' } });
    const res = await DELETE();
    expect(res.status).toBe(500);
  });
});
