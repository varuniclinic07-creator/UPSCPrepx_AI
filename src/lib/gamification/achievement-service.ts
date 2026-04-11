/**
 * Achievement Service
 * 
 * Master Prompt v8.0 - Feature F13 (READ Mode)
 * - Check conditions and award badges
 * - Logic for unlocking achievements
 */

import { createClient } from '@supabase/supabase-js';
import { gamification } from './xp-service';

let _sb: ReturnType<typeof createClient> | null = null;
function getSupabase() { if (!_sb) _sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!); return _sb; }

interface AchievementDefinition {
  code: string;
  check: (stats: any) => boolean;
}

// Definitions of how to unlock achievements
const achievementChecks: AchievementDefinition[] = [
  {
    code: 'STREAK_3',
    check: (stats) => stats.streak_count >= 3
  },
  {
    code: 'STREAK_7',
    check: (stats) => stats.streak_count >= 7
  },
  {
    code: 'TOP_10',
    check: (stats) => stats.total_earned >= 5000 // Placeholder logic
  },
];

export class AchievementService {
  async checkUserAchievements(userId: string) {
    try {
      // 1. Get current user stats
      const { data: stats, error: statsErr } = await getSupabase()
        .from('user_xp_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (statsErr || !stats) return;

      // 2. Get already unlocked achievements
      const { data: unlocked } = await getSupabase()
        .from('user_achievements')
        .select('achievement_code') // assuming we join or store code
        .eq('user_id', userId);
        
      const unlockedCodes = new Set((unlocked || []).map(u => u.achievement_code));

      // 3. Run checks
      for (const check of achievementChecks) {
        if (!unlockedCodes.has(check.code)) {
          if (check.check(stats)) {
            await this.unlockAchievement(userId, check.code);
          }
        }
      }
    } catch (err) {
      console.error('Achievement Check Error:', err);
    }
  }

  private async unlockAchievement(userId: string, code: string) {n    // Find achievement details
    const { data: achievement } = await getSupabase()
      .from('achievements')
      .select('*')
      .eq('code', code)
      .single();

    if (!achievement) return;

    // Grant Achievement
    await getSupabase().from('user_achievements').insert({
      user_id: userId,
      achievement_id: achievement.id
    });

    // Award Bonus XP
    if (achievement.xp_reward > 0) {
      await gamification.awardXP({
        userId,
        amount: achievement.xp_reward,
        source: 'achievement',
        description: `Unlocked: ${achievement.name}`
      });
    }
  }
}

export const achievements = new AchievementService();
