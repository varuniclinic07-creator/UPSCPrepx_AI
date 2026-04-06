/**
 * Study Milestone Manager Service
 * 
 * Master Prompt v8.0 - Feature F8 (READ Mode)
 * - Track milestone progress
 * - Detect achievements
 * - Trigger celebrations
 * - Bilingual notifications
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

interface MilestoneInfo {
  id: string;
  planId: string;
  type: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  title: { en: string; hi: string };
  description?: { en: string; hi: string };
  estimatedDate: string | null;
  achievedAt: string | null;
  isAchieved: boolean;
  progressPercentage: number;
}

interface MilestoneAchievement {
  milestone: MilestoneInfo;
  achievedAt: string;
  xpReward: number;
  celebrationMessage: { en: string; hi: string };
}

interface MilestoneUpdate {
  milestoneId: string;
  oldValue: number;
  newValue: number;
  isAchieved: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MILESTONE_XP_REWARDS: Record<string, number> = {
  syllabus_25: 100,
  syllabus_50: 250,
  syllabus_75: 500,
  syllabus_100: 1000,
  mock_5: 150,
  mock_10: 300,
  mock_20: 600,
  revision_1: 200,
  revision_2: 400,
  revision_3: 800,
};

const CELEBRATION_MESSAGES: Record<string, { en: string; hi: string }> = {
  syllabus_25: {
    en: '🎉 You\'ve completed 25% of your syllabus! Keep going!',
    hi: '🎉 आपने अपने पाठ्यक्रम का 25% पूरा कर लिया है! जारी रखें!',
  },
  syllabus_50: {
    en: '🎊 Halfway there! 50% syllabus completed!',
    hi: '🎊 आधा रास्ता तय हो गया! 50% पाठ्यक्रम पूर्ण!',
  },
  syllabus_75: {
    en: '🏆 75% complete! You\'re almost there!',
    hi: '🏆 75% पूर्ण! आप लगभग पहुँच गए हैं!',
  },
  syllabus_100: {
    en: '👑 SYLLABUS COMPLETE! You\'re ready for the exam!',
    hi: '👑 पाठ्यक्रम पूर्ण! आप परीक्षा के लिए तैयार हैं!',
  },
  mock_5: {
    en: '📝 5 Mock Tests completed! Great practice!',
    hi: '📝 5 मॉक टेस्ट पूर्ण! बेहतरीन अभ्यास!',
  },
  mock_10: {
    en: '📚 10 Mock Tests! You\'re getting stronger!',
    hi: '📚 10 मॉक टेस्ट! आप मजबूत हो रहे हैं!',
  },
  mock_20: {
    en: '💪 20 Mock Tests! Exam-ready warrior!',
    hi: '💪 20 मॉक टेस्ट! परीक्षा-तैयार योद्धा!',
  },
  revision_1: {
    en: '🔄 First revision complete! Knowledge is solidifying!',
    hi: '🔄 पहला रिविजन पूर्ण! ज्ञान मजबूत हो रहा है!',
  },
  revision_2: {
    en: '🔁 Second revision done! You\'re mastering this!',
    hi: '🔁 दूसरा रिविजन हुआ! आप मास्टर कर रहे हैं!',
  },
  revision_3: {
    en: '✨ Final revision complete! You\'re unstoppable!',
    hi: '✨ अंतिम रिविजन पूर्ण! आप अजेय हैं!',
  },
};

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class MilestoneManagerService {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Get all milestones for a study plan
   */
  async getMilestones(planId: string): Promise<MilestoneInfo[]> {
    const { data, error } = await this.supabase
      .from('study_milestones')
      .select('*')
      .eq('plan_id', planId)
      .order('target_value', { ascending: true });

    if (error) {
      console.error('Failed to fetch milestones:', error);
      return [];
    }

    return data.map((m) => this.transformMilestone(m));
  }

  /**
   * Update milestone progress
   */
  async updateMilestoneProgress(
    milestoneId: string,
    newValue: number
  ): Promise<MilestoneUpdate | null> {
    // Get current value
    const { data: current } = await this.supabase
      .from('study_milestones')
      .select('current_value, target_value')
      .eq('id', milestoneId)
      .single();

    if (!current) {
      return null;
    }

    const oldValue = current.current_value;
    const isAchieved = newValue >= current.target_value;

    // Update milestone
    const updateData: any = {
      current_value: Math.min(newValue, current.target_value),
    };

    if (isAchieved && !current.achieved_at) {
      updateData.achieved_at = new Date().toISOString();
    }

    const { error } = await this.supabase
      .from('study_milestones')
      .update(updateData)
      .eq('id', milestoneId);

    if (error) {
      console.error('Failed to update milestone:', error);
      return null;
    }

    return {
      milestoneId,
      oldValue,
      newValue,
      isAchieved,
    };
  }

  /**
   * Check and update all milestones for a plan
   */
  async checkAllMilestones(planId: string): Promise<MilestoneAchievement[]> {
    const achievements: MilestoneAchievement[] = [];

    // Get all milestones for this plan
    const milestones = await this.getMilestones(planId);

    for (const milestone of milestones) {
      if (milestone.isAchieved) {
        continue; // Already achieved
      }

      // Check if milestone should be achieved
      const newValue = await this.calculateCurrentValue(planId, milestone.type);

      if (newValue >= milestone.targetValue) {
        // Milestone achieved!
        const update = await this.updateMilestoneProgress(milestone.id, newValue);

        if (update?.isAchieved) {
          const xpReward = MILESTONE_XP_REWARDS[milestone.type] || 50;
          const celebrationMessage =
            CELEBRATION_MESSAGES[milestone.type] ||
            {
              en: `🎉 Milestone achieved: ${milestone.title.en}`,
              hi: `🎉 मील का पत्थर हासिल: ${milestone.title.en}`,
            };

          // Award XP to user
          await this.awardMilestoneXP(planId, xpReward);

          achievements.push({
            milestone,
            achievedAt: new Date().toISOString(),
            xpReward,
            celebrationMessage,
          });
        }
      }
    }

    return achievements;
  }

  /**
   * Calculate current value for a milestone type
   */
  private async calculateCurrentValue(
    planId: string,
    milestoneType: string
  ): Promise<number> {
    switch (milestoneType) {
      case 'syllabus_coverage':
        return this.calculateSyllabusCoverage(planId);

      case 'mock_count':
        return this.calculateMockTestsCompleted(planId);

      case 'revision_rounds':
        return this.calculateRevisionRounds(planId);

      default:
        return 0;
    }
  }

  /**
   * Calculate syllabus coverage percentage
   */
  private async calculateSyllabusCoverage(planId: string): Promise<number> {
    // Get total tasks for this plan
    const { count: totalTasks } = await this.supabase
      .from('study_tasks')
      .select('*', { count: 'exact', head: true })
      .in(
        'schedule_id',
        (await this.supabase
          .from('study_schedules')
          .select('id')
          .eq('plan_id', planId)).data?.map((s) => s.id) || []
      );

    // Get completed tasks
    const { count: completedTasks } = await this.supabase
      .from('study_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .in(
        'schedule_id',
        (await this.supabase
          .from('study_schedules')
          .select('id')
          .eq('plan_id', planId)).data?.map((s) => s.id) || []
      );

    if (!totalTasks || totalTasks === 0) {
      return 0;
    }

    return Math.round(((completedTasks || 0) / totalTasks) * 100);
  }

  /**
   * Calculate mock tests completed
   */
  private async calculateMockTestsCompleted(planId: string): Promise<number> {
    // Get user_id from plan
    const { data: plan } = await this.supabase
      .from('study_plans')
      .select('user_id')
      .eq('id', planId)
      .single();

    if (!plan) {
      return 0;
    }

    // Count mock test completions
    const { count } = await this.supabase
      .from('study_completions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', plan.user_id)
      .eq(
        'task_id',
        (await this.supabase
          .from('study_tasks')
          .select('id')
          .eq('task_type', 'mock_test'))
          .data?.map((t) => t.id) || []
      );

    return count || 0;
  }

  /**
   * Calculate revision rounds completed
   */
  private async calculateRevisionRounds(planId: string): Promise<number> {
    // This is a simplified calculation
    // In production, would track revision cycles more precisely
    const { count } = await this.supabase
      .from('study_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('task_type', 'revision')
      .eq('status', 'completed')
      .in(
        'schedule_id',
        (await this.supabase
          .from('study_schedules')
          .select('id')
          .eq('plan_id', planId)).data?.map((s) => s.id) || []
      );

    // Assume 1 round = completing all subjects once (simplified)
    const rounds = Math.floor((count || 0) / 4); // 4 GS subjects
    return Math.min(rounds, 3); // Cap at 3 rounds
  }

  /**
   * Award XP for milestone achievement
   */
  private async awardMilestoneXP(planId: string, xpAmount: number): Promise<void> {
    // Get user_id from plan
    const { data: plan } = await this.supabase
      .from('study_plans')
      .select('user_id')
      .eq('id', planId)
      .single();

    if (!plan) {
      return;
    }

    // In production, would update user's total XP in a users table
    // For now, just log the XP award
    console.log(`Awarded ${xpAmount} XP to user ${plan.user_id} for milestone`);
  }

  /**
   * Get upcoming milestones (not yet achieved)
   */
  async getUpcomingMilestones(planId: string, limit = 3): Promise<MilestoneInfo[]> {
    const milestones = await this.getMilestones(planId);
    return milestones
      .filter((m) => !m.isAchieved)
      .sort((a, b) => a.progressPercentage - b.progressPercentage)
      .slice(0, limit);
  }

  /**
   * Get achieved milestones
   */
  async getAchievedMilestones(planId: string): Promise<MilestoneInfo[]> {
    const milestones = await this.getMilestones(planId);
    return milestones.filter((m) => m.isAchieved);
  }

  /**
   * Transform database milestone to MilestoneInfo
   */
  private transformMilestone(dbMilestone: any): MilestoneInfo {
    const progressPercentage =
      dbMilestone.target_value > 0
        ? Math.round((dbMilestone.current_value / dbMilestone.target_value) * 100)
        : 0;

    return {
      id: dbMilestone.id,
      planId: dbMilestone.plan_id,
      type: dbMilestone.milestone_type,
      targetValue: dbMilestone.target_value,
      currentValue: dbMilestone.current_value,
      unit: dbMilestone.unit,
      title: {
        en: dbMilestone.title,
        hi: dbMilestone.description || dbMilestone.title,
      },
      description: {
        en: dbMilestone.description,
        hi: dbMilestone.description,
      },
      estimatedDate: dbMilestone.estimated_date,
      achievedAt: dbMilestone.achieved_at,
      isAchieved: !!dbMilestone.achieved_at,
      progressPercentage,
    };
  }

  /**
   * Get milestone progress summary for dashboard
   */
  async getProgressSummary(planId: string): Promise<{
    totalMilestones: number;
    achievedMilestones: number;
    upcomingMilestones: number;
    nextMilestone: MilestoneInfo | null;
    overallProgress: number;
  }> {
    const milestones = await this.getMilestones(planId);
    const achieved = milestones.filter((m) => m.isAchieved);
    const upcoming = milestones.filter((m) => !m.isAchieved);

    const nextMilestone = upcoming.length > 0 ? upcoming[0] : null;
    const overallProgress =
      milestones.length > 0
        ? Math.round((achieved.length / milestones.length) * 100)
        : 0;

    return {
      totalMilestones: milestones.length,
      achievedMilestones: achieved.length,
      upcomingMilestones: upcoming.length,
      nextMilestone,
      overallProgress,
    };
  }

  /**
   * Reset milestone (for testing or user request)
   */
  async resetMilestone(milestoneId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('study_milestones')
      .update({
        current_value: 0,
        achieved_at: null,
      })
      .eq('id', milestoneId);

    return !error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const milestoneManager = new MilestoneManagerService();
