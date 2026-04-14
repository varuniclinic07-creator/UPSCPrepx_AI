/**
 * Achievement Service
 *
 * Checks conditions and awards badges.
 * Supports XP-based, streak-based, and mastery-based achievements.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { gamification } from './xp-service';

let _sb: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() {
  if (!_sb)
    _sb = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  return _sb;
}

interface EnrichedStats {
  // From user_xp_stats
  streak_count: number;
  total_earned: number;
  // From user_mastery aggregation
  mastered_count: number;
  has_subject_mastery: boolean;
  revision_streak: number;
}

interface AchievementDefinition {
  code: string;
  check: (stats: EnrichedStats) => boolean;
}

const achievementChecks: AchievementDefinition[] = [
  // XP / streak achievements
  { code: 'STREAK_3', check: (s) => s.streak_count >= 3 },
  { code: 'STREAK_7', check: (s) => s.streak_count >= 7 },
  { code: 'TOP_10', check: (s) => s.total_earned >= 5000 },

  // Mastery achievements
  { code: 'FIRST_MASTERED', check: (s) => s.mastered_count >= 1 },
  { code: 'MASTERY_10', check: (s) => s.mastered_count >= 10 },
  { code: 'MASTERY_50', check: (s) => s.mastered_count >= 50 },
  { code: 'SUBJECT_MASTERY', check: (s) => s.has_subject_mastery },
  { code: 'REVISION_STREAK_7', check: (s) => s.revision_streak >= 7 },
];

/**
 * Compute consecutive days of revision activity
 */
function computeConsecutiveDays(revisions: Array<{ last_attempted_at: string }> | null): number {
  if (!revisions || revisions.length === 0) return 0;

  const dates = [
    ...new Set(revisions.map((r) => r.last_attempted_at?.split('T')[0]).filter(Boolean)),
  ].sort((a, b) => b.localeCompare(a)); // descending

  if (dates.length === 0) return 0;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Streak must include today or yesterday
  if (dates[0] !== today && dates[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export class AchievementService {
  async checkUserAchievements(userId: string) {
    try {
      const supabase = getSupabase();

      // 1. Get XP stats
      const { data: xpStats } = await supabase
        .from('user_xp_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      // 2. Get already unlocked achievements (join through achievements table for code)
      const { data: unlocked } = await supabase
        .from('user_achievements')
        .select('achievement_id, achievements(code)')
        .eq('user_id', userId);

      const unlockedCodes = new Set(
        (unlocked || []).map((u: any) => u.achievements?.code).filter(Boolean)
      );

      // 3. Count mastered topics
      const { count: masteredCount } = await supabase
        .from('user_mastery')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('mastery_level', 'mastered');

      // 4. Check subject mastery (all nodes in any one subject)
      const hasSubjectMastery = await this.checkSubjectMastery(userId);

      // 5. Revision streak
      const { data: recentRevisions } = await supabase
        .from('user_mastery')
        .select('last_attempted_at')
        .eq('user_id', userId)
        .not('last_attempted_at', 'is', null)
        .order('last_attempted_at', { ascending: false })
        .limit(60);

      const revisionStreak = computeConsecutiveDays(
        recentRevisions as { last_attempted_at: string }[] | null
      );

      // 6. Build enriched stats
      const enrichedStats: EnrichedStats = {
        streak_count: xpStats?.streak_count ?? 0,
        total_earned: xpStats?.total_earned ?? 0,
        mastered_count: masteredCount ?? 0,
        has_subject_mastery: hasSubjectMastery,
        revision_streak: revisionStreak,
      };

      // 7. Run all checks
      for (const check of achievementChecks) {
        if (!unlockedCodes.has(check.code) && check.check(enrichedStats)) {
          await this.unlockAchievement(userId, check.code);
        }
      }
    } catch (err) {
      console.error('Achievement Check Error:', err);
    }
  }

  private async checkSubjectMastery(userId: string): Promise<boolean> {
    const supabase = getSupabase();

    // Get subjects that have mastered nodes
    const { data: masteredNodes } = await supabase
      .from('user_mastery')
      .select('knowledge_nodes!inner(subject)')
      .eq('user_id', userId)
      .eq('mastery_level', 'mastered');

    if (!masteredNodes || masteredNodes.length === 0) return false;

    // Count mastered per subject
    const masteredBySubject: Record<string, number> = {};
    for (const row of masteredNodes) {
      const subj = (row as any).knowledge_nodes?.subject;
      if (subj) masteredBySubject[subj] = (masteredBySubject[subj] || 0) + 1;
    }

    // Get total nodes per subject
    for (const subject of Object.keys(masteredBySubject)) {
      const { count } = await supabase
        .from('knowledge_nodes')
        .select('*', { count: 'exact', head: true })
        .eq('subject', subject)
        .in('type', ['subtopic', 'topic']);

      if (count && count > 0 && masteredBySubject[subject] >= count) {
        return true;
      }
    }

    return false;
  }

  private async unlockAchievement(userId: string, code: string) {
    const supabase = getSupabase();

    const { data: achievement } = await supabase
      .from('achievements')
      .select('*')
      .eq('code', code)
      .single();

    if (!achievement) return;

    // Grant achievement
    const { error } = await supabase.from('user_achievements').insert({
      user_id: userId,
      achievement_id: achievement.id,
    });

    if (error) {
      // Likely duplicate — ignore
      return;
    }

    // Award bonus XP
    if ((achievement.xp_reward ?? 0) > 0) {
      await gamification.awardXP({
        userId,
        amount: achievement.xp_reward ?? 0,
        source: 'achievement',
        description: `Unlocked: ${achievement.name}`,
      });
    }
  }
}

export const achievements = new AchievementService();
