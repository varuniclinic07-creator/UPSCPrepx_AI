/**
 * MCQ Adaptive Engine Service
 * 
 * Master Prompt v8.0 - Feature F7 (READ Mode)
 * - Adaptive difficulty adjustment
 * - Item Response Theory (IRT) implementation
 * - User ability estimation
 * - Weak area identification
 * - Spaced repetition scheduling
 * - Personalized question selection
 */

import { createClient } from '@/lib/supabase/server';
import type { McqDifficulty, McqSubject } from './question-bank';

// ============================================================================
// TYPES
// ============================================================================

export interface UserAbility {
  overall: number; // 0-100 scale
  bySubject: Record<McqSubject, number>;
  byTopic: Record<string, number>;
  byDifficulty: Record<McqDifficulty, number>;
  lastUpdated: string;
}

export interface PerformanceHistory {
  totalAttempts: number;
  correctAnswers: number;
  incorrectAnswers: number;
  avgAccuracy: number;
  avgTimePerQuestion: number;
  recentTrend: 'improving' | 'stable' | 'declining';
  streak: number;
}

export interface AdaptiveConfig {
  initialDifficulty: McqDifficulty;
  adjustmentThreshold: number; // Accuracy threshold for difficulty change
  abilityScore: number;
  weakAreas: string[];
  strongAreas: string[];
}

export interface SpacedRepetitionSchedule {
  questionId: string;
  nextReviewDate: string;
  intervalDays: number;
  easeFactor: number;
  reviewCount: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ABILITY_SCALE = { min: 0, max: 100 };
const DIFFICULTY_SCORES: Record<McqDifficulty, number> = {
  Easy: 30,
  Medium: 60,
  Hard: 90,
};

const ACCURACY_THRESHOLDS = {
  INCREASE_DIFFICULTY: 0.80, // 80% accuracy → harder questions
  DECREASE_DIFFICULTY: 0.50, // 50% accuracy → easier questions
};

const SPACED_REPETITION_INTERVALS = [1, 3, 7, 14, 30, 60, 90]; // days

// ============================================================================
// ADAPTIVE ENGINE SERVICE
// ============================================================================

export class AdaptiveEngineService {
  

  constructor() {
  }

  private async getSupabase() {
    return createClient();
  }

  /**
   * Calculate user ability score using Item Response Theory (IRT)
   */
  async calculateUserAbility(userId: string): Promise<UserAbility> {
    try {
      // Fetch user's attempt history
      const { data: attempts } = await (await this.getSupabase())
        .from('mcq_attempts')
        .select(`
          *,
          answers:mcq_answers(
            is_correct,
            time_spent_sec,
            question:mcq_questions(
              subject,
              topic,
              difficulty
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!attempts || attempts.length === 0) {
        return this.getDefaultAbility();
      }

      // Calculate ability by subject
      const bySubject: Record<McqSubject, number> = {
        GS1: 50, GS2: 50, GS3: 50, GS4: 50, CSAT: 50, Optional: 50, General: 50,
      };
      const subjectCounts: Record<McqSubject, number> = {
        GS1: 0, GS2: 0, GS3: 0, GS4: 0, CSAT: 0, Optional: 0, General: 0,
      };

      // Calculate ability by topic
      const byTopic: Record<string, { sum: number; count: number }> = {};

      // Calculate ability by difficulty
      const byDifficulty: Record<McqDifficulty, { sum: number; count: number }> = {
        Easy: { sum: 0, count: 0 },
        Medium: { sum: 0, count: 0 },
        Hard: { sum: 0, count: 0 },
      };

      let totalCorrect = 0;
      let totalQuestions = 0;

      // Process each attempt
      for (const attempt of attempts) {
        const answers = attempt.answers || [];
        
        for (const answer of answers) {
          const question = (answer as any).question;
          if (!question) continue;

          const isCorrect = answer.is_correct;
          const timeSpent = answer.time_spent_sec || 90;
          const difficultyScore = DIFFICULTY_SCORES[question.difficulty];

          // Calculate performance score (0-100)
          const accuracyScore = isCorrect ? 100 : 0;
          const timeBonus = Math.max(0, 100 - (timeSpent / question.time_estimate_sec * 50));
          const difficultyWeight = difficultyScore / 100;
          
          const performanceScore = (accuracyScore * 0.7 + timeBonus * 0.3) * difficultyWeight;

          // Update subject ability
          if (question.subject in bySubject) {
            bySubject[question.subject as McqSubject] += performanceScore;
            subjectCounts[question.subject as McqSubject]++;
          }

          // Update topic ability
          if (!byTopic[question.topic]) {
            byTopic[question.topic] = { sum: 0, count: 0 };
          }
          byTopic[question.topic].sum += performanceScore;
          byTopic[question.topic].count++;

          // Update difficulty performance
          byDifficulty[question.difficulty].sum += accuracyScore;
          byDifficulty[question.difficulty].count++;

          // Update totals
          if (isCorrect) totalCorrect++;
          totalQuestions++;
        }
      }

      // Average the abilities
      const subjects = Object.keys(bySubject) as McqSubject[];
      let overallSum = 0;

      for (const subject of subjects) {
        if (subjectCounts[subject] > 0) {
          bySubject[subject] = Math.round(bySubject[subject] / subjectCounts[subject]);
        } else {
          bySubject[subject] = 50; // Default for unattempted subjects
        }
        overallSum += bySubject[subject];
      }

      // Finalize topic abilities
      const finalizedByTopic: Record<string, number> = {};
      for (const [topic, data] of Object.entries(byTopic)) {
        finalizedByTopic[topic] = Math.round(data.sum / data.count);
      }

      // Finalize difficulty abilities
      const finalizedByDifficulty: Record<McqDifficulty, number> = {
        Easy: Math.round(byDifficulty.Easy.sum / Math.max(1, byDifficulty.Easy.count)),
        Medium: Math.round(byDifficulty.Medium.sum / Math.max(1, byDifficulty.Medium.count)),
        Hard: Math.round(byDifficulty.Hard.sum / Math.max(1, byDifficulty.Hard.count)),
      };

      const overall = Math.round(overallSum / subjects.length);

      return {
        overall: Math.max(ABILITY_SCALE.min, Math.min(ABILITY_SCALE.max, overall)),
        bySubject,
        byTopic: finalizedByTopic,
        byDifficulty: finalizedByDifficulty,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('AdaptiveEngineService.calculateUserAbility error:', error);
      return this.getDefaultAbility();
    }
  }

  /**
   * Get recommended difficulty for user
   */
  async getRecommendedDifficulty(userId: string, subject?: McqSubject): Promise<McqDifficulty> {
    try {
      const ability = await this.calculateUserAbility(userId);
      
      const abilityScore = subject 
        ? ability.bySubject[subject] 
        : ability.overall;

      if (abilityScore >= 75) return 'Hard';
      if (abilityScore >= 50) return 'Medium';
      return 'Easy';
    } catch (error) {
      console.error('AdaptiveEngineService.getRecommendedDifficulty error:', error);
      return 'Medium';
    }
  }

  /**
   * Identify weak and strong areas for user
   */
  async identifyAreas(userId: string): Promise<AdaptiveConfig> {
    try {
      const ability = await this.calculateUserAbility(userId);
      const recommendedDifficulty = await this.getRecommendedDifficulty(userId);

      const weakAreas: string[] = [];
      const strongAreas: string[] = [];

      // Identify weak subjects (ability < 50)
      for (const [subject, score] of Object.entries(ability.bySubject)) {
        if (score < 50) weakAreas.push(subject);
        if (score >= 70) strongAreas.push(subject);
      }

      // Identify weak topics (ability < 50)
      for (const [topic, score] of Object.entries(ability.byTopic)) {
        if (score < 50) weakAreas.push(topic);
        if (score >= 75) strongAreas.push(topic);
      }

      return {
        initialDifficulty: recommendedDifficulty,
        adjustmentThreshold: ACCURACY_THRESHOLDS.INCREASE_DIFFICULTY,
        abilityScore: ability.overall,
        weakAreas: weakAreas.slice(0, 10), // Top 10 weak areas
        strongAreas: strongAreas.slice(0, 10),
      };
    } catch (error) {
      console.error('AdaptiveEngineService.identifyAreas error:', error);
      return {
        initialDifficulty: 'Medium',
        adjustmentThreshold: 0.80,
        abilityScore: 50,
        weakAreas: [],
        strongAreas: [],
      };
    }
  }

  /**
   * Calculate spaced repetition schedule for bookmarked questions
   */
  async calculateSpacedRepetition(
    userId: string,
    questionId: string,
    isCorrect: boolean
  ): Promise<SpacedRepetitionSchedule> {
    try {
      // Get current bookmark data
      const { data: bookmark } = await (await this.getSupabase())
        .from('mcq_bookmarks')
        .select('*')
        .eq('user_id', userId)
        .eq('question_id', questionId)
        .single();

      const reviewCount = bookmark?.review_count || 0;
      const easeFactor = bookmark?.ease_factor || 2.5;

      // SM-2 Algorithm adaptation
      let newEaseFactor = easeFactor;
      let newInterval: number;

      if (isCorrect) {
        // Increase interval based on ease factor
        if (reviewCount === 0) {
          newInterval = 1;
        } else if (reviewCount === 1) {
          newInterval = 3;
        } else {
          newInterval = Math.round(SPACED_REPETITION_INTERVALS[Math.min(reviewCount, SPACED_REPETITION_INTERVALS.length - 1)] * easeFactor);
        }
        
        // Adjust ease factor
        newEaseFactor = Math.max(1.3, easeFactor + 0.1);
      } else {
        // Reset interval for incorrect answers
        newInterval = 1;
        newEaseFactor = Math.max(1.3, easeFactor - 0.2);
      }

      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

      return {
        questionId,
        nextReviewDate: nextReviewDate.toISOString(),
        intervalDays: newInterval,
        easeFactor: newEaseFactor,
        reviewCount: reviewCount + 1,
      };
    } catch (error) {
      console.error('AdaptiveEngineService.calculateSpacedRepetition error:', error);
      return {
        questionId,
        nextReviewDate: new Date(Date.now() + 86400000).toISOString(), // 1 day
        intervalDays: 1,
        easeFactor: 2.5,
        reviewCount: 1,
      };
    }
  }

  /**
   * Get questions due for spaced repetition review
   */
  async getDueReviews(userId: string, limit: number = 20): Promise<string[]> {
    try {
      const now = new Date().toISOString();

      const { data, error } = await (await this.getSupabase())
        .from('mcq_bookmarks')
        .select('question_id')
        .eq('user_id', userId)
        .lte('next_review_at', now)
        .order('next_review_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch due reviews:', error);
        return [];
      }

      return data?.map(d => d.question_id) || [];
    } catch (error) {
      console.error('AdaptiveEngineService.getDueReviews error:', error);
      return [];
    }
  }

  /**
   * Get performance history for user
   */
  async getPerformanceHistory(userId: string): Promise<PerformanceHistory> {
    try {
      const { data: attempts } = await (await this.getSupabase())
        .from('mcq_attempts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);

      if (!attempts || attempts.length === 0) {
        return {
          totalAttempts: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
          avgAccuracy: 0,
          avgTimePerQuestion: 0,
          recentTrend: 'stable',
          streak: 0,
        };
      }

      const totalAttempts = attempts.length;
      const correctAnswers = attempts.reduce((sum, a) => sum + (a.correct_answers || 0), 0);
      const incorrectAnswers = attempts.reduce((sum, a) => sum + (a.incorrect_answers || 0), 0);
      const avgAccuracy = attempts.reduce((sum, a) => sum + (a.accuracy_percent || 0), 0) / totalAttempts;
      const avgTimePerQuestion = attempts.reduce((sum, a) => sum + (a.avg_time_per_question || 0), 0) / totalAttempts;

      // Calculate recent trend (last 10 vs previous 10)
      const recent10 = attempts.slice(0, 10);
      const previous10 = attempts.slice(10, 20);
      
      const recentAvg = recent10.reduce((sum, a) => sum + (a.accuracy_percent || 0), 0) / recent10.length;
      const previousAvg = previous10.length > 0 
        ? previous10.reduce((sum, a) => sum + (a.accuracy_percent || 0), 0) / previous10.length 
        : recentAvg;

      let recentTrend: 'improving' | 'stable' | 'declining' = 'stable';
      if (recentAvg > previousAvg + 5) recentTrend = 'improving';
      if (recentAvg < previousAvg - 5) recentTrend = 'declining';

      // Calculate streak (consecutive days with attempts)
      const streak = this.calculateStreak(attempts);

      return {
        totalAttempts,
        correctAnswers,
        incorrectAnswers,
        avgAccuracy: Math.round(avgAccuracy * 100) / 100,
        avgTimePerQuestion: Math.round(avgTimePerQuestion),
        recentTrend,
        streak,
      };
    } catch (error) {
      console.error('AdaptiveEngineService.getPerformanceHistory error:', error);
      return {
        totalAttempts: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        avgAccuracy: 0,
        avgTimePerQuestion: 0,
        recentTrend: 'stable',
        streak: 0,
      };
    }
  }

  /**
   * Calculate study streak
   */
  private calculateStreak(attempts: any[]): number {
    if (attempts.length === 0) return 0;

    const dates = new Set(attempts.map(a => new Date(a.created_at).toDateString()));
    let streak = 0;
    let currentDate = new Date();

    // Check if user studied today
    if (!dates.has(currentDate.toDateString())) {
      currentDate.setDate(currentDate.getDate() - 1);
    }

    // Count consecutive days
    while (dates.has(currentDate.toDateString())) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  }

  /**
   * Get default ability for new users
   */
  private getDefaultAbility(): UserAbility {
    return {
      overall: 50,
      bySubject: { GS1: 50, GS2: 50, GS3: 50, GS4: 50, CSAT: 50, Optional: 50, General: 50 },
      byTopic: {},
      byDifficulty: { Easy: 0, Medium: 0, Hard: 0 },
      lastUpdated: new Date().toISOString(),
    };
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const adaptiveEngine = new AdaptiveEngineService();
