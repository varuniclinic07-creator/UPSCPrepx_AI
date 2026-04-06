/**
 * Gamification XP Service
 * 
 * Master Prompt v8.0 - Feature F13 (READ Mode)
 * - Earn XP, Check Achievements, Manage Streak
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface XPEvent {
  userId: string;
  amount: number;
  source: 'task' | 'quiz' | 'streak' | 'shop' | 'mock' | 'achievement';
  description: string;
}

export class GamificationService {
  // Award XP and log it
  async awardXP(event: XPEvent): Promise<number> {
    try {
      // 1. Log Transaction
      await supabase.from('xp_transactions').insert({
        user_id: event.userId,
        amount: event.amount,
        source: event.source,
        description: event.description,
      });

      // 2. Update Stats
      const { data: stats } = await supabase
        .from('user_xp_stats')
        .select('*')
        .eq('user_id', event.userId)
        .single();

      const newBalance = (stats?.current_balance || 0) + event.amount;
      const newTotal = (stats?.total_earned || 0) + event.amount;
      const newLevel = Math.floor(newTotal / 500) + 1; // Level up every 500 XP

      const { data: updatedStats } = await supabase
        .from('user_xp_stats')
        .upsert({
          user_id: event.userId,
          current_balance: newBalance,
          total_earned: newTotal,
          level: newLevel,
          last_updated: new Date().toISOString(),
        })
        .select()
        .single();

      return updatedStats?.current_balance || 0;
    } catch (err) {
      console.error('XP Award Error:', err);
      return 0;
    }
  }

  // Spend XP from balance
  async spendXP(userId: string, amount: number, description: string): Promise<boolean> {
    try {
      const { data: stats } = await supabase
        .from('user_xp_stats')
        .select('current_balance')
        .eq('user_id', userId)
        .single();

      if (!stats || stats.current_balance < amount) return false;

      // Log negative transaction
      await supabase.from('xp_transactions').insert({
        user_id: userId,
        amount: -amount,
        source: 'shop',
        description,
      });

      // Update balance
      await supabase
        .from('user_xp_stats')
        .update({ current_balance: stats.current_balance - amount })
        .eq('user_id', userId);

      return true;
    } catch (err) {
      console.error('XP Spend Error:', err);
      return false;
    }
  }

  // Get User Stats
  async getStats(userId: string) {
    const { data } = await supabase
      .from('user_xp_stats')
      .select('*')
      .eq('user_id', userId)
      .single();
    return data;
  }
}

export const gamification = new GamificationService();
