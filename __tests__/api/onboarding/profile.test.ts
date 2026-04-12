/** @jest-environment node */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/onboarding/profile/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUpsert = jest.fn().mockReturnThis();
const mockEq = jest.fn();
const mockInsert = jest.fn().mockResolvedValue({ error: null });

const mockFrom = jest.fn(() => ({
  upsert: mockUpsert,
  eq: mockEq,
  insert: mockInsert,
}));
mockUpsert.mockReturnValue({ eq: mockEq });
mockEq.mockResolvedValue({ error: null });

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
  })),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildPostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/onboarding/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

const validProfile = {
  user_id: VALID_UUID,
  target_year: 2027,
  attempt_number: 1,
  is_working_professional: false,
  study_hours_per_day: 8,
  optional_subject: 'Geography',
  preparation_stage: 'beginner',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/onboarding/profile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-setup chain after clearAllMocks
    mockFrom.mockReturnValue({
      upsert: mockUpsert,
      eq: mockEq,
      insert: mockInsert,
    });
    mockUpsert.mockReturnValue({ eq: mockEq });
    mockEq.mockResolvedValue({ error: null });
    mockInsert.mockResolvedValue({ error: null });
  });

  it('saves profile successfully', async () => {
    const res = await POST(buildPostRequest(validProfile));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.message).toBe('Profile saved successfully');
    expect(json.profile.user_id).toBe(VALID_UUID);
    expect(json.profile.target_year).toBe(2027);
  });

  it('returns 400 for missing required fields', async () => {
    const res = await POST(buildPostRequest({ user_id: VALID_UUID }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBe('Invalid request data');
  });

  it('returns 400 for invalid user_id', async () => {
    const res = await POST(
      buildPostRequest({ ...validProfile, user_id: 'not-uuid' })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('returns 400 for target_year out of range', async () => {
    const res = await POST(
      buildPostRequest({ ...validProfile, target_year: 2020 })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('returns 400 for study_hours below minimum', async () => {
    const res = await POST(
      buildPostRequest({ ...validProfile, study_hours_per_day: 1 })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid optional subject', async () => {
    const res = await POST(
      buildPostRequest({ ...validProfile, optional_subject: 'Underwater Basket Weaving' })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Invalid optional subject');
    expect(json.available_subjects).toBeDefined();
  });

  it('saves profile without optional subject', async () => {
    const { optional_subject, ...profileWithout } = validProfile;

    const res = await POST(buildPostRequest(profileWithout));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it('defaults preparation_stage to beginner', async () => {
    const { preparation_stage, ...profileWithout } = validProfile;

    const res = await POST(buildPostRequest(profileWithout));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.profile.preparation_stage).toBe('beginner');
  });

  it('returns 500 when database upsert fails', async () => {
    mockEq.mockResolvedValueOnce({ error: new Error('DB write failed') });

    const res = await POST(buildPostRequest(validProfile));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error).toBe('Failed to save profile');
  });
});
