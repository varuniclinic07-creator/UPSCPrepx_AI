/**
 * Weekly Comparison Service
 * 
 * Master Prompt v8.0 - Feature F9 (READ Mode)
 * - Current vs previous week metrics
 * - Delta calculations
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

let _sb: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() { if (!_sb) _sb = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!); return _sb; }

export interface WeekMetrics {
  hours: number;
  tasks: number;
  accuracy: number;
  streak: number;
  mockTests: number;
}

export async function getWeeklyComparison(userId: string): Promise<{ current: WeekMetrics; previous: WeekMetrics }> {
  const now = new Date();
  const currentWeekStart = new Date(now);
  currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);

  // Current week data
  const { data: currentCompletions } = await getSupabase()
    .from('study_completions')
    .select('time_spent_minutes, completed_at')
    .eq('user_id', userId)
    .gte('completed_at', currentWeekStart.toISOString());

  const { data: previousCompletions } = await getSupabase()
    .from('study_completions')
    .select('time_spent_minutes, completed_at')
    .eq('user_id', userId)
    .gte('completed_at', previousWeekStart.toISOString())
    .lt('completed_at', currentWeekStart.toISOString());

  // MCQ accuracy for both weeks
  const { data: currentMCQ } = await getSupabase()
    .from('mcq_attempts')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', currentWeekStart.toISOString()) as { data: any[] | null };

  const { data: previousMCQ } = await getSupabase()
    .from('mcq_attempts')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', previousWeekStart.toISOString())
    .lt('created_at', currentWeekStart.toISOString()) as { data: any[] | null };

  // Mock tests
  const { data: currentMocks } = await getSupabase()
    .from('study_tasks')
    .select('id')
    .eq('task_type' as any, 'mock_test')
    .eq('status' as any, 'completed')
    .gte('created_at', currentWeekStart.toISOString()) as { data: any[] | null };

  const { data: previousMocks } = await getSupabase()
    .from('study_tasks')
    .select('id')
    .eq('task_type' as any, 'mock_test')
    .eq('status' as any, 'completed')
    .gte('created_at', previousWeekStart.toISOString())
    .lt('created_at', currentWeekStart.toISOString()) as { data: any[] | null };

  const streak = await getCurrentStreak(userId);

  const calcHours = (data: any[] | null) => {
    const mins = data?.reduce((sum, c) => sum + (c.time_spent_minutes || 0), 0) || 0;
    return Math.round((mins / 60) * 10) / 10;
  };

  const current: WeekMetrics = {
    hours: calcHours(currentCompletions),
    tasks: currentCompletions?.length || 0,
    accuracy: (currentMCQ && currentMCQ.length > 0) ? Math.round((currentMCQ.filter((m: any) => m.is_correct).length / currentMCQ.length) * 100) : 0,
    streak,
    mockTests: currentMocks?.length || 0,
  };

  const previous: WeekMetrics = {
    hours: calcHours(previousCompletions),
    tasks: previousCompletions?.length || 0,
    accuracy: (previousMCQ && previousMCQ.length > 0) ? Math.round((previousMCQ.filter((m: any) => m.is_correct).length / previousMCQ.length) * 100) : 0,
    streak: 0,
    mockTests: previousMocks?.length || 0,
  };

  return { current, previous };
}

export async function getCurrentStreak(userId: string): Promise<number> {
  const { data } = await getSupabase()
    .from('study_completions')
    .select('completed_at')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false }) as { data: any[] | null };

  if (!data || data.length === 0) return 0;

  let streak = 0;
  const dates = [...new Set(data.map((d: any) => d.completed_at?.split('T')[0]))].filter(Boolean).sort().reverse();

  const today = new Date().toISOString().split('T')[0];
  for (let i = 0; i < dates.length; i++) {
    if (i === 0) {
      // Allow today or yesterday to start streak
      const diff = Math.floor((new Date(today).getTime() - new Date(dates[i] as string).getTime()) / (1000 * 60 * 60 * 24));
      if (diff > 1) return 0;
    } else {
      const prev = new Date(dates[i - 1] as string);
      const curr = new Date(dates[i] as string);
      const diff = Math.floor((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
      if (diff !== 1) break;
    }
    streak++;
  }

  return streak;
}

export const weeklyComparison = { getWeeklyComparison };
