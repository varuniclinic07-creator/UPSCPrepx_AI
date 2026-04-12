/** @jest-environment node */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/onboarding/quiz/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSelect = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockSingle = jest.fn();
const mockInsert = jest.fn().mockResolvedValue({ error: null });

const mockFrom = jest.fn(() => ({
  select: mockSelect,
  eq: mockEq,
  single: mockSingle,
  insert: mockInsert,
}));
mockSelect.mockReturnValue({ eq: mockEq });
mockEq.mockReturnValue({ single: mockSingle, eq: mockEq });

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
  })),
}));

const mockGenerateDiagnosticQuiz = jest.fn();

jest.mock('@/lib/onboarding/quiz-generator', () => ({
  generateDiagnosticQuiz: (...args: unknown[]) => mockGenerateDiagnosticQuiz(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildPostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/onboarding/quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

const sampleProfile = {
  target_year: 2027,
  attempt_number: 1,
  is_working_professional: false,
  study_hours_per_day: 8,
  optional_subject: 'Geography',
};

const sampleQuestions = Array.from({ length: 10 }, (_, i) => ({
  id: `q-${i + 1}`,
  question_text: `Question ${i + 1}?`,
  question_text_hi: `Hindi question ${i + 1}?`,
  options: { A: 'Opt A', B: 'Opt B', C: 'Opt C', D: 'Opt D' },
  correct_answer: 'A',
  subject: 'polity',
  topic: 'fundamental-rights',
  difficulty: 'medium',
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/onboarding/quiz', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateDiagnosticQuiz.mockResolvedValue(sampleQuestions);
  });

  it('returns 400 for invalid user_id', async () => {
    const res = await POST(buildPostRequest({ user_id: 'not-a-uuid' }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBe('Invalid request data');
  });

  it('returns 400 when profile not found', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

    const res = await POST(buildPostRequest({ user_id: VALID_UUID }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain('User profile not found');
  });

  it('generates quiz successfully', async () => {
    mockSingle.mockResolvedValueOnce({ data: sampleProfile, error: null });

    const res = await POST(buildPostRequest({ user_id: VALID_UUID }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.quiz_id).toContain(VALID_UUID);
    expect(json.questions).toHaveLength(10);
    expect(json.total_questions).toBe(10);
    expect(json.instructions).toBeDefined();
    // Should not expose correct_answer to client
    expect(json.questions[0].correct_answer).toBeUndefined();
  });

  it('calls quiz generator with profile data', async () => {
    mockSingle.mockResolvedValueOnce({ data: sampleProfile, error: null });

    await POST(buildPostRequest({ user_id: VALID_UUID }));

    expect(mockGenerateDiagnosticQuiz).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: VALID_UUID,
        target_year: 2027,
        attempt_number: 1,
        optional_subject: 'Geography',
      })
    );
  });

  it('returns 500 when quiz generation fails', async () => {
    mockSingle.mockResolvedValueOnce({ data: sampleProfile, error: null });
    mockGenerateDiagnosticQuiz.mockRejectedValue(new Error('AI service down'));

    const res = await POST(buildPostRequest({ user_id: VALID_UUID }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error).toBe('Failed to generate quiz');
  });
});
