/**
 * MCQ Mock Test Service
 * 
 * Master Prompt v8.0 - Feature F7 (READ Mode)
 * - Mock test creation and management
 * - UPSC pattern (100 questions, 200 marks, 120 min)
 * - Subject and difficulty distribution
 * - Attempt tracking and scoring
 * - Percentile and rank calculation
 * - Premium mock access control
 */

import { createClient } from '@/lib/supabase/server';
import type { McqSubject, McqDifficulty } from './question-bank';

// ============================================================================
// TYPES
// ============================================================================

export interface MockTest {
  id: string;
  title: { en: string; hi: string };
  description?: { en: string; hi: string };
  totalQuestions: number;
  totalMarks: number;
  durationMin: number;
  subjectDistribution: { GS: number; CSAT: number };
  difficultyDistribution: { Easy: number; Medium: number; Hard: number };
  isActive: boolean;
  isPremium: boolean;
  attemptCount: number;
  avgScore?: number;
  createdAt: string;
}

export interface MockAttempt {
  id: string;
  mockId: string;
  userId: string;
  startedAt: string;
  completedAt?: string;
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unattempted: number;
  totalMarks: number;
  negativeMarks: number;
  netMarks: number;
  accuracyPercent: number;
  timeTakenSec: number;
  percentile?: number;
  rank?: number;
}

export interface MockTestConfig {
  title: { en: string; hi: string };
  description?: { en: string; hi: string };
  totalQuestions?: number;
  totalMarks?: number;
  durationMin?: number;
  subjectDistribution?: { GS: number; CSAT: number };
  difficultyDistribution?: { Easy: number; Medium: number; Hard: number };
  isPremium?: boolean;
}

export interface MockSubmission {
  answers: Array<{
    questionId: string;
    selectedOption: number;
    timeSpent: number;
    markedForReview?: boolean;
  }>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MOCK_CONFIG = {
  totalQuestions: 100,
  totalMarks: 200,
  durationMin: 120,
  subjectDistribution: { GS: 80, CSAT: 20 },
  difficultyDistribution: { Easy: 20, Medium: 60, Hard: 20 },
};

const MARKS_PER_QUESTION = 2;
const NEGATIVE_MARKS_PER_QUESTION = 0.66; // 1/3 of 2 marks

// ============================================================================
// MOCK TEST SERVICE
// ============================================================================

export class MockTestService {
  

  constructor() {
  }

  private async getSupabase() {
    return createClient();
  }

  /**
   * Get all active mock tests
   */
  async getActiveMockTests(isPremium?: boolean): Promise<MockTest[]> {
    try {
      let query = (await this.getSupabase())
        .from('mcq_mock_tests')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (isPremium !== undefined) {
        query = query.eq('is_premium', isPremium);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch mock tests:', error);
        return [];
      }

      return data.map(this.mapMockTest);
    } catch (error) {
      console.error('MockTestService.getActiveMockTests error:', error);
      return [];
    }
  }

  /**
   * Get mock test by ID
   */
  async getMockTestById(mockId: string): Promise<MockTest | null> {
    try {
      const { data, error } = await (await this.getSupabase())
        .from('mcq_mock_tests')
        .select('*')
        .eq('id', mockId)
        .single();

      if (error) {
        console.error('Failed to fetch mock test:', error);
        return null;
      }

      return this.mapMockTest(data);
    } catch (error) {
      console.error('MockTestService.getMockTestById error:', error);
      return null;
    }
  }

  /**
   * Create new mock test
   */
  async createMockTest(config: MockTestConfig): Promise<MockTest | null> {
    try {
      const mockConfig = {
        ...DEFAULT_MOCK_CONFIG,
        ...config,
      };

      const { data, error } = await (await this.getSupabase())
        .from('mcq_mock_tests')
        .insert({
          title: mockConfig.title,
          description: mockConfig.description,
          total_questions: mockConfig.totalQuestions,
          total_marks: mockConfig.totalMarks,
          duration_min: mockConfig.durationMin,
          subject_distribution: mockConfig.subjectDistribution,
          difficulty_distribution: mockConfig.difficultyDistribution,
          is_premium: mockConfig.isPremium || false,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create mock test:', error);
        return null;
      }

      return this.mapMockTest(data);
    } catch (error) {
      console.error('MockTestService.createMockTest error:', error);
      return null;
    }
  }

  /**
   * Start mock test attempt
   */
  async startMockAttempt(userId: string, mockId: string): Promise<{ attemptId: string; mock: MockTest } | null> {
    try {
      // Get mock test details
      const mock = await this.getMockTestById(mockId);
      if (!mock) {
        return null;
      }

      // Check premium access
      if (mock.isPremium) {
        const { data: user } = await (await this.getSupabase())
          .from('users')
          .select('subscription_tier')
          .eq('id', userId)
          .single();

        if (user?.subscription_tier !== 'premium' && user?.subscription_tier !== 'premium_plus') {
          throw new Error('Premium subscription required for this mock test');
        }
      }

      // Create attempt record
      const { data, error } = await (await this.getSupabase())
        .from('mcq_attempts')
        .insert({
          user_id: userId,
          mock_id: mockId,
          session_type: 'Mock',
          total_questions: mock.totalQuestions,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create mock attempt:', error);
        return null;
      }

      return {
        attemptId: data.id,
        mock,
      };
    } catch (error) {
      console.error('MockTestService.startMockAttempt error:', error);
      return null;
    }
  }

  /**
   * Submit mock test
   */
  async submitMockAttempt(
    attemptId: string,
    submission: MockSubmission
  ): Promise<{
    netMarks: number;
    accuracy: number;
    percentile: number;
    rank: number;
  } | null> {
    try {
      // Get attempt details
      const { data: attempt } = await (await this.getSupabase())
        .from('mcq_attempts')
        .select('*, mock_id')
        .eq('id', attemptId)
        .single();

      if (!attempt) {
        return null;
      }

      // Calculate time taken
      const timeTakenSec = Math.floor((Date.now() - new Date(attempt.started_at).getTime()) / 1000);

      // Update attempt with final stats (trigger will calculate from answers)
      await (await this.getSupabase())
        .from('mcq_attempts')
        .update({
          completed_at: new Date().toISOString(),
          time_taken_sec: timeTakenSec,
        })
        .eq('id', attemptId);

      // Insert answers (trigger will update attempt stats)
      for (const answer of submission.answers) {
        await (await this.getSupabase())
          .from('mcq_answers')
          .insert({
            attempt_id: attemptId,
            question_id: answer.questionId,
            selected_option: answer.selectedOption,
            time_spent_sec: answer.timeSpent,
            marked_for_review: answer.markedForReview || false,
          });
      }

      // Wait for trigger to update stats, then fetch final results
      await new Promise(resolve => setTimeout(resolve, 100));

      const { data: finalAttempt } = await (await this.getSupabase())
        .from('mcq_attempts')
        .select('*')
        .eq('id', attemptId)
        .single();

      if (!finalAttempt) {
        return null;
      }

      // Calculate percentile and rank
      const { percentile, rank } = await this.calculatePercentileAndRank(
        finalAttempt.net_marks,
        attempt.mock_id
      );

      // Update attempt with percentile and rank
      await (await this.getSupabase())
        .from('mcq_attempts')
        .update({ percentile, rank })
        .eq('id', attemptId);

      // Update mock test attempt count
      await (await this.getSupabase()).rpc('increment_mock_attempt_count', { p_mock_id: attempt.mock_id });

      return {
        netMarks: finalAttempt.net_marks,
        accuracy: finalAttempt.accuracy_percent,
        percentile,
        rank,
      };
    } catch (error) {
      console.error('MockTestService.submitMockAttempt error:', error);
      return null;
    }
  }

  /**
   * Get user's mock attempt history
   */
  async getUserMockHistory(userId: string, limit: number = 10): Promise<MockAttempt[]> {
    try {
      const { data, error } = await (await this.getSupabase())
        .from('mcq_attempts')
        .select(`
          *,
          mock:mcq_mock_tests(
            title,
            total_marks,
            duration_min
          )
        `)
        .eq('user_id', userId)
        .eq('session_type', 'Mock')
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch mock history:', error);
        return [];
      }

      return data.map(this.mapMockAttempt);
    } catch (error) {
      console.error('MockTestService.getUserMockHistory error:', error);
      return [];
    }
  }

  /**
   * Calculate percentile and rank based on score
   */
  private async calculatePercentileAndRank(
    score: number,
    mockId: string,
    limit: number = 1000
  ): Promise<{ percentile: number; rank: number }> {
    try {
      // Get all attempts for this mock test
      const { data: attempts } = await (await this.getSupabase())
        .from('mcq_attempts')
        .select('net_marks')
        .eq('mock_id', mockId)
        .not('completed_at', 'is', null)
        .order('net_marks', { ascending: false })
        .limit(limit);

      if (!attempts || attempts.length === 0) {
        return { percentile: 50, rank: 1 };
      }

      // Find rank (1-based)
      const rank = attempts.findIndex(a => a.net_marks <= score) + 1 || attempts.length;

      // Calculate percentile
      const percentile = ((attempts.length - rank + 1) / attempts.length) * 100;

      return {
        percentile: Math.round(percentile * 100) / 100,
        rank,
      };
    } catch (error) {
      console.error('MockTestService.calculatePercentileAndRank error:', error);
      return { percentile: 50, rank: 1 };
    }
  }

  /**
   * Map database row to MockTest interface
   */
  private mapMockTest(row: any): MockTest {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      totalQuestions: row.total_questions,
      totalMarks: row.total_marks,
      durationMin: row.duration_min,
      subjectDistribution: row.subject_distribution,
      difficultyDistribution: row.difficulty_distribution,
      isActive: row.is_active,
      isPremium: row.is_premium,
      attemptCount: row.attempt_count,
      avgScore: row.avg_score,
      createdAt: row.created_at,
    };
  }

  /**
   * Map database row to MockAttempt interface
   */
  private mapMockAttempt(row: any): MockAttempt {
    return {
      id: row.id,
      mockId: row.mock_id,
      userId: row.user_id,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      totalQuestions: row.total_questions,
      attemptedQuestions: row.attempted_questions,
      correctAnswers: row.correct_answers,
      incorrectAnswers: row.incorrect_answers,
      unattempted: row.unattempted,
      totalMarks: row.total_marks,
      negativeMarks: row.negative_marks,
      netMarks: row.net_marks,
      accuracyPercent: row.accuracy_percent,
      timeTakenSec: row.time_taken_sec,
      percentile: row.percentile,
      rank: row.rank,
    };
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const mockTest = new MockTestService();
