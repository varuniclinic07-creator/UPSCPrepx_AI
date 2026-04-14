/**
 * Leaderboard Service
 * 
 * Master Prompt v8.0 - Feature F13 (READ Mode)
 * - Calculate rankings (All-time, Weekly, Monthly)
 * - Fetch Top N users and local rank
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

let _sb: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() { if (!_sb) _sb = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!); return _sb; }

export class LeaderboardService {
  
  // Get top users by total XP
  async getTopUsers(limit: number = 10): Promise<any[]> {
    const { data, error } = await getSupabase()
      .from('user_xp_stats')
      .select('*')
      .order('total_earned', { ascending: false })
      .limit(limit);
    
    if (error) console.error('Leaderboard Error:', error);
    return data || [];
  }

  // Get specific user's rank
  async getUserRank(userId: string): Promise<any> {
    const { data } = await getSupabase()
      .from('user_xp_stats')
      .select('user_id, total_earned')
      .order('total_earned', { ascending: false });

    if (!data || !data.length) return { rank: 0, xp: 0 };

    const userRankIndex = data.findIndex(u => u.user_id === userId);
    const rank = userRankIndex > -1 ? userRankIndex + 1 : -1;
    const userStats = data.find(u => u.user_id === userId);

    return { rank, xp: userStats?.total_earned || 0 };
  }

  // Calculate Weekly/Monthly Leaders (Aggregating transactions)
  // Note: In high-scale apps, a materialized view or separate table should be used.
  // Here we calculate on the fly for the MVP.
  async getPeriodLeadership(period: 'weekly' | 'monthly'): Promise<any[]> {
    const now = new Date();
    let startDate = new Date();
    
    if (period === 'weekly') {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setDate(now.getDate() - 30);
    }

    const { data, error } = await getSupabase()
      .from('xp_transactions')
      .select('user_id, amount')
      .gte('created_at', startDate.toISOString());

    if (error || !data) return [];

    // Aggregate in JS
    const userXP: Record<string, number> = {};
    data.forEach(tx => {
      const uid = tx.user_id;
      userXP[uid] = (userXP[uid] || 0) + (tx.amount > 0 ? tx.amount : 0);
    });

    // Sort
    return Object.entries(userXP)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([userId, xp], index) => ({ userId, xp, rank: index + 1 }));
  }
}

export const leaderboard = new LeaderboardService();
