/**
 * MCQ Analytics Service
 * 
 * Master Prompt v8.0 - Feature F7 (READ Mode)
 * - Performance tracking and visualization
 * - Weak area identification
 * - Accuracy trends over time
 * - Speed analysis
 * - Subject-wise breakdown
 * - AI-powered improvement recommendations
 * - 9Router → Groq → Ollama fallback
 */

import { createClient } from '@/lib/supabase/server';
import { callAI } from '@/lib/ai/ai-provider-client';
import type { McqSubject } from './question-bank';

// ============================================================================
// TYPES
// ============================================================================

export interface UserAnalytics {
  overview: AnalyticsOverview;
  subjectBreakdown: SubjectAnalytics[];
  topicBreakdown: TopicAnalytics[];
  accuracyTrend: TrendData[];
  speedTrend: TrendData[];
  weakAreas: AreaAnalysis[];
  strongAreas: AreaAnalysis[];
  recommendations: Recommendation[];
  lastUpdated: string;
}

export interface AnalyticsOverview {
  totalAttempts: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unattempted: number;
  overallAccuracy: number;
  avgScore: number;
  avgTimePerQuestion: number;
  bestSubject: string;
  worstSubject: string;
  currentStreak: number;
  longestStreak: number;
  lastAttemptDate: string | null;
}

export interface SubjectAnalytics {
  subject: McqSubject;
  attempts: number;
  questions: number;
  accuracy: number;
  avgScore: number;
  avgTime: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface TopicAnalytics {
  topic: string;
  subject: McqSubject;
  attempts: number;
  accuracy: number;
  lastAttempt: string;
  masteryLevel: 'beginner' | 'learning' | 'proficient' | 'master';
}

export interface TrendData {
  date: string;
  value: number;
  label?: string;
}

export interface AreaAnalysis {
  area: string;
  subject: McqSubject;
  accuracy: number;
  attempts: number;
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface Recommendation {
  id: string;
  type: 'study' | 'practice' | 'revision' | 'mock';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTimeMin: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MASTERY_THRESHOLDS = {
  BEGINNER: 50,
  LEARNING: 60,
  PROFICIENT: 75,
  MASTER: 90,
};

const ANALYTICS_SYSTEM_PROMPT = `You are an expert UPSC education analyst.

Your role is to analyze student performance data and provide actionable recommendations.

RULES:
1. Be specific and actionable
2. Prioritize weak areas with high UPSC weightage
3. Suggest concrete study actions (topics, question counts, time)
4. Be encouraging but honest
5. Use simple language (10th-class level)
6. Be bilingual (English + Hindi)

FOCUS AREAS:
- Accuracy trends
- Time management
- Subject balance
- Weak topic identification
- Revision scheduling

OUTPUT FORMAT:
Provide 3-5 prioritized recommendations with:
- Type (study/practice/revision/mock)
- Specific topic/action
- Time estimate
- Expected outcome`;

// ============================================================================
// ANALYTICS SERVICE
// ============================================================================

export class AnalyticsService {
  
  constructor() {
    // callAI is used directly as a module-level function
  }

  private async getSupabase() {
    return createClient();
  }

  /**
   * Get comprehensive user analytics
   */
  async getUserAnalytics(userId: string): Promise<UserAnalytics> {
    try {
      const overview = await this.getAnalyticsOverview(userId);
      const subjectBreakdown = await this.getSubjectBreakdown(userId);
      const topicBreakdown = await this.getTopicBreakdown(userId);
      const accuracyTrend = await this.getAccuracyTrend(userId);
      const speedTrend = await this.getSpeedTrend(userId);
      
      const { weakAreas, strongAreas } = await this.identifyAreas(userId, topicBreakdown);
      const recommendations = await this.generateRecommendations(userId, overview, weakAreas);

      return {
        overview,
        subjectBreakdown,
        topicBreakdown,
        accuracyTrend,
        speedTrend,
        weakAreas,
        strongAreas,
        recommendations,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('AnalyticsService.getUserAnalytics error:', error);
      return this.getDefaultAnalytics();
    }
  }

  /**
   * Get analytics overview
   */
  private async getAnalyticsOverview(userId: string): Promise<AnalyticsOverview> {
    try {
      const { data } = await (await this.getSupabase())
        .from('mcq_attempts')
        .select('*')
        .eq('user_id', userId)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false });

      const attempts = (data || []) as any[];

      if (attempts.length === 0) {
        return this.getDefaultOverview();
      }

      const totalAttempts = attempts.length;
      const totalQuestions = attempts.reduce((sum: number, a: any) => sum + (a.total_questions || 0), 0);
      const correctAnswers = attempts.reduce((sum: number, a: any) => sum + (a.correct_answers || 0), 0);
      const incorrectAnswers = attempts.reduce((sum: number, a: any) => sum + (a.incorrect_answers || 0), 0);
      const unattempted = attempts.reduce((sum: number, a: any) => sum + (a.unattempted || 0), 0);
      const overallAccuracy = attempts.reduce((sum: number, a: any) => sum + (a.accuracy_percent || 0), 0) / totalAttempts;
      const avgScore = attempts.reduce((sum: number, a: any) => sum + (a.net_marks || 0), 0) / totalAttempts;
      const avgTimePerQuestion = attempts.reduce((sum: number, a: any) => sum + (a.avg_time_per_question || 0), 0) / totalAttempts;

      // Find best and worst subjects
      const subjectStats = this.calculateSubjectStats(attempts);
      const bestSubject = subjectStats.sort((a, b) => b.accuracy - a.accuracy)[0]?.subject || 'N/A';
      const worstSubject = subjectStats.sort((a, b) => a.accuracy - b.accuracy)[0]?.subject || 'N/A';

      // Calculate streaks
      const currentStreak = this.calculateStreak(attempts, false);
      const longestStreak = this.calculateStreak(attempts, true);

      const lastAttemptDate = attempts[0]?.completed_at || null;

      return {
        totalAttempts,
        totalQuestions,
        correctAnswers,
        incorrectAnswers,
        unattempted,
        overallAccuracy: Math.round(overallAccuracy * 100) / 100,
        avgScore: Math.round(avgScore * 100) / 100,
        avgTimePerQuestion: Math.round(avgTimePerQuestion),
        bestSubject,
        worstSubject,
        currentStreak,
        longestStreak,
        lastAttemptDate,
      };
    } catch (error) {
      console.error('AnalyticsService.getAnalyticsOverview error:', error);
      return this.getDefaultOverview();
    }
  }

  /**
   * Get subject-wise breakdown
   */
  private async getSubjectBreakdown(userId: string): Promise<SubjectAnalytics[]> {
    try {
      const { data } = await (await this.getSupabase())
        .from('mcq_attempts')
        .select('*')
        .eq('user_id', userId)
        .not('completed_at', 'is', null);

      const attempts = (data || []) as any[];

      if (attempts.length === 0) {
        return [];
      }

      const subjectStats = this.calculateSubjectStats(attempts);

      return subjectStats.map(stat => ({
        subject: stat.subject as McqSubject,
        attempts: stat.attempts,
        questions: stat.questions,
        accuracy: stat.accuracy,
        avgScore: stat.avgScore,
        avgTime: stat.avgTime,
        trend: this.calculateTrend(attempts.filter((a: any) => a.subject === stat.subject)),
      }));
    } catch (error) {
      console.error('AnalyticsService.getSubjectBreakdown error:', error);
      return [];
    }
  }

  /**
   * Get topic-wise breakdown
   */
  private async getTopicBreakdown(userId: string): Promise<TopicAnalytics[]> {
    try {
      const { data } = await (await this.getSupabase())
        .from('mcq_attempts')
        .select(`
          *,
          answers:mcq_answers(
            is_correct,
            question:mcq_questions(
              topic,
              subject
            )
          )
        `)
        .eq('user_id', userId)
        .not('completed_at', 'is', null)
        .limit(50);

      const attempts = (data || []) as any[];

      if (attempts.length === 0) {
        return [];
      }

      // Aggregate by topic
      const topicMap = new Map<string, { topic: string; subject: McqSubject; correct: number; total: number; lastAttempt: string }>();

      for (const attempt of attempts) {
        const answers = (attempt as any).answers || [];
        
        for (const answer of answers) {
          const question = answer.question;
          if (!question) continue;

          const key = `${question.subject}-${question.topic}`;
          
          if (!topicMap.has(key)) {
            topicMap.set(key, {
              topic: question.topic,
              subject: question.subject,
              correct: 0,
              total: 0,
              lastAttempt: attempt.completed_at,
            });
          }

          const topicData = topicMap.get(key)!;
          topicData.total++;
          if (answer.is_correct) topicData.correct++;
          if (attempt.completed_at > topicData.lastAttempt) {
            topicData.lastAttempt = attempt.completed_at;
          }
        }
      }

      return Array.from(topicMap.values()).map(data => ({
        topic: data.topic,
        subject: data.subject,
        attempts: data.total,
        accuracy: Math.round((data.correct / data.total) * 100),
        lastAttempt: data.lastAttempt,
        masteryLevel: this.getMasteryLevel(data.correct / data.total),
      }));
    } catch (error) {
      console.error('AnalyticsService.getTopicBreakdown error:', error);
      return [];
    }
  }

  /**
   * Get accuracy trend over time
   */
  private async getAccuracyTrend(userId: string, days: number = 30): Promise<TrendData[]> {
    try {
      const { data } = await (await this.getSupabase())
        .from('mcq_attempts')
        .select('completed_at, accuracy_percent')
        .eq('user_id', userId)
        .not('completed_at', 'is', null)
        .gte('completed_at', new Date(Date.now() - days * 86400000).toISOString())
        .order('completed_at', { ascending: true });

      const attempts = (data || []) as any[];

      if (attempts.length === 0) {
        return [];
      }

      // Group by date
      const dateMap = new Map<string, { sum: number; count: number }>();

      for (const attempt of attempts) {
        const date = attempt.completed_at.split('T')[0];
        
        if (!dateMap.has(date)) {
          dateMap.set(date, { sum: 0, count: 0 });
        }
        
        const data = dateMap.get(date)!;
        data.sum += attempt.accuracy_percent || 0;
        data.count++;
      }

      return Array.from(dateMap.entries()).map(([date, data]) => ({
        date,
        value: Math.round(data.sum / data.count),
      }));
    } catch (error) {
      console.error('AnalyticsService.getAccuracyTrend error:', error);
      return [];
    }
  }

  /**
   * Get speed trend over time
   */
  private async getSpeedTrend(userId: string, days: number = 30): Promise<TrendData[]> {
    try {
      const { data } = await (await this.getSupabase())
        .from('mcq_attempts')
        .select('completed_at, avg_time_per_question')
        .eq('user_id', userId)
        .not('completed_at', 'is', null)
        .gte('completed_at', new Date(Date.now() - days * 86400000).toISOString())
        .order('completed_at', { ascending: true });

      const attempts = (data || []) as any[];

      if (attempts.length === 0) {
        return [];
      }

      return attempts.map((attempt: any) => ({
        date: attempt.completed_at.split('T')[0],
        value: Math.round(attempt.avg_time_per_question || 0),
      }));
    } catch (error) {
      console.error('AnalyticsService.getSpeedTrend error:', error);
      return [];
    }
  }

  /**
   * Identify weak and strong areas
   */
  private async identifyAreas(
    userId: string,
    topicBreakdown: TopicAnalytics[]
  ): Promise<{ weakAreas: AreaAnalysis[]; strongAreas: AreaAnalysis[] }> {
    try {
      const weakAreas: AreaAnalysis[] = [];
      const strongAreas: AreaAnalysis[] = [];

      for (const topic of topicBreakdown) {
        const accuracy = topic.accuracy;
        const priority: 'high' | 'medium' | 'low' = accuracy < 50 ? 'high' : accuracy < 65 ? 'medium' : 'low';

        const area: AreaAnalysis = {
          area: topic.topic,
          subject: topic.subject,
          accuracy,
          attempts: topic.attempts,
          priority,
          recommendation: this.getAreaRecommendation(topic),
        };

        if (accuracy < MASTERY_THRESHOLDS.PROFICIENT) {
          weakAreas.push(area);
        } else if (accuracy >= MASTERY_THRESHOLDS.MASTER) {
          strongAreas.push(area);
        }
      }

      return {
        weakAreas: weakAreas.sort((a, b) => a.accuracy - b.accuracy).slice(0, 10),
        strongAreas: strongAreas.sort((a, b) => b.accuracy - a.accuracy).slice(0, 10),
      };
    } catch (error) {
      console.error('AnalyticsService.identifyAreas error:', error);
      return { weakAreas: [], strongAreas: [] };
    }
  }

  /**
   * Generate AI-powered recommendations
   */
  private async generateRecommendations(
    userId: string,
    overview: AnalyticsOverview,
    weakAreas: AreaAnalysis[]
  ): Promise<Recommendation[]> {
    try {
      const prompt = this.buildRecommendationPrompt(overview, weakAreas);

      const response = await callAI(prompt, {
        system: ANALYTICS_SYSTEM_PROMPT,
        temperature: 0.3,
        maxTokens: 1000,
      });

      return this.parseRecommendations(response);
    } catch (error) {
      console.error('AnalyticsService.generateRecommendations error:', error);
      return this.getDefaultRecommendations(weakAreas);
    }
  }

  /**
   * Build prompt for AI recommendations
   */
  private buildRecommendationPrompt(overview: AnalyticsOverview, weakAreas: AreaAnalysis[]): string {
    return `
STUDENT PERFORMANCE OVERVIEW:
- Total Attempts: ${overview.totalAttempts}
- Overall Accuracy: ${overview.overallAccuracy}%
- Average Score: ${overview.avgScore}
- Average Time/Question: ${overview.avgTimePerQuestion}s
- Best Subject: ${overview.bestSubject}
- Worst Subject: ${overview.worstSubject}
- Current Streak: ${overview.currentStreak} days

WEAK AREAS (Priority Order):
${weakAreas.slice(0, 5).map(area => 
  `- ${area.area} (${area.subject}): ${area.accuracy}% accuracy, ${area.attempts} attempts, Priority: ${area.priority}`
).join('\n')}

Generate 3-5 specific, actionable recommendations for this UPSC aspirant.

Format each recommendation as:
TYPE: [study|practice|revision|mock]
TITLE: [Short title]
DESCRIPTION: [Specific action with topic/question count/time]
PRIORITY: [high|medium|low]
TIME: [minutes]
`;
  }

  /**
   * Parse AI recommendations
   */
  private parseRecommendations(response: string): Recommendation[] {
    try {
      const recommendations: Recommendation[] = [];
      const blocks = response.split(/\n(?=TYPE:)/);

      for (const block of blocks) {
        const typeMatch = block.match(/TYPE:\s*(\w+)/i);
        const titleMatch = block.match(/TITLE:\s*(.+?)(?:\n|$)/i);
        const descMatch = block.match(/DESCRIPTION:\s*(.+?)(?:\n|$)/i);
        const priorityMatch = block.match(/PRIORITY:\s*(\w+)/i);
        const timeMatch = block.match(/TIME:\s*(\d+)/i);

        if (typeMatch && titleMatch && descMatch) {
          recommendations.push({
            id: crypto.randomUUID(),
            type: typeMatch[1].toLowerCase() as any,
            title: titleMatch[1].trim(),
            description: descMatch[1].trim(),
            priority: (priorityMatch?.[1]?.toLowerCase() || 'medium') as any,
            estimatedTimeMin: parseInt(timeMatch?.[1] || '30'),
          });
        }
      }

      return recommendations.slice(0, 5);
    } catch (error) {
      console.error('Failed to parse recommendations:', error);
      return [];
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private calculateSubjectStats(attempts: any[]): Array<{
    subject: string;
    attempts: number;
    questions: number;
    accuracy: number;
    avgScore: number;
    avgTime: number;
  }> {
    const stats = new Map<string, { attempts: 0; questions: 0; accuracySum: 0; scoreSum: 0; timeSum: 0 }>();

    for (const attempt of attempts) {
      const subject = attempt.subject || 'General';
      
      if (!stats.has(subject)) {
        stats.set(subject, { attempts: 0, questions: 0, accuracySum: 0, scoreSum: 0, timeSum: 0 });
      }

      const stat = stats.get(subject)!;
      stat.attempts++;
      stat.questions += attempt.total_questions || 0;
      stat.accuracySum += attempt.accuracy_percent || 0;
      stat.scoreSum += attempt.net_marks || 0;
      stat.timeSum += attempt.avg_time_per_question || 0;
    }

    return Array.from(stats.entries()).map(([subject, stat]) => ({
      subject,
      attempts: stat.attempts,
      questions: stat.questions,
      accuracy: Math.round(stat.accuracySum / stat.attempts),
      avgScore: Math.round((stat.scoreSum / stat.attempts) * 100) / 100,
      avgTime: Math.round(stat.timeSum / stat.attempts),
    }));
  }

  private calculateTrend(attempts: any[]): 'improving' | 'stable' | 'declining' {
    if (attempts.length < 2) return 'stable';

    const sorted = attempts.sort((a, b) => 
      new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    );

    const recent5 = sorted.slice(0, 5);
    const previous5 = sorted.slice(5, 10);

    if (previous5.length === 0) return 'stable';

    const recentAvg = recent5.reduce((sum, a) => sum + (a.accuracy_percent || 0), 0) / recent5.length;
    const previousAvg = previous5.reduce((sum, a) => sum + (a.accuracy_percent || 0), 0) / previous5.length;

    if (recentAvg > previousAvg + 5) return 'improving';
    if (recentAvg < previousAvg - 5) return 'declining';
    return 'stable';
  }

  private getMasteryLevel(accuracyRatio: number): 'beginner' | 'learning' | 'proficient' | 'master' {
    const accuracy = accuracyRatio * 100;
    if (accuracy >= MASTERY_THRESHOLDS.MASTER) return 'master';
    if (accuracy >= MASTERY_THRESHOLDS.PROFICIENT) return 'proficient';
    if (accuracy >= MASTERY_THRESHOLDS.LEARNING) return 'learning';
    return 'beginner';
  }

  private calculateStreak(attempts: any[], longest: boolean): number {
    if (attempts.length === 0) return 0;

    const dates = new Set(attempts.map(a => new Date(a.completed_at).toDateString()));
    
    if (longest) {
      // Calculate longest streak ever
      let maxStreak = 0;
      let currentStreak = 0;
      let prevDate: Date | null = null;

      const sortedDates = Array.from(dates).sort((a, b) => 
        new Date(b).getTime() - new Date(a).getTime()
      );

      for (const dateStr of sortedDates) {
        const date = new Date(dateStr);
        
        if (prevDate) {
          const diff = Math.round((prevDate.getTime() - date.getTime()) / 86400000);
          if (diff === 1) {
            currentStreak++;
          } else {
            maxStreak = Math.max(maxStreak, currentStreak);
            currentStreak = 1;
          }
        } else {
          currentStreak = 1;
        }
        
        prevDate = date;
      }

      return Math.max(maxStreak, currentStreak);
    } else {
      // Calculate current streak
      let streak = 0;
      let currentDate = new Date();

      if (!dates.has(currentDate.toDateString())) {
        currentDate.setDate(currentDate.getDate() - 1);
      }

      while (dates.has(currentDate.toDateString())) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      }

      return streak;
    }
  }

  private getAreaRecommendation(topic: TopicAnalytics): string {
    if (topic.accuracy < 50) {
      return `Focus on ${topic.topic} - practice 20+ questions and review fundamentals`;
    } else if (topic.accuracy < 65) {
      return `Improve ${topic.topic} - practice 10-15 questions with explanations`;
    } else if (topic.accuracy < 75) {
      return `Strengthen ${topic.topic} - occasional revision recommended`;
    }
    return `Maintain ${topic.topic} - regular practice to keep mastery`;
  }

  private getDefaultAnalytics(): UserAnalytics {
    return {
      overview: this.getDefaultOverview(),
      subjectBreakdown: [],
      topicBreakdown: [],
      accuracyTrend: [],
      speedTrend: [],
      weakAreas: [],
      strongAreas: [],
      recommendations: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  private getDefaultOverview(): AnalyticsOverview {
    return {
      totalAttempts: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      unattempted: 0,
      overallAccuracy: 0,
      avgScore: 0,
      avgTimePerQuestion: 0,
      bestSubject: 'N/A',
      worstSubject: 'N/A',
      currentStreak: 0,
      longestStreak: 0,
      lastAttemptDate: null,
    };
  }

  private getDefaultRecommendations(weakAreas: AreaAnalysis[]): Recommendation[] {
    return weakAreas.slice(0, 3).map(area => ({
      id: crypto.randomUUID(),
      type: 'practice' as const,
      title: `Practice ${area.area}`,
      description: area.recommendation,
      priority: area.priority,
      estimatedTimeMin: 30,
    }));
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const analytics = new AnalyticsService();
