/**
 * Tests for GET/PUT /api/user/settings
 * @jest-environment node
 */

import { GET, PUT } from '@/app/api/user/settings/route';
import { NextRequest } from 'next/server';

// Mock data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  user_metadata: { name: 'Test User' },
};

const mockProfile = {
  name: 'Test User',
  email: 'test@example.com',
  preferences: { language: 'English', optionalSubject: 'History' },
};

// Mock Supabase
const mockGetUser = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockUpdate = jest.fn();
const mockUpdateUser = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn().mockResolvedValue({
    auth: {
      getUser: () => mockGetUser(),
      updateUser: (data: any) => mockUpdateUser(data),
    },
    from: () => ({
      select: (...args: any[]) => {
        mockSelect(...args);
        return {
          eq: (...eqArgs: any[]) => {
            mockEq(...eqArgs);
            return { single: () => mockSingle() };
          },
        };
      },
      update: (data: any) => {
        mockUpdate(data);
        return {
          eq: () => mockEq(),
        };
      },
    }),
  }),
}));

describe('GET /api/user/settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return user settings when authenticated with profile', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockSingle.mockResolvedValue({ data: mockProfile });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.name).toBe('Test User');
    expect(data.email).toBe('test@example.com');
    expect(data.preferences).toEqual(mockProfile.preferences);
  });

  it('should fallback to auth metadata when profile is null', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockSingle.mockResolvedValue({ data: null });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.name).toBe('Test User'); // from user_metadata
    expect(data.email).toBe('test@example.com'); // from auth user
    expect(data.preferences).toEqual({});
  });
});

describe('PUT /api/user/settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new NextRequest('http://localhost/api/user/settings', {
      method: 'PUT',
      body: JSON.stringify({ name: 'New Name', preferences: {} }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should save settings successfully', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockEq.mockResolvedValue({ error: null });

    const request = new NextRequest('http://localhost/api/user/settings', {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Name',
        preferences: { language: 'Hindi' },
      }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Updated Name',
        preferences: { language: 'Hindi' },
      })
    );
  });

  it('should fallback to auth metadata when table does not exist', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockEq.mockResolvedValue({
      error: { message: 'relation "public.users" does not exist', code: '42P01' },
    });
    mockUpdateUser.mockResolvedValue({});

    const request = new NextRequest('http://localhost/api/user/settings', {
      method: 'PUT',
      body: JSON.stringify({ name: 'New Name', preferences: {} }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.fallback).toBe(true);
    expect(mockUpdateUser).toHaveBeenCalledWith({ data: { name: 'New Name' } });
  });
});
