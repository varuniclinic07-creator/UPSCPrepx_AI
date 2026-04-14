/**
 * Mentor Goal Service
 * 
 * Master Prompt v8.0 - Feature F10 (READ Mode)
 * - Manage mentor-set goals
 * - Track completion and suggestions
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

let _sb: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() { if (!_sb) _sb = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!); return _sb; }

export interface MentorGoal {
  id?: string;
  title: string;
  description?: string;
  type: 'daily' | 'weekly' | 'exam';
  status?: 'active' | 'completed' | 'abandoned';
  due_date?: string;
}

export class MentorGoalService {
  async createGoal(userId: string, goal: MentorGoal) {
    const { data } = await getSupabase()
      .from('mentor_goals')
      .insert({ user_id: userId, ...goal })
      .select()
      .single();
    return data;
  }

  async getActiveGoals(userId: string) {
    const { data } = await getSupabase()
      .from('mentor_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('due_date', { ascending: true });
    return data || [];
  }

  async completeGoal(goalId: string) {
    await getSupabase()
      .from('mentor_goals')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', goalId);
  }

  async suggestGoals(userId: string, context: any): Promise<MentorGoal[]> {
    // Logic to suggest goals based on progress
    return [
      { title: 'Read 2 GS1 chapters', type: 'daily', description: 'Focus on History' },
      { title: 'Take 1 Mock Test', type: 'weekly' }
    ];
  }
}

export const mentorGoals = new MentorGoalService();