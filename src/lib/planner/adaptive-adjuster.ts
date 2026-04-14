/**
 * Adaptive Schedule Adjuster Service
 * 
 * Master Prompt v8.0 - Feature F8 (READ Mode)
 * - Detect schedule deviations
 * - Recommend adjustments
 * - Reschedule tasks automatically
 * - Bilingual explanations
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { callAI } from '@/lib/ai/ai-provider-client';

// ============================================================================
// TYPES
// ============================================================================

interface ScheduleStatus {
  planId: string;
  daysBehind: number; // Negative = ahead, Positive = behind
  completionRate: number;
  expectedCompletionDate: string;
  originalExamDate: string;
  isOnTrack: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface AdjustmentRecommendation {
  type: 'add_hours' | 'extend_date' | 'add_revision' | 'skip_topics' | 'intensify';
  priority: 'high' | 'medium' | 'low';
  description: { en: string; hi: string };
  impact: { en: string; hi: string };
  estimatedDaysSaved?: number;
}

interface AdjustmentResult {
  success: boolean;
  tasksRescheduled: number;
  tasksAdded: number;
  tasksRemoved: number;
  newExamDate?: string;
  message: { en: string; hi: string };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ADJUSTMENT_PROMPT = `Analyze user's study schedule performance and recommend adjustments.

IMPORTANT RULES:
1. Use SIMPLIFIED language (10th grade reading level)
2. Provide both English and Hindi versions
3. Be encouraging, not discouraging
4. Focus on achievable goals
5. Consider user's wellbeing

INPUT:
- Days Behind/Ahead: {days_delta} (negative = ahead, positive = behind)
- Completion Rate: {completion_rate}%
- MCQ Accuracy: {accuracy}%
- Current Streak: {streak} days
- Days Until Exam: {days_until_exam}
- Study Hours Per Day: {daily_hours}

OUTPUT FORMAT (JSON):
{
  "risk_level": "low|medium|high|critical",
  "recommendations": [
    {
      "type": "add_hours|extend_date|add_revision|skip_topics|intensify",
      "priority": "high|medium|low",
      "description": {
        "en": "Increase daily study time by 1 hour",
        "hi": "दैनिक अध्ययन समय 1 घंटा बढ़ाएं"
      },
      "impact": {
        "en": "Will help you catch up in 2 weeks",
        "hi": "2 सप्ताह में आप पकड़ बना लेंगे"
      },
      "estimated_days_saved": 5
    }
  ],
  "motivational_message": {
    "en": "You're doing great! Small adjustments will keep you on track.",
    "hi": "आप बहुत अच्छा कर रहे हैं! छोटे समायोजन आपको ट्रैक पर रखेंगे।"
  }
}

Generate 2-4 actionable recommendations.`;

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class AdaptiveAdjusterService {
  private supabase: ReturnType<typeof createClient<Database>>;

  constructor() {
    this.supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Analyze schedule status
   */
  async analyzeScheduleStatus(planId: string): Promise<ScheduleStatus> {
    // Get plan details
    const { data: planRaw } = await this.supabase
      .from('study_plans')
      .select('*')
      .eq('id', planId)
      .single();

    const plan = planRaw as any;
    if (!plan) {
      throw new Error('Study plan not found');
    }

    const today = new Date().toISOString().split('T')[0];
    const examDate = new Date(plan.exam_date);
    const startDate = new Date(plan.created_at);
    
    const totalDays = Math.ceil((examDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.ceil((examDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    // Get schedule IDs for this plan up to today
    const scheduleResult = await this.supabase
      .from('study_schedules')
      .select('id')
      .eq('plan_id', planId)
      .lte('date', today);
    const scheduleIds = (scheduleResult.data as any[] | null)?.map((s: any) => s.id) || [];

    // Get scheduled vs completed tasks
    const { count: totalScheduled } = await this.supabase
      .from('study_tasks')
      .select('*', { count: 'exact', head: true })
      .in('schedule_id', scheduleIds);

    const { count: completedTasks } = await this.supabase
      .from('study_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .in('schedule_id', scheduleIds);

    const completionRate = totalScheduled && totalScheduled > 0
      ? Math.round(((completedTasks || 0) / totalScheduled) * 100)
      : 0;

    // Expected completion rate at this point
    const expectedRate = Math.round((daysElapsed / totalDays) * 100);
    
    // Calculate days behind/ahead
    const daysDelta = Math.round(
      ((expectedRate - completionRate) / 100) * totalDays
    );

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (daysDelta > 14) riskLevel = 'critical';
    else if (daysDelta > 7) riskLevel = 'high';
    else if (daysDelta > 3) riskLevel = 'medium';

    // Calculate expected completion date
    const expectedCompletionDate = new Date(examDate);
    if (daysDelta > 0) {
      expectedCompletionDate.setDate(expectedCompletionDate.getDate() + daysDelta);
    }

    return {
      planId,
      daysBehind: daysDelta,
      completionRate,
      expectedCompletionDate: expectedCompletionDate.toISOString().split('T')[0],
      originalExamDate: plan.exam_date,
      isOnTrack: daysDelta <= 3,
      riskLevel,
    };
  }

  /**
   * Get AI-powered adjustment recommendations
   */
  async getRecommendations(planId: string): Promise<{
    status: ScheduleStatus;
    recommendations: AdjustmentRecommendation[];
    motivationalMessage: { en: string; hi: string };
  }> {
    const status = await this.analyzeScheduleStatus(planId);

    // Get user's MCQ accuracy
    const { data: planDataRaw } = await this.supabase
      .from('study_plans')
      .select('user_id, daily_study_hours, exam_date')
      .eq('id', planId)
      .single();

    const planData = planDataRaw as any;
    if (!planData) {
      throw new Error('Plan not found');
    }

    const mcqAccuracy = await this.getUserMCQAccuracy(planData.user_id);
    const streakInfo = await this.getUserStreak(planData.user_id);
    const daysUntilExam = Math.ceil(
      (new Date(planData.exam_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    // Prepare AI prompt
    const prompt = ADJUSTMENT_PROMPT
      .replace('{days_delta}', status.daysBehind.toString())
      .replace('{completion_rate}', status.completionRate.toString())
      .replace('{accuracy}', mcqAccuracy.toString())
      .replace('{streak}', streakInfo.currentStreak.toString())
      .replace('{days_until_exam}', daysUntilExam.toString())
      .replace('{daily_hours}', planData.daily_study_hours.toString());

    // Generate recommendations using AI
    const aiResponse = await callAI({
      prompt,
      temperature: 0.7,
      maxTokens: 2000,
    });

    // Parse AI response
    const recommendations = this.parseAIResponse(aiResponse);

    return {
      status,
      recommendations,
      motivationalMessage: { en: '', hi: '' }, // Would be in full implementation
    };
  }

  /**
   * Apply schedule adjustments
   */
  async applyAdjustments(
    planId: string,
    adjustmentType: 'add_hours' | 'extend_date' | 'add_revision' | 'intensify',
    options?: {
      additionalHoursPerDay?: number;
      newExamDate?: string;
      skipLowPriorityTopics?: boolean;
    }
  ): Promise<AdjustmentResult> {
    const status = await this.analyzeScheduleStatus(planId);

    if (!status.isOnTrack && adjustmentType === 'add_revision') {
      // Add extra revision sessions for weak areas
      return this.addRevisionSessions(planId, status);
    }

    if (adjustmentType === 'extend_date' && options?.newExamDate) {
      // Update exam date in plan
      return this.extendExamDate(planId, options.newExamDate);
    }

    if (adjustmentType === 'add_hours' && options?.additionalHoursPerDay) {
      // Update daily hours and reschedule
      return this.increaseDailyHours(planId, options.additionalHoursPerDay);
    }

    if (adjustmentType === 'intensify') {
      // Add more tasks per day
      return this.intensifySchedule(planId);
    }

    return {
      success: false,
      tasksRescheduled: 0,
      tasksAdded: 0,
      tasksRemoved: 0,
      message: {
        en: 'No adjustments applied',
        hi: 'कोई समायोजन लागू नहीं किया गया',
      },
    };
  }

  /**
   * Add revision sessions for weak areas
   */
  private async addRevisionSessions(
    planId: string,
    status: ScheduleStatus
  ): Promise<AdjustmentResult> {
    // Get weak subjects from MCQ analytics
    const { data: plan } = await this.supabase
      .from('study_plans')
      .select('user_id')
      .eq('id', planId)
      .single();

    if (!plan) {
      return {
        success: false,
        tasksRescheduled: 0,
        tasksAdded: 0,
        tasksRemoved: 0,
        message: {
          en: 'Plan not found',
          hi: 'योजना नहीं मिली',
        },
      };
    }

    // Get weak subjects (simplified - would use MCQ analytics in production)
    const weakSubjects = ['GS2', 'GS3']; // Would be dynamic

    let tasksAdded = 0;

    // Add revision tasks for next 7 days
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      // Get or create schedule for this date
      const { data: scheduleRaw } = await this.supabase
        .from('study_schedules')
        .select('id')
        .eq('plan_id', planId)
        .eq('date', dateStr)
        .single();

      const schedule = scheduleRaw as any;
      if (schedule) {
        // Add revision task for weak subject
        const subject = weakSubjects[i % weakSubjects.length];
        await (this.supabase.from('study_tasks') as any).insert({
          schedule_id: schedule.id,
          task_type: 'revision',
          subject,
          topic: `${subject} Weak Areas Revision`,
          estimated_minutes: 60,
          order_index: 100 + i, // Add at end of day
          ai_generated: true,
        });
        tasksAdded++;
      }
    }

    // Record adjustment
    await (this.supabase.from('schedule_adjustments') as any).insert({
      plan_id: planId,
      reason: 'poor_performance',
      tasks_added: tasksAdded,
      ai_recommendations: { weakSubjects },
    });

    return {
      success: true,
      tasksRescheduled: 0,
      tasksAdded,
      tasksRemoved: 0,
      message: {
        en: `Added ${tasksAdded} revision sessions for weak areas`,
        hi: `कमजोर क्षेत्रों के लिए ${tasksAdded} रिविजन सत्र जोड़े गए`,
      },
    };
  }

  /**
   * Extend exam date
   */
  private async extendExamDate(
    planId: string,
    newExamDate: string
  ): Promise<AdjustmentResult> {
    const { data: extendPlanRaw } = await this.supabase
      .from('study_plans')
      .select('exam_date')
      .eq('id', planId)
      .single();

    const extendPlan = extendPlanRaw as any;
    if (!extendPlan) {
      return {
        success: false,
        tasksRescheduled: 0,
        tasksAdded: 0,
        tasksRemoved: 0,
        message: {
          en: 'Plan not found',
          hi: 'योजना नहीं मिली',
        },
      };
    }

    // Update exam date
    await (this.supabase
      .from('study_plans') as any)
      .update({ exam_date: newExamDate })
      .eq('id', planId);

    // Record adjustment
    await (this.supabase.from('schedule_adjustments') as any).insert({
      plan_id: planId,
      reason: 'behind_schedule',
      old_exam_date: extendPlan.exam_date,
      new_exam_date: newExamDate,
    });

    return {
      success: true,
      tasksRescheduled: 0,
      tasksAdded: 0,
      tasksRemoved: 0,
      newExamDate,
      message: {
        en: `Exam date extended to ${new Date(newExamDate).toLocaleDateString()}`,
        hi: `परीक्षा तिथि ${new Date(newExamDate).toLocaleDateString()} तक बढ़ाई गई`,
      },
    };
  }

  /**
   * Increase daily study hours
   */
  private async increaseDailyHours(
    planId: string,
    additionalHours: number
  ): Promise<AdjustmentResult> {
    const { data: hoursPlanRaw } = await this.supabase
      .from('study_plans')
      .select('daily_study_hours')
      .eq('id', planId)
      .single();

    const hoursPlan = hoursPlanRaw as any;
    if (!hoursPlan) {
      return {
        success: false,
        tasksRescheduled: 0,
        tasksAdded: 0,
        tasksRemoved: 0,
        message: {
          en: 'Plan not found',
          hi: 'योजना नहीं मिली',
        },
      };
    }

    // Update daily hours
    await (this.supabase
      .from('study_plans') as any)
      .update({ daily_study_hours: hoursPlan.daily_study_hours + additionalHours })
      .eq('id', planId);

    // Would reschedule tasks here to fill additional hours
    // Simplified for now

    return {
      success: true,
      tasksRescheduled: 0,
      tasksAdded: 0,
      tasksRemoved: 0,
      message: {
        en: `Daily study hours increased by ${additionalHours} hours`,
        hi: `दैनिक अध्ययन घंटे ${additionalHours} घंटे बढ़ाए गए`,
      },
    };
  }

  /**
   * Intensify schedule (more tasks per day)
   */
  private async intensifySchedule(planId: string): Promise<AdjustmentResult> {
    // Get upcoming schedules
    const today = new Date().toISOString().split('T')[0];
    
    const { data: schedulesRaw } = await this.supabase
      .from('study_schedules')
      .select('id, date')
      .eq('plan_id', planId)
      .gte('date', today)
      .limit(14); // Next 2 weeks

    const schedules = schedulesRaw as any[] | null;
    if (!schedules || schedules.length === 0) {
      return {
        success: false,
        tasksRescheduled: 0,
        tasksAdded: 0,
        tasksRemoved: 0,
        message: {
          en: 'No upcoming schedules found',
          hi: 'कोई आगामी अनुसूची नहीं मिली',
        },
      };
    }

    let tasksAdded = 0;

    // Add 1-2 extra tasks per day
    for (const schedule of schedules) {
      await (this.supabase.from('study_tasks') as any).insert({
        schedule_id: schedule.id,
        task_type: 'study',
        subject: 'GS',
        topic: 'Additional Practice Session',
        estimated_minutes: 45,
        order_index: 100,
        ai_generated: true,
      });
      tasksAdded++;
    }

    return {
      success: true,
      tasksRescheduled: 0,
      tasksAdded,
      tasksRemoved: 0,
      message: {
        en: `Added ${tasksAdded} extra practice sessions`,
        hi: `${tasksAdded} अतिरिक्त अभ्यास सत्र जोड़े गए`,
      },
    };
  }

  /**
   * Get user's MCQ accuracy
   */
  private async getUserMCQAccuracy(userId: string): Promise<number> {
    const { data: attemptsRaw } = await this.supabase
      .from('mcq_attempts')
      .select('is_correct')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    const attempts = attemptsRaw as any[] | null;
    if (!attempts || attempts.length === 0) {
      return 50; // Default
    }

    const correct = attempts.filter((a: any) => a.is_correct).length;
    return Math.round((correct / attempts.length) * 100);
  }

  /**
   * Get user's streak info
   */
  private async getUserStreak(userId: string): Promise<{ currentStreak: number }> {
    // Simplified - would use progress tracker in production
    return { currentStreak: 0 };
  }

  /**
   * Parse AI response
   */
  private parseAIResponse(response: string): AdjustmentRecommendation[] {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found');
      }

      const data = JSON.parse(jsonMatch[0]);
      return data.recommendations || [];
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return this.getFallbackRecommendations();
    }
  }

  /**
   * Get fallback recommendations
   */
  private getFallbackRecommendations(): AdjustmentRecommendation[] {
    return [
      {
        type: 'add_hours',
        priority: 'high',
        description: {
          en: 'Add 1 extra hour of study daily',
          hi: 'दैनिक 1 अतिरिक्त घंटा अध्ययन जोड़ें',
        },
        impact: {
          en: 'Will help you catch up gradually',
          hi: 'धीरे-धीरे पकड़ बनाने में मदद मिलेगी',
        },
        estimatedDaysSaved: 7,
      },
      {
        type: 'add_revision',
        priority: 'medium',
        description: {
          en: 'Focus on weak area revision',
          hi: 'कमजोर क्षेत्र के रिविजन पर ध्यान दें',
        },
        impact: {
          en: 'Improves accuracy in weak subjects',
          hi: 'कमजोर विषयों में सटीकता बढ़ाता है',
        },
      },
    ];
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const adaptiveAdjuster = new AdaptiveAdjusterService();
