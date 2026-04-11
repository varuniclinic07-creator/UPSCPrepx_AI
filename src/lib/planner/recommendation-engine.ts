/**
 * Study Recommendation Engine Service
 * 
 * Master Prompt v8.0 - Feature F8 (READ Mode)
 * - AI-powered task suggestions
 * - Based on weak areas from MCQ analytics
 * - Personalized recommendations
 * - Bilingual output
 */

import { createClient } from '@supabase/supabase-js';
import { callAI } from '@/lib/ai/ai-provider-client';

// ============================================================================
// TYPES
// ============================================================================

interface RecommendationInput {
  userId: string;
  weakSubjects: string[];
  weakTopics: string[];
  mcqAccuracy: number;
  daysUntilExam: number;
  currentStreak: number;
  studyPlanId?: string;
}

interface TaskRecommendation {
  type: 'study' | 'revision' | 'mock_test' | 'analysis';
  subject: string;
  topic: string;
  subtopic?: string;
  priority: 'high' | 'medium' | 'low';
  estimatedMinutes: number;
  reason: { en: string; hi: string };
  contentLinks?: string[];
}

interface RecommendationResponse {
  recommendations: TaskRecommendation[];
  motivationalMessage: { en: string; hi: string };
  studyTips: Array<{ en: string; hi: string }>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const RECOMMENDATION_PROMPT = `You are an expert UPSC study advisor. Provide personalized study recommendations.

IMPORTANT RULES:
1. Use SIMPLIFIED language (10th grade reading level)
2. Provide both English and Hindi versions
3. Be encouraging and motivational
4. Focus on weak areas first
5. Consider exam timeline

INPUT:
- Weak Subjects: {weak_subjects}
- Weak Topics: {weak_topics}
- MCQ Accuracy: {accuracy}%
- Days Until Exam: {days}
- Current Streak: {streak} days

OUTPUT FORMAT (JSON):
{
  "recommendations": [
    {
      "type": "study|revision|mock_test|analysis",
      "subject": "GS2",
      "topic": "Polity",
      "subtopic": "Fundamental Rights",
      "priority": "high",
      "estimated_minutes": 90,
      "reason": {
        "en": "Your accuracy in Polity is 45%. Focus on Fundamental Rights.",
        "hi": "आपकी Polity में सटीकता 45% है। Fundamental Rights पर ध्यान दें।"
      }
    }
  ],
  "motivational_message": {
    "en": "You're on a {streak}-day streak! Keep going, success is near!",
    "hi": "आप {streak} दिन की streak पर हैं! जारी रखें, सफलता पास है!"
  },
  "study_tips": [
    {
      "en": "Break difficult topics into smaller chunks",
      "hi": "कठिन विषयों को छोटे हिस्सों में बांटें"
    }
  ]
}

Generate 3-5 actionable recommendations.`;

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class RecommendationEngineService {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Get personalized recommendations
   */
  async getRecommendations(input: RecommendationInput): Promise<RecommendationResponse> {
    // Fetch MCQ analytics for deeper insights
    const mcqAnalytics = await this.getMCQAnalytics(input.userId);

    // Prepare AI prompt
    const prompt = RECOMMENDATION_PROMPT
      .replace('{weak_subjects}', input.weakSubjects.join(', '))
      .replace('{weak_topics}', input.weakTopics.join(', '))
      .replace('{accuracy}', input.mcqAccuracy.toString())
      .replace('{days}', input.daysUntilExam.toString())
      .replace('{streak}', input.currentStreak.toString());

    // Generate recommendations using AI
    const aiResponse = await callAI({
      prompt,
      provider: '9router',
      temperature: 0.7,
      maxTokens: 2000,
    });

    // Parse AI response
    const recommendations = this.parseAIResponse(aiResponse);

    // Add content links from our platform
    await this.addContentLinks(recommendations.recommendations);

    return recommendations;
  }

  /**
   * Get daily recommendations (quick version)
   */
  async getDailyRecommendations(userId: string): Promise<TaskRecommendation[]> {
    // Get today's incomplete tasks
    const today = new Date().toISOString().split('T')[0];
    
    const { data: incompleteTasks } = await this.supabase
      .from('study_tasks')
      .select('*, schedules:study_schedules(plan_id)')
      .eq('status', 'pending')
      .in(
        'schedule_id',
        (await this.supabase
          .from('study_schedules')
          .select('id')
          .eq('date', today)).data?.map((s) => s.id) || []
      )
      .limit(5);

    if (!incompleteTasks || incompleteTasks.length === 0) {
      // All tasks done - suggest revision
      return this.generateRevisionSuggestions(userId);
    }

    // Convert to recommendations
    return incompleteTasks.map((task) => ({
      type: task.task_type as 'study' | 'revision' | 'mock_test' | 'analysis',
      subject: task.subject,
      topic: task.topic,
      subtopic: task.subtopic || undefined,
      priority: 'high' as const,
      estimatedMinutes: task.estimated_minutes,
      reason: {
        en: `Scheduled for today - ${task.topic}`,
        hi: `आज के लिए निर्धारित - ${task.topic}`,
      },
      contentLinks: task.content_links || [],
    }));
  }

  /**
   * Get MCQ analytics for user
   */
  private async getMCQAnalytics(userId: string): Promise<{
    subjectAccuracy: Record<string, number>;
    weakTopics: string[];
    totalAttempts: number;
  }> {
    // Get recent MCQ attempts
    const { data: attempts } = await this.supabase
      .from('mcq_attempts')
      .select('subject, topic, is_correct')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!attempts || attempts.length === 0) {
      return { subjectAccuracy: {}, weakTopics: [], totalAttempts: 0 };
    }

    // Calculate accuracy by subject
    const subjectStats: Record<string, { correct: number; total: number }> = {};
    const topicStats: Record<string, { correct: number; total: number }> = {};

    attempts.forEach((attempt) => {
      // Subject stats
      if (!subjectStats[attempt.subject]) {
        subjectStats[attempt.subject] = { correct: 0, total: 0 };
      }
      subjectStats[attempt.subject].total++;
      if (attempt.is_correct) {
        subjectStats[attempt.subject].correct++;
      }

      // Topic stats
      const topicKey = `${attempt.subject}:${attempt.topic || 'Unknown'}`;
      if (!topicStats[topicKey]) {
        topicStats[topicKey] = { correct: 0, total: 0 };
      }
      topicStats[topicKey].total++;
      if (attempt.is_correct) {
        topicStats[topicKey].correct++;
      }
    });

    // Calculate accuracy percentages
    const subjectAccuracy: Record<string, number> = {};
    Object.entries(subjectStats).forEach(([subject, stats]) => {
      subjectAccuracy[subject] = Math.round((stats.correct / stats.total) * 100);
    });

    // Find weak topics (< 50% accuracy)
    const weakTopics = Object.entries(topicStats)
      .filter(([_, stats]) => stats.total >= 3 && (stats.correct / stats.total) < 0.5)
      .map(([key, _]) => key.split(':')[1])
      .slice(0, 5);

    return {
      subjectAccuracy,
      weakTopics,
      totalAttempts: attempts.length,
    };
  }

  /**
   * Parse AI response into structured data
   */
  private parseAIResponse(response: string): RecommendationResponse {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      // Return fallback recommendations
      return this.getFallbackRecommendations();
    }
  }

  /**
   * Get fallback recommendations if AI fails
   */
  private getFallbackRecommendations(): RecommendationResponse {
    return {
      recommendations: [
        {
          type: 'revision',
          subject: 'GS2',
          topic: 'Polity',
          subtopic: 'Fundamental Rights',
          priority: 'high',
          estimatedMinutes: 60,
          reason: {
            en: 'Important topic for UPSC Mains',
            hi: 'UPSC Mains के लिए महत्वपूर्ण विषय',
          },
        },
        {
          type: 'study',
          subject: 'GS3',
          topic: 'Economy',
          subtopic: 'Budget Analysis',
          priority: 'medium',
          estimatedMinutes: 90,
          reason: {
            en: 'Current affairs integration needed',
            hi: 'करंट अफेयर्स एकीकरण आवश्यक',
          },
        },
      ],
      motivationalMessage: {
        en: 'Keep studying consistently! Every hour counts.',
        hi: 'लगातार अध्यान करते रहें! हर घंटा मायने रखता है।',
      },
      studyTips: [
        {
          en: 'Take short breaks every 50 minutes',
          hi: 'हर 50 मिनट में छोटे ब्रेक लें',
        },
        {
          en: 'Revise before sleeping for better retention',
          hi: 'बेहतर याददाश्त के लिए सोने से पहले रिविजन करें',
        },
      ],
    };
  }

  /**
   * Add content links from our platform
   */
  private async addContentLinks(recommendations: TaskRecommendation[]): Promise<void> {
    for (const rec of recommendations) {
      // Search for related notes
      const { data: notes } = await this.supabase
        .from('user_notes')
        .select('id, title')
        .ilike('topic', `%${rec.topic}%`)
        .limit(2);

      if (notes) {
        rec.contentLinks = notes.map((note) => `/my-notes/${note.id}`);
      }

      // Search for related current affairs
      const { data: ca } = await this.supabase
        .from('ca_articles')
        .select('id, title')
        .ilike('topic', `%${rec.topic}%`)
        .limit(2);

      if (ca) {
        rec.contentLinks = [
          ...(rec.contentLinks || []),
          ...ca.map((article) => `/daily-digest/article/${article.id}`),
        ];
      }
    }
  }

  /**
   * Generate revision suggestions when all tasks are done
   */
  private async generateRevisionSuggestions(userId: string): Promise<TaskRecommendation[]> {
    // Get recently completed topics
    const { data: completions } = await this.supabase
      .from('study_completions')
      .select('*, tasks:study_tasks(subject, topic)')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(10);

    const suggestions: TaskRecommendation[] = [];

    if (completions && completions.length > 0) {
      // Suggest revision of recently studied topics
      const recentTopics = completions.slice(0, 3).map((c) => ({
        type: 'revision' as const,
        subject: (c.tasks as any)?.subject || 'General',
        topic: (c.tasks as any)?.topic || 'General Revision',
        priority: 'medium' as const,
        estimatedMinutes: 45,
        reason: {
          en: 'Spaced repetition for better retention',
          hi: 'बेहतर याददाश्त के लिए स्पेस्ड रिपीटीशन',
        },
      }));

      suggestions.push(...recentTopics);
    }

    // Add mock test suggestion
    suggestions.push({
      type: 'mock_test',
      subject: 'Full Mock',
      topic: 'GS Mock Test',
      priority: 'medium',
      estimatedMinutes: 120,
      reason: {
        en: 'Test your overall preparation',
        hi: 'अपनी समग्र तैयारी का परीक्षण करें',
      },
    });

    return suggestions;
  }

  /**
   * Get subject-specific recommendations
   */
  async getSubjectRecommendations(
    userId: string,
    subject: string
  ): Promise<TaskRecommendation[]> {
    // Get user's performance in this subject
    const { data: attempts } = await this.supabase
      .from('mcq_attempts')
      .select('topic, is_correct')
      .eq('user_id', userId)
      .eq('subject', subject)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!attempts || attempts.length === 0) {
      return [
        {
          type: 'study',
          subject,
          topic: 'Basic Concepts',
          priority: 'high',
          estimatedMinutes: 90,
          reason: {
            en: `Start with ${subject} fundamentals`,
            hi: `${subject} की मूल बातों से शुरुआत करें`,
          },
        },
      ];
    }

    // Calculate topic-wise accuracy
    const topicStats: Record<string, { correct: number; total: number }> = {};
    attempts.forEach((attempt) => {
      const topic = attempt.topic || 'General';
      if (!topicStats[topic]) {
        topicStats[topic] = { correct: 0, total: 0 };
      }
      topicStats[topic].total++;
      if (attempt.is_correct) {
        topicStats[topic].correct++;
      }
    });

    // Find weakest topics
    const weakTopics = Object.entries(topicStats)
      .filter(([_, stats]) => stats.total >= 3 && (stats.correct / stats.total) < 0.6)
      .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))
      .slice(0, 3)
      .map(([topic, _]) => topic);

    return weakTopics.map((topic) => ({
      type: 'revision' as const,
      subject,
      topic,
      priority: 'high' as const,
      estimatedMinutes: 60,
      reason: {
        en: `Your accuracy in ${topic} needs improvement`,
        hi: `${topic} में आपकी सटीकता में सुधार की आवश्यकता है`,
      },
    }));
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const recommendationEngine = new RecommendationEngineService();
