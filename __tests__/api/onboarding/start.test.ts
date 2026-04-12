/** @jest-environment node */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/onboarding/start/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSelect = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockSingle = jest.fn();
const mockUpsert = jest.fn().mockReturnThis();
const mockInsert = jest.fn().mockReturnThis();

const mockFrom = jest.fn(() => ({
  select: mockSelect,
  eq: mockEq,
  single: mockSingle,
  upsert: mockUpsert,
  insert: mockInsert,
}));
mockSelect.mockReturnValue({ eq: mockEq });
mockEq.mockReturnValue({ single: mockSingle, eq: mockEq });
mockUpsert.mockReturnValue({ eq: mockEq });
mockEq.mockImplementation(() => ({
  single: mockSingle,
  eq: mockEq,
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
  })),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildPostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/onboarding/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/onboarding/start', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: no existing profile
    mockSingle.mockResolvedValue({ data: null, error: null });
    // upsert success
    mockUpsert.mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });
    // insert success (audit_logs, subscriptions)
    mockInsert.mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { trial_expires_at: '2026-04-15T00:00:00Z' },
          error: null,
        }),
      }),
    });
  });

  it('returns 400 for invalid request (missing user_id)', async () => {
    const res = await POST(buildPostRequest({ email: 'test@test.com' }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBe('Invalid request data');
  });

  it('returns 400 for invalid email', async () => {
    const res = await POST(
      buildPostRequest({ user_id: VALID_UUID, email: 'not-an-email' })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('returns 400 when onboarding already completed', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { user_id: VALID_UUID, onboarding_completed: true },
      error: null,
    });

    const res = await POST(
      buildPostRequest({ user_id: VALID_UUID, email: 'test@test.com' })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Onboarding already completed');
    expect(json.redirect).toBe('/dashboard');
  });

  it('starts onboarding for new user successfully', async () => {
    // No existing profile
    mockSingle.mockResolvedValueOnce({ data: null, error: null });
    // No existing subscription
    mockSingle.mockResolvedValueOnce({ data: null, error: null });
    // Free plan lookup
    mockSingle.mockResolvedValueOnce({ data: { id: 'plan-free' }, error: null });

    const res = await POST(
      buildPostRequest({ user_id: VALID_UUID, email: 'student@upsc.com' })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.user_id).toBe(VALID_UUID);
    expect(json.trial_active).toBe(true);
    expect(json.trial_expires_at).toBeDefined();
  });

  it('returns existing trial when subscription already exists', async () => {
    // No completed profile
    mockSingle.mockResolvedValueOnce({ data: null, error: null });
    // Existing trial subscription
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'sub-1',
        status: 'trial',
        trial_expires_at: '2026-04-14T00:00:00Z',
      },
      error: null,
    });

    const res = await POST(
      buildPostRequest({ user_id: VALID_UUID, email: 'student@upsc.com' })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.trial_expires_at).toBe('2026-04-14T00:00:00Z');
  });
});
