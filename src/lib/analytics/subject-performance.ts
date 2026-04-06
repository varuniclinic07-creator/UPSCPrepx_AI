/**
 * Subject Performance Service
 * 
 * Master Prompt v8.0 - Feature F9 (READ Mode)
 * - MCQ accuracy by subject with trends
 * - 30-day comparison
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SubjectPerformance {
  subject: string;
  accuracy: number;
  attempts: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

export async function getSubjectPerformance(userId: string): Promise<SubjectPerformance[]> {
  const now = new Date();
  const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const prev30 = new Date(past30.getTime() - 30 * 24 * 60 * 60 * 1000);

  const { data: recent } = await supabase
    .from('mcq_attempts')
    .select('subject, is_correct')
    .eq('user_id', userId)
    .gte('created_at', past30.toISOString());

  const { data: previous } = await supabase
    .from('mcq_attempts')
    .select('subject, is_correct')
    .eq('user_id', userId)
    .gte('created_at', prev30.toISOString())
    .lt('created_at', past30.toISOString());

  const subjects: string[] = ['GS1', 'GS2', 'GS3', 'GS4', 'CSAT', 'Current Affairs'];

  return subjects.map((subject) => {
    const recentSub = recent?.filter((a) => a.subject === subject) || [];
    const prevSub = previous?.filter((a) => a.subject === subject) || [];

    const recentAccuracy = recentSub.length > 0
      ? Math.round((recentSub.filter((a) => a.is_correct).length / recentSub.length) * 100)
      : 0;

    const prevAccuracy = prevSub.length > 0
      ? Math.round((prevSub.filter((a) => a.is_correct).length / prevSub.length) * 100)
      : 0;

    const change = recentAccuracy - prevAccuracy;
    const trend = change > 2 ? 'up' : change < -2 ? 'down' : 'stable';

    return {
      subject,
      accuracy: recentAccuracy,
      attempts: recentSub.length,
      trend,
      change,
    };
  });
}

export const subjectPerformance = { getSubjectPerformance };
