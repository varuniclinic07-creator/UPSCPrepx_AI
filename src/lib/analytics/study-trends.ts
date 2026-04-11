/**
 * Study Trends Service
 * 
 * Master Prompt v8.0 - Feature F9 (READ Mode)
 * - Daily/weekly study hours over time
 * - Subject breakdown
 */

import { createClient } from '@supabase/supabase-js';

let _sb: ReturnType<typeof createClient> | null = null;
function getSupabase() { if (!_sb) _sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!); return _sb; }

export async function getStudyTrends(userId: string, range: '7d' | '30d' | '90d') {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data } = await getSupabase()
    .from('study_completions')
    .select(`
      completed_at,
      time_spent_minutes,
      study_tasks (subject)
    `)
    .eq('user_id', userId)
    .gte('completed_at', startDate.toISOString())
    .order('completed_at');

  if (!data || data.length === 0) {
    return [];
  }

  // Group by date and subject
  const dailyMap: Record<string, Record<string, number>> = {};
  data.forEach((row) => {
    const date = new Date(row.completed_at).toISOString().split('T')[0];
    const subject = row.study_tasks?.subject || 'Other';
    const hours = (row.time_spent_minutes || 0) / 60;

    if (!dailyMap[date]) dailyMap[date] = {};
    dailyMap[date][subject] = (dailyMap[date][subject] || 0) + hours;
  });

  return Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, subjects]) => ({
      date,
      GS1: subjects.GS1 || 0,
      GS2: subjects.GS2 || 0,
      GS3: subjects.GS3 || 0,
      GS4: subjects.GS4 || 0,
      CSAT: subjects.CSAT || 0,
      total: Object.values(subjects).reduce((sum, h) => sum + h, 0),
    }));
}
