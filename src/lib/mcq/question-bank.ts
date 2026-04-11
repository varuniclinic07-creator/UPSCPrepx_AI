/**
 * MCQ Question Bank Service
 * 
 * Master Prompt v8.0 - Feature F7 (READ Mode)
 * - Question retrieval with filtering
 * - PYQs (Previous Year Questions)
 * - Subject-wise, topic-wise, difficulty-wise
 * - Random selection for practice
 * - Mock test assembly
 * - Bilingual support (EN+HI)
 */

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';

// ============================================================================
// TYPES
// ============================================================================

export type McqSubject = 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'CSAT' | 'Optional' | 'General';
export type McqDifficulty = 'Easy' | 'Medium' | 'Hard';
export type McqBloomLevel = 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
export type McqSessionType = 'Practice' | 'Mock' | 'PYQ' | 'Adaptive';

export interface QuestionFilters {
  subject?: McqSubject;
  topic?: string;
  subtopic?: string;
  difficulty?: McqDifficulty;
  bloomLevel?: McqBloomLevel;
  year?: number;
  isPyy?: boolean;
  tags?: string[];
  excludeQuestionIds?: string[];
}

export interface Question {
  id: string;
  questionText: { en: string; hi: string };
  options: Array<{ text: { en: string; hi: string } }>;
  correctOption: number;
  explanation?: { en: string; hi: string; keyPoints?: string[] };
  subject: McqSubject;
  topic: string;
  subtopic?: string;
  difficulty: McqDifficulty;
  bloomLevel: McqBloomLevel;
  timeEstimateSec: number;
  marks: number;
  negativeMarks: number;
  year?: number;
  isPyy: boolean;
  tags: string[];
  sourceReferences?: Array<{ title: string; url?: string; page?: string }>;
}

export interface PracticeSessionConfig {
  subject: McqSubject;
  topic?: string;
  difficulty?: McqDifficulty;
  questionCount: number;
  timed: boolean;
  timeLimitSec?: number;
  sessionType: McqSessionType;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_TIME_PER_QUESTION = 90; // seconds
const MAX_QUESTIONS_PER_SESSION = 100;
const MIN_QUESTIONS_PER_SESSION = 5;

// ============================================================================
// QUESTION BANK SERVICE
// ============================================================================

export class QuestionBankService {
  

  constructor() {
  }

  private async getSupabase() {
    return createClient();
  }

  /**
   * Get questions with filters
   */
  async getQuestions(filters: QuestionFilters, limit: number = 20): Promise<Question[]> {
    try {
      let query = (await this.getSupabase())
        .from('mcq_questions')
        .select('*')
        .eq('is_active', true);

      // Apply filters
      if (filters.subject) {
        query = query.eq('subject', filters.subject);
      }

      if (filters.topic) {
        query = query.eq('topic', filters.topic);
      }

      if (filters.subtopic) {
        query = query.eq('subtopic', filters.subtopic);
      }

      if (filters.difficulty) {
        query = query.eq('difficulty', filters.difficulty);
      }

      if (filters.bloomLevel) {
        query = query.eq('bloom_level', filters.bloomLevel);
      }

      if (filters.year) {
        query = query.eq('year', filters.year);
      }

      if (filters.isPyy !== undefined) {
        query = query.eq('is_pyy', filters.isPyy);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      if (filters.excludeQuestionIds && filters.excludeQuestionIds.length > 0) {
        query = query.not('id', 'in', `(${filters.excludeQuestionIds.join(',')})`);
      }

      // Random selection for practice
      query = query.order('RANDOM()').limit(limit);

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch questions:', error);
        throw error;
      }

      return data.map(this.mapQuestion);
    } catch (error) {
      console.error('QuestionBankService.getQuestions error:', error);
      throw error;
    }
  }

  /**
   * Get questions for practice session
   */
  async getPracticeQuestions(config: PracticeSessionConfig): Promise<Question[]> {
    try {
      const filters: QuestionFilters = {
        subject: config.subject,
        topic: config.topic,
        difficulty: config.difficulty,
      };

      // Validate question count
      const questionCount = Math.min(
        Math.max(config.questionCount, MIN_QUESTIONS_PER_SESSION),
        MAX_QUESTIONS_PER_SESSION
      );

      return await this.getQuestions(filters, questionCount);
    } catch (error) {
      console.error('QuestionBankService.getPracticeQuestions error:', error);
      throw error;
    }
  }

  /**
   * Get PYQs by year and subject
   */
  async getPYQs(year: number, subject?: McqSubject, limit: number = 50): Promise<Question[]> {
    try {
      const filters: QuestionFilters = {
        year,
        isPyy: true,
      };

      if (subject) {
        filters.subject = subject;
      }

      return await this.getQuestions(filters, limit);
    } catch (error) {
      console.error('QuestionBankService.getPYQs error:', error);
      throw error;
    }
  }

  /**
   * Get questions for mock test (distributed by difficulty)
   */
  async getMockQuestions(
    subjectDistribution: { GS: number; CSAT: number },
    difficultyDistribution: { Easy: number; Medium: number; Hard: number },
    totalQuestions: number
  ): Promise<Question[]> {
    try {
      const questions: Question[] = [];

      // Calculate questions per difficulty
      const easyCount = Math.round((difficultyDistribution.Easy / 100) * totalQuestions);
      const mediumCount = Math.round((difficultyDistribution.Medium / 100) * totalQuestions);
      const hardCount = totalQuestions - easyCount - mediumCount;

      // Get GS questions
      const gsCount = Math.round((subjectDistribution.GS / 100) * totalQuestions);
      const csatCount = totalQuestions - gsCount;

      // Fetch GS questions by difficulty
      const gsEasy = await this.getQuestions({ subject: 'GS1' as any, difficulty: 'Easy' }, Math.round(easyCount * 0.25));
      const gsMedium = await this.getQuestions({ subject: 'GS1' as any, difficulty: 'Medium' }, Math.round(mediumCount * 0.25));
      const gsHard = await this.getQuestions({ subject: 'GS1' as any, difficulty: 'Hard' }, Math.round(hardCount * 0.25));

      // Fetch CSAT questions
      const csatEasy = await this.getQuestions({ subject: 'CSAT', difficulty: 'Easy' }, Math.round(easyCount * 0.25));
      const csatMedium = await this.getQuestions({ subject: 'CSAT', difficulty: 'Medium' }, Math.round(mediumCount * 0.25));
      const csatHard = await this.getQuestions({ subject: 'CSAT', difficulty: 'Hard' }, Math.round(hardCount * 0.25));

      questions.push(...gsEasy, ...gsMedium, ...gsHard, ...csatEasy, ...csatMedium, ...csatHard);

      // Shuffle and return
      return questions.sort(() => Math.random() - 0.5).slice(0, totalQuestions);
    } catch (error) {
      console.error('QuestionBankService.getMockQuestions error:', error);
      throw error;
    }
  }

  /**
   * Get question by ID
   */
  async getQuestionById(questionId: string): Promise<Question | null> {
    try {
      const { data, error } = await (await this.getSupabase())
        .from('mcq_questions')
        .select('*')
        .eq('id', questionId)
        .single();

      if (error) {
        console.error('Failed to fetch question:', error);
        return null;
      }

      return this.mapQuestion(data);
    } catch (error) {
      console.error('QuestionBankService.getQuestionById error:', error);
      return null;
    }
  }

  /**
   * Get topic list for subject
   */
  async getTopics(subject: McqSubject): Promise<string[]> {
    try {
      const { data, error } = await (await this.getSupabase())
        .from('mcq_questions')
        .select('topic')
        .eq('subject', subject)
        .group('topic');

      if (error) {
        console.error('Failed to fetch topics:', error);
        return [];
      }

      return data.map(d => d.topic).filter(Boolean) as string[];
    } catch (error) {
      console.error('QuestionBankService.getTopics error:', error);
      return [];
    }
  }

  /**
   * Get question count by filters
   */
  async getQuestionCount(filters: QuestionFilters): Promise<number> {
    try {
      let query = (await this.getSupabase()).from('mcq_questions').select('*', { count: 'exact', head: true });

      if (filters.subject) {
        query = query.eq('subject', filters.subject);
      }

      if (filters.topic) {
        query = query.eq('topic', filters.topic);
      }

      if (filters.difficulty) {
        query = query.eq('difficulty', filters.difficulty);
      }

      if (filters.isPyy !== undefined) {
        query = query.eq('is_pyy', filters.isPyy);
      }

      const { count, error } = await query;

      if (error) {
        console.error('Failed to count questions:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('QuestionBankService.getQuestionCount error:', error);
      return 0;
    }
  }

  /**
   * Map database row to Question interface
   */
  private mapQuestion(row: any): Question {
    return {
      id: row.id,
      questionText: row.question_text,
      options: row.options,
      correctOption: row.correct_option,
      explanation: row.explanation,
      subject: row.subject,
      topic: row.topic,
      subtopic: row.subtopic,
      difficulty: row.difficulty,
      bloomLevel: row.bloom_level,
      timeEstimateSec: row.time_estimate_sec,
      marks: row.marks,
      negativeMarks: row.negative_marks,
      year: row.year,
      isPyy: row.is_pyy,
      tags: row.tags || [],
      sourceReferences: row.source_references,
    };
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const questionBank = new QuestionBankService();
