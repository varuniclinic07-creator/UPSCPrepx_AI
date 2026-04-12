/** @jest-environment node */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';

// --- Mocks ---

const mockFrom = jest.fn();
const mockSupabase = {
  from: mockFrom,
};

const mockRequireUser = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => mockSupabase),
  createServerSupabaseClient: jest.fn(async () => mockSupabase),
}));

jest.mock('@/lib/auth/auth-config', () => ({
  requireUser: (...args: unknown[]) => mockRequireUser(...args),
  getCurrentUser: jest.fn(),
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
  preferences: {
    theme: 'light',
    language: 'en',
    notifications: { email: true, push: false, dailyDigest: true },
  },
};

function chainMock(returnValue: { data?: unknown; error?: unknown }) {
  const chain = {
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue(returnValue as never),
  };
  return chain;
}

// --- Tests ---

describe('GET /api/user/preferences', () => {
  let GET: typeof import('@/app/api/user/preferences/route').GET;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await import('@/app/api/user/preferences/route');
    GET = mod.GET;
  });

  it('should return user preferences when authenticated', async () => {
    mockRequireUser.mockResolvedValue(mockUser as never);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.preferences.theme).toBe('light');
    expect(json.preferences.language).toBe('en');
  });

  it('should return default preferences when user has none', async () => {
    mockRequireUser.mockResolvedValue({ ...mockUser, preferences: null } as never);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    // Default preferences should have theme: 'system'
    expect(json.preferences.theme).toBe('system');
    expect(json.preferences.language).toBe('en');
  });

  it('should return 401 when not authenticated', async () => {
    mockRequireUser.mockRejectedValue(new Error('Authentication required') as never);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe('Please login to view preferences');
  });

  it('should return 500 on unexpected error', async () => {
    mockRequireUser.mockRejectedValue(new Error('Something broke') as never);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Failed to fetch preferences');
  });
});

describe('PATCH /api/user/preferences', () => {
  let PATCH: typeof import('@/app/api/user/preferences/route').PATCH;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await import('@/app/api/user/preferences/route');
    PATCH = mod.PATCH;
  });

  it('should update preferences successfully', async () => {
    mockRequireUser.mockResolvedValue(mockUser as never);

    const updateChain = chainMock({ data: null, error: null });
    mockFrom.mockReturnValue(updateChain);

    const req = new NextRequest('http://localhost:3000/api/user/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ theme: 'dark' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PATCH(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.preferences.theme).toBe('dark');
    expect(json.message).toBe('Preferences updated successfully');
  });

  it('should merge nested notification preferences', async () => {
    mockRequireUser.mockResolvedValue(mockUser as never);

    const updateChain = chainMock({ data: null, error: null });
    mockFrom.mockReturnValue(updateChain);

    const req = new NextRequest('http://localhost:3000/api/user/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ notifications: { push: true } }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PATCH(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.preferences.notifications.push).toBe(true);
    // Existing notification prefs should be preserved
    expect(json.preferences.notifications.email).toBe(true);
    expect(json.preferences.notifications.dailyDigest).toBe(true);
  });

  it('should return 400 for invalid theme value', async () => {
    mockRequireUser.mockResolvedValue(mockUser as never);

    const req = new NextRequest('http://localhost:3000/api/user/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ theme: 'neon' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PATCH(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Invalid theme value');
  });

  it('should return 400 for invalid language value', async () => {
    mockRequireUser.mockResolvedValue(mockUser as never);

    const req = new NextRequest('http://localhost:3000/api/user/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ language: 'fr' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PATCH(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Invalid language value');
  });

  it('should return 401 when not authenticated', async () => {
    mockRequireUser.mockRejectedValue(new Error('Authentication required') as never);

    const req = new NextRequest('http://localhost:3000/api/user/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ theme: 'dark' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PATCH(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe('Please login to update preferences');
  });

  it('should return 500 when database update fails', async () => {
    mockRequireUser.mockResolvedValue(mockUser as never);

    const updateChain = chainMock({ data: null, error: { message: 'DB write error' } });
    mockFrom.mockReturnValue(updateChain);

    const req = new NextRequest('http://localhost:3000/api/user/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ theme: 'dark' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PATCH(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Failed to update preferences');
  });
});
