/**
 * Study Progress Tracker Service
 * 
 * Master Prompt v8.0 - Feature F8 (READ Mode)
 * - Track task completions
 * - Calculate streaks
 * - Daily/weekly progress
 * - XP rewards
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// ============================================================================
// TYPES
// ============================================================================

interface TaskCompletionInput {
  taskId: string;
  userId: string;
  timeSpentMinutes: number;
  qualityRating?: number; // 1-5
  notes?: string;
}

interface DailyProgress {
  date: string;
  totalTasks: number;
  completedTasks: number;
  totalMinutes: number;
  xpEarned: number;
  streakDays: number;
}

interface WeeklyProgress {
  weekStart: string;
  weekEnd: string;
  totalTasks: number;
  completedTasks: number;
  subjectBreakdown: {
    subject: string;
    minutes: number;
    tasks: number;
  }[];
  averageDailyMinutes: number;
}

interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  isOnStreak: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const XP_REWARDS = {
  TASK_COMPLETION: 10,
  QUALITY_BONUS: { 5: 10, 4: 5, 3: 0, 2: 0, 1: 0 },
  STREAK_BONUS: { 7: 50, 14: 100, 30: 250, 100: 1000 },
  MOCK_TEST: 50,
  REVISION: 5,
};

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class ProgressTrackerService {
  private supabase: ReturnType<typeof createClient<Database>>;

  constructor() {
    this.supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Mark task as complete
   */
  async completeTask(input: TaskCompletionInput): Promise<{
    success: boolean;
    xpEarned: number;
    streakDays: number;
    dailyProgress: DailyProgress;
  }> {
    const xpEarned = this.calculateXP(input);

    // Record completion
    const { error: completionError } = await this.supabase
      .from('study_completions')
      .insert({
        user_id: input.userId,
        task_id: input.taskId,
        time_spent_minutes: input.timeSpentMinutes,
        quality_rating: input.qualityRating,
        notes: input.notes,
        xp_earned: xpEarned,
      });

    if (completionError) {
      console.error('Failed to record completion:', completionError);
      throw completionError;
    }

    // Update task status
    await this.supabase
      .from('study_tasks')
      .update({
        status: 'completed',
        actual_minutes: input.timeSpentMinutes,
        completed_at: new Date().toISOString(),
      })
      .eq('id', input.taskId);

    // Get daily progress
    const dailyProgress = await this.getDailyProgress(
      input.userId,
      new Date().toISOString().split('T')[0]
    );

    // Get streak info
    const streakInfo = await this.getStreakInfo(input.userId);

    return {
      success: true,
      xpEarned,
      streakDays: streakInfo.currentStreak,
      dailyProgress,
    };
  }

  /**
   * Calculate XP for task completion
   */
  private calculateXP(input: TaskCompletionInput): number {
    let xp = XP_REWARDS.TASK_COMPLETION;

    // Quality bonus
    if (input.qualityRating) {
      xp += XP_REWARDS.QUALITY_BONUS[input.qualityRating as keyof typeof XP_REWARDS.QUALITY_BONUS] || 0;
    }

    // Mock test bonus
    // (Need to fetch task type - simplified here)
    xp += XP_REWARDS.MOCK_TEST; // Would conditionally add

    return xp;
  }

  /**
   * Get daily progress for a specific date
   */
  async getDailyProgress(userId: string, date: string): Promise<DailyProgress> {
    // Get completions for the date
    const { data: completions } = await this.supabase
      .from('study_completions')
      .select('*, tasks:study_tasks(task_type, subject)')
      .eq('user_id', userId)
      .gte('completed_at', `${date}T00:00:00`)
      .lte('completed_at', `${date}T23:59:59`);

    // Get scheduled tasks for the date
    const { data: schedules } = await this.supabase
      .from('study_schedules')
      .select('total_tasks, completed_tasks')
      .eq('date', date)
      .in(
        'plan_id',
        (await this.supabase
          .from('study_plans')
          .select('id')
          .eq('user_id', userId)
          .eq('is_active', true)).data?.map((p) => p.id) || []
      );

    const totalTasks = schedules?.reduce((sum, s) => sum + (s.total_tasks ?? 0), 0) || 0;
    const completedTasks = completions?.length || 0;
    const totalMinutes = completions?.reduce((sum, c) => sum + (c.time_spent_minutes || 0), 0) || 0;
    const xpEarned = completions?.reduce((sum, c) => sum + (c.xp_earned || 0), 0) || 0;

    const streakInfo = await this.getStreakInfo(userId);

    return {
      date,
      totalTasks,
      completedTasks,
      totalMinutes,
      xpEarned,
      streakDays: streakInfo.currentStreak,
    };
  }

  /**
   * Get weekly progress
   */
  async getWeeklyProgress(userId: string, weekStart?: string): Promise<WeeklyProgress> {
    const start = weekStart
      ? new Date(weekStart)
      : this.getWeekStart(new Date());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const startDate = start.toISOString().split('T')[0];
    const endDate = end.toISOString().split('T')[0];

    // Get completions for the week
    const { data: completions } = await this.supabase
      .from('study_completions')
      .select('*, tasks:study_tasks(task_type, subject)')
      .eq('user_id', userId)
      .gte('completed_at', `${startDate}T00:00:00`)
      .lte('completed_at', `${endDate}T23:59:59`);

    // Calculate subject breakdown
    const subjectMap = new Map<string, { minutes: number; tasks: number }>();
    completions?.forEach((c) => {
      const subject = (c.tasks as any)?.subject || 'Other';
      const existing = subjectMap.get(subject) || { minutes: 0, tasks: 0 };
      subjectMap.set(subject, {
        minutes: existing.minutes + (c.time_spent_minutes || 0),
        tasks: existing.tasks + 1,
      });
    });

    const subjectBreakdown = Array.from(subjectMap.entries()).map(([subject, data]) => ({
      subject,
      minutes: data.minutes,
      tasks: data.tasks,
    }));

    const totalMinutes = subjectBreakdown.reduce((sum, s) => sum + s.minutes, 0);
    const averageDailyMinutes = Math.round(totalMinutes / 7);

    return {
      weekStart: startDate,
      weekEnd: endDate,
      totalTasks: completions?.length || 0,
      completedTasks: completions?.length || 0,
      subjectBreakdown,
      averageDailyMinutes,
    };
  }

  /**
   * Get streak information
   */
  async getStreakInfo(userId: string): Promise<StreakInfo> {
    // Get all completions grouped by date
    const { data: completions } = await this.supabase
      .from('study_completions')
      .select('completed_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (!completions || completions.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedDate: null,
        isOnStreak: false,
      };
    }

    const today = new Date().toISOString().split('T')[0];
    const dates = [...new Set(completions.map((c) => c.completed_at?.split('T')[0]).filter((d): d is string => !!d))];

    // Calculate current streak
    let currentStreak = 0;
    let currentDate = new Date(today);

    // Check if completed today or yesterday
    const lastCompleted = dates[0];
    const daysDiff = lastCompleted
      ? Math.floor(
          (new Date(today).getTime() - new Date(lastCompleted).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 999;

    if (daysDiff > 1) {
      // Streak broken
      return {
        currentStreak: 0,
        longestStreak: await this.calculateLongestStreak(dates),
        lastCompletedDate: lastCompleted || null,
        isOnStreak: false,
      };
    }

    // Count consecutive days
    for (const date of dates) {
      const expectedDate = new Date(currentDate);
      expectedDate.setDate(expectedDate.getDate() - currentStreak);

      if (date === expectedDate.toISOString().split('T')[0]) {
        currentStreak++;
      } else {
        break;
      }
    }

    const longestStreak = await this.calculateLongestStreak(dates);

    return {
      currentStreak,
      longestStreak,
      lastCompletedDate: lastCompleted || null,
      isOnStreak: currentStreak > 0,
    };
  }

  /**
   * Calculate longest streak from dates
   */
  private async calculateLongestStreak(dates: string[]): Promise<number> {
    if (dates.length === 0) return 0;

    let longest = 1;
    let current = 1;

    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1]);
      const currDate = new Date(dates[i]);
      const diff = Math.floor(
        (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diff === 1) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 1;
      }
    }

    return longest;
  }

  /**
   * Get week start date (Monday)
   */
  private getWeekStart(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  /**
   * Get overall progress summary
   */
  async getProgressSummary(userId: string): Promise<{
    totalTasksCompleted: number;
    totalStudyMinutes: number;
    totalXpEarned: number;
    currentStreak: number;
    syllabusCoverage: number;
    mockTestsCompleted: number;
  }> {
    // Total completions
    const { count: totalTasksCompleted } = await this.supabase
      .from('study_completions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Total minutes
    const { data: completions } = await this.supabase
      .from('study_completions')
      .select('time_spent_minutes, xp_earned')
      .eq('user_id', userId);

    const totalStudyMinutes =
      completions?.reduce((sum, c) => sum + (c.time_spent_minutes || 0), 0) || 0;
    const totalXpEarned =
      completions?.reduce((sum, c) => sum + (c.xp_earned || 0), 0) || 0;

    // Streak
    const streakInfo = await this.getStreakInfo(userId);

    // Syllabus coverage (from milestones)
    const { data: milestones } = await this.supabase
      .from('study_milestones')
      .select('current_value')
      .in(
        'plan_id',
        (await this.supabase
          .from('study_plans')
          .select('id')
          .eq('user_id', userId)
          .eq('is_active', true)).data?.map((p) => p.id) || []
      )
      .eq('milestone_type', 'syllabus_coverage');

    const syllabusCoverage = milestones?.[0]?.current_value || 0;

    // Mock tests completed
    const mockTestTaskIds = (await this.supabase
      .from('study_tasks')
      .select('id')
      .eq('task_type', 'mock_test')).data?.map((t) => t.id) || [];

    const { count: mockTestsCompleted } = await this.supabase
      .from('study_completions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('task_id', mockTestTaskIds);

    return {
      totalTasksCompleted: totalTasksCompleted || 0,
      totalStudyMinutes,
      totalXpEarned,
      currentStreak: streakInfo.currentStreak,
      syllabusCoverage,
      mockTestsCompleted: mockTestsCompleted || 0,
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const progressTracker = new ProgressTrackerService();
