/** @jest-environment node */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/onboarding/complete/route';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSelect = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockSingle = jest.fn();
const mockInsert = jest.fn().mockResolvedValue({ error: null });
const mockUpdate = jest.fn().mockReturnThis();
const mockOrder = jest.fn().mockReturnThis();
const mockLimit = jest.fn().mockReturnThis();

const mockFrom = jest.fn(() => ({
  select: mockSelect,
  eq: mockEq,
  single: mockSingle,
  insert: mockInsert,
  update: mockUpdate,
  order: mockOrder,
  limit: mockLimit,
}));
mockSelect.mockReturnValue({ eq: mockEq });
mockEq.mockReturnValue({ single: mockSingle, eq: mockEq, order: mockOrder });
mockOrder.mockReturnValue({ limit: mockLimit });
mockLimit.mockReturnValue({ single: mockSingle });
mockUpdate.mockReturnValue({ eq: mockEq });

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
  })),
}));

// Quiz generator mocks
const mockCalculateQuizScore = jest.fn();
const mockIdentifyStrengthsWeaknesses = jest.fn();
const mockDeterminePreparationStage = jest.fn();

jest.mock('@/lib/onboarding/quiz-generator', () => ({
  calculateQuizScore: (...args: unknown[]) => mockCalculateQuizScore(...args),
  identifyStrengthsWeaknesses: (...args: unknown[]) => mockIdentifyStrengthsWeaknesses(...args),
  determinePreparationStage: (...args: unknown[]) => mockDeterminePreparationStage(...args),
}));

// Study plan generator mocks
const mockGenerateStudyPlan = jest.fn();
const mockSeedSyllabusProgress = jest.fn();
const mockActivateTrialSubscription = jest.fn();
const mockSaveStudyPlanToProfile = jest.fn();
const mockAwardOnboardingXP = jest.fn();

jest.mock('@/lib/onboarding/study-plan-generator', () => ({
  generateStudyPlan: (...args: unknown[]) => mockGenerateStudyPlan(...args),
  seedSyllabusProgress: (...args: unknown[]) => mockSeedSyllabusProgress(...args),
  activateTrialSubscription: (...args: unknown[]) => mockActivateTrialSubscription(...args),
  saveStudyPlanToProfile: (...args: unknown[]) => mockSaveStudyPlanToProfile(...args),
  awardOnboardingXP: (...args: unknown[]) => mockAwardOnboardingXP(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildPostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/onboarding/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

const validAnswers = Array.from({ length: 10 }, (_, i) => ({
  question_id: `q-${i + 1}`,
  selected_option: 'A' as const,
  time_spent_sec: 30,
}));

const validBody = {
  user_id: VALID_UUID,
  quiz_id: `quiz-${VALID_UUID}-1234`,
  answers: validAnswers,
};

const sampleProfile = {
  user_id: VALID_UUID,
  target_year: 2027,
  attempt_number: 1,
  is_working_professional: false,
  study_hours_per_day: 8,
  optional_subject: 'Geography',
};

const sampleQuestions = Array.from({ length: 10 }, (_, i) => ({
  id: `q-${i + 1}`,
  correct_answer: 'A',
  subject: 'polity',
  topic: 'fundamental-rights',
}));

const sampleStudyPlan = {
  weekly_schedule: [{ day: 'Monday', subjects: ['polity'] }],
  priority_topics: ['fundamental-rights'],
  recommended_hours_per_subject: { polity: 2 },
  motivational_message: 'Keep going!',
  motivational_message_hi: 'आगे बढ़ते रहो!',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/onboarding/complete', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Re-setup chain after clearAllMocks
    // mockEq must be chainable (return objects with further methods)
    // The terminal calls (.single(), .insert(), update chain's final .eq()) resolve promises
    mockFrom.mockImplementation(() => ({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
      insert: mockInsert,
      update: mockUpdate,
      order: mockOrder,
      limit: mockLimit,
    }));
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle, eq: mockEq, order: mockOrder });
    mockOrder.mockReturnValue({ limit: mockLimit });
    mockLimit.mockReturnValue({ single: mockSingle });
    mockUpdate.mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });
    mockInsert.mockResolvedValue({ error: null });

    // Default mock returns
    mockCalculateQuizScore.mockReturnValue({
      score: 70,
      correctCount: 7,
      totalQuestions: 10,
      subjectAccuracy: { polity: 80, history: 60 },
    });
    mockIdentifyStrengthsWeaknesses.mockReturnValue({
      strengths: ['polity'],
      weaknesses: ['history'],
    });
    mockDeterminePreparationStage.mockReturnValue('intermediate');
    mockGenerateStudyPlan.mockResolvedValue(sampleStudyPlan);
    mockSeedSyllabusProgress.mockResolvedValue(330);
    mockActivateTrialSubscription.mockResolvedValue({
      trial_started_at: '2026-04-12T00:00:00Z',
      trial_expires_at: '2026-04-15T00:00:00Z',
    });
    mockSaveStudyPlanToProfile.mockResolvedValue(undefined);
    mockAwardOnboardingXP.mockResolvedValue(undefined);
  });

  it('returns 400 for invalid request data', async () => {
    const res = await POST(buildPostRequest({ user_id: 'bad' }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBe('Invalid request data');
  });

  it('returns 400 when answers count is not 10', async () => {
    const res = await POST(
      buildPostRequest({
        ...validBody,
        answers: validAnswers.slice(0, 5),
      })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('returns 400 when profile not found', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

    const res = await POST(buildPostRequest(validBody));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('User profile not found');
  });

  it('returns 400 when quiz session not found', async () => {
    // Profile found
    mockSingle.mockResolvedValueOnce({ data: sampleProfile, error: null });
    // Quiz job not found
    mockSingle.mockResolvedValueOnce({ data: null, error: null });

    const res = await POST(buildPostRequest(validBody));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Quiz session not found');
  });

  it('completes onboarding successfully', async () => {
    // Profile found
    mockSingle.mockResolvedValueOnce({ data: sampleProfile, error: null });
    // Quiz job found
    mockSingle.mockResolvedValueOnce({
      data: { payload: { questions: sampleQuestions } },
      error: null,
    });

    const res = await POST(buildPostRequest(validBody));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.message).toBe('Onboarding completed successfully!');

    // Analysis
    expect(json.analysis.overall_score).toBe(70);
    expect(json.analysis.correct_answers).toBe(7);
    expect(json.analysis.preparation_stage).toBe('intermediate');
    expect(json.analysis.strengths).toEqual(['polity']);
    expect(json.analysis.weaknesses).toEqual(['history']);

    // Study plan
    expect(json.study_plan.weekly_schedule).toBeDefined();
    expect(json.study_plan.priority_topics).toBeDefined();

    // Trial
    expect(json.trial.active).toBe(true);
    expect(json.trial.days_remaining).toBe(3);

    // Progress
    expect(json.progress.syllabus_nodes_seeded).toBe(330);
    expect(json.progress.xp_awarded).toBe(100);

    expect(json.redirect).toBe('/dashboard');
  });

  it('calls all onboarding services in correct order', async () => {
    mockSingle.mockResolvedValueOnce({ data: sampleProfile, error: null });
    mockSingle.mockResolvedValueOnce({
      data: { payload: { questions: sampleQuestions } },
      error: null,
    });

    await POST(buildPostRequest(validBody));

    expect(mockCalculateQuizScore).toHaveBeenCalled();
    expect(mockIdentifyStrengthsWeaknesses).toHaveBeenCalled();
    expect(mockDeterminePreparationStage).toHaveBeenCalled();
    expect(mockGenerateStudyPlan).toHaveBeenCalled();
    expect(mockSeedSyllabusProgress).toHaveBeenCalledWith(
      VALID_UUID,
      ['polity'],
      ['history']
    );
    expect(mockActivateTrialSubscription).toHaveBeenCalledWith(VALID_UUID);
    expect(mockSaveStudyPlanToProfile).toHaveBeenCalledWith(
      VALID_UUID,
      sampleStudyPlan
    );
    expect(mockAwardOnboardingXP).toHaveBeenCalledWith(VALID_UUID);
  });

  it('returns 500 when study plan generation fails', async () => {
    mockSingle.mockResolvedValueOnce({ data: sampleProfile, error: null });
    mockSingle.mockResolvedValueOnce({
      data: { payload: { questions: sampleQuestions } },
      error: null,
    });
    mockGenerateStudyPlan.mockRejectedValue(new Error('AI service down'));

    const res = await POST(buildPostRequest(validBody));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error).toBe('Failed to complete onboarding');
  });
});
