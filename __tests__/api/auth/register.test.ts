/** @jest-environment node */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';

// --- Mocks ---

const mockFrom = jest.fn();
const mockSupabase = {
  from: mockFrom,
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => mockSupabase),
  createServerSupabaseClient: jest.fn(async () => mockSupabase),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(async () => 'hashed_password_123'),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

// --- Helpers ---

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function chainMock(returnValue: { data?: unknown; error?: unknown }) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(returnValue as never),
    insert: jest.fn().mockResolvedValue(returnValue as never),
    update: jest.fn().mockReturnThis(),
  };
  return chain;
}

// --- Tests ---

describe('POST /api/auth/register', () => {
  let POST: typeof import('@/app/api/auth/register/route').POST;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await import('@/app/api/auth/register/route');
    POST = mod.POST;
  });

  it('should register a new user successfully', async () => {
    // First call: check existing user (select -> eq -> single)
    const selectChain = chainMock({ data: null, error: null });
    // Second call: insert user
    const insertChain = chainMock({ data: null, error: null });
    // Third call: insert subscription
    const subChain = chainMock({ data: null, error: null });
    // Fourth call: update preferences
    const prefChain = chainMock({ data: null, error: null });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return selectChain;
      if (callCount === 2) return insertChain;
      if (callCount === 3) return subChain;
      return prefChain;
    });

    const res = await POST(makeRequest({
      email: 'test@example.com',
      password: 'SecurePass123!',
      name: 'Test User',
      phone: '9876543210',
    }));

    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.user.email).toBe('test@example.com');
    expect(json.user.name).toBe('Test User');
    expect(json.user.id).toBe('test-uuid-1234');
  });

  it('should return 400 when email is missing', async () => {
    const res = await POST(makeRequest({
      password: 'SecurePass123!',
      name: 'Test User',
    }));

    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe('Email, password, and name are required');
  });

  it('should return 400 when password is missing', async () => {
    const res = await POST(makeRequest({
      email: 'test@example.com',
      name: 'Test User',
    }));

    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe('Email, password, and name are required');
  });

  it('should return 400 when name is missing', async () => {
    const res = await POST(makeRequest({
      email: 'test@example.com',
      password: 'SecurePass123!',
    }));

    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe('Email, password, and name are required');
  });

  it('should return 400 when email already exists', async () => {
    const selectChain = chainMock({ data: { id: 'existing-id' }, error: null });
    mockFrom.mockReturnValue(selectChain);

    const res = await POST(makeRequest({
      email: 'existing@example.com',
      password: 'SecurePass123!',
      name: 'Test User',
    }));

    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe('User with this email already exists');
  });

  it('should return 500 when user insert fails', async () => {
    const selectChain = chainMock({ data: null, error: null });
    const insertChain = chainMock({ data: null, error: { message: 'DB insert failed' } });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return selectChain;
      return insertChain;
    });

    const res = await POST(makeRequest({
      email: 'test@example.com',
      password: 'SecurePass123!',
      name: 'Test User',
    }));

    const json = await res.json();
    expect(res.status).toBe(500);
    expect(json.error).toContain('Failed to create user');
  });
});
