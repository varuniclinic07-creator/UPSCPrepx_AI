/**
 * Time Distribution Service
 * 
 * Master Prompt v8.0 - Feature F9 (READ Mode)
 * - Weekly time breakdown by subject
 * - Ideal percentage comparison
 */

import { createClient } from '@supabase/supabase-js';

let _sb: ReturnType<typeof createClient> | null = null;
function getSupabase() { if (!_sb) _sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!); return _sb; }

export async function getTimeDistribution(userId: string, range: '7d' | '30d' = '7d') {
  const days = range === '7d' ? 7 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data } = await getSupabase()
    .from('study_completions')
    .select(`
      time_spent_minutes,
      study_tasks (subject)
    `)
    .eq('user_id', userId)
    .gte('completed_at', startDate.toISOString());

  if (!data || data.length === 0) {
    return [];
  }

  const subjectTotals: Record<string, number> = {};
  let totalMinutes = 0;

  data.forEach((row) => {
    const subject = row.study_tasks?.subject || 'Other';
    const minutes = row.time_spent_minutes || 0;
    
    if (!subjectTotals[subject]) subjectTotals[subject] = 0;
    subjectTotals[subject] += minutes;
    totalMinutes += minutes;
  });

  const idealPercentages: Record<string, number> = {
    GS1: 20, GS2: 20, GS3: 20, GS4: 15, CSAT: 10, 'Current Affairs': 15,
  };

  return Object.entries(subjectTotals).map(([subject, minutes]) => ({
    subject,
    hours: Math.round(minutes / 6) / 10,
    percentage: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0,
    ideal: idealPercentages[subject] || 10,
  }));
}
