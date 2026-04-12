/** @jest-environment node */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';

// --- Mocks ---

const mockFrom = jest.fn();
const mockSignOut = jest.fn().mockResolvedValue({} as never);
const mockSupabase = {
  from: mockFrom,
  auth: { signOut: mockSignOut },
};

const mockGetCurrentUser = jest.fn();
const mockRequireUser = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => mockSupabase),
  createServerSupabaseClient: jest.fn(async () => mockSupabase),
}));

jest.mock('@/lib/auth/auth-config', () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
  requireUser: (...args: unknown[]) => mockRequireUser(...args),
  getSubscriptionDaysRemaining: jest.fn(() => 14),
}));

// --- Helpers ---

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: null,
  role: 'user',
  subscriptionTier: 'trial',
  subscriptionEndsAt: new Date('2026-05-01'),
  preferences: { theme: 'system' },
};

function chainMock(returnValue: { data?: unknown; error?: unknown }) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(returnValue as never),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  };
  return chain;
}

// --- Tests ---

describe('GET /api/user', () => {
  let GET: typeof import('@/app/api/user/route').GET;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await import('@/app/api/user/route');
    GET = mod.GET;
  });

  it('should return user profile when authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(mockUser as never);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.user.email).toBe('test@example.com');
    expect(json.user.subscriptionDaysRemaining).toBe(14);
    expect(json.user.isSubscriptionActive).toBe(true);
  });

  it('should return 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null as never);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe('Not authenticated');
  });

  it('should return 500 when getCurrentUser throws', async () => {
    mockGetCurrentUser.mockRejectedValue(new Error('DB connection lost') as never);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Failed to fetch user profile');
  });
});

describe('PATCH /api/user', () => {
  let PATCH: typeof import('@/app/api/user/route').PATCH;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await import('@/app/api/user/route');
    PATCH = mod.PATCH;
  });

  it('should update user profile successfully', async () => {
    mockRequireUser.mockResolvedValue(mockUser as never);

    const updatedData = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Updated Name',
      avatar_url: null,
      role: 'user',
      subscription_tier: 'trial',
      subscription_ends_at: '2026-05-01',
      preferences: { theme: 'system' },
    };

    const updateChain = chainMock({ data: updatedData, error: null });
    mockFrom.mockReturnValue(updateChain);

    const req = new NextRequest('http://localhost:3000/api/user', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated Name' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PATCH(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.user.name).toBe('Updated Name');
    expect(json.message).toBe('Profile updated successfully');
  });

  it('should return 400 when name is too short', async () => {
    mockRequireUser.mockResolvedValue(mockUser as never);

    const req = new NextRequest('http://localhost:3000/api/user', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'A' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PATCH(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Name must be at least 2 characters');
  });

  it('should return 401 when not authenticated', async () => {
    mockRequireUser.mockRejectedValue(new Error('Authentication required') as never);

    const req = new NextRequest('http://localhost:3000/api/user', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'New Name' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PATCH(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe('Please login to update profile');
  });

  it('should return 500 when database update fails', async () => {
    mockRequireUser.mockResolvedValue(mockUser as never);

    const updateChain = chainMock({ data: null, error: { message: 'DB error' } });
    mockFrom.mockReturnValue(updateChain);

    const req = new NextRequest('http://localhost:3000/api/user', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated Name' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PATCH(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Failed to update profile');
  });
});

describe('DELETE /api/user', () => {
  let DELETE: typeof import('@/app/api/user/route').DELETE;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await import('@/app/api/user/route');
    DELETE = mod.DELETE;
  });

  it('should delete user account successfully', async () => {
    mockRequireUser.mockResolvedValue(mockUser as never);

    const deleteChain = chainMock({ data: null, error: null });
    mockFrom.mockReturnValue(deleteChain);

    const res = await DELETE();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.message).toBe('Account deleted successfully');
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('should return 401 when not authenticated', async () => {
    mockRequireUser.mockRejectedValue(new Error('Authentication required') as never);

    const res = await DELETE();
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe('Please login to delete account');
  });
});
