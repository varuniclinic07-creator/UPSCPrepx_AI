/**
 * Subject Performance Service
 * 
 * Master Prompt v8.0 - Feature F9 (READ Mode)
 * - MCQ accuracy by subject with trends
 * - 30-day comparison
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

let _sb: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() { if (!_sb) _sb = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!); return _sb; }

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

  const { data: recent } = await (getSupabase()
    .from('mcq_attempts') as any)
    .select('subject, accuracy_percent')
    .eq('user_id', userId)
    .gte('created_at', past30.toISOString()) as { data: Array<{ subject: string; accuracy_percent: number }> | null };

  const { data: previous } = await (getSupabase()
    .from('mcq_attempts') as any)
    .select('subject, accuracy_percent')
    .eq('user_id', userId)
    .gte('created_at', prev30.toISOString())
    .lt('created_at', past30.toISOString()) as { data: Array<{ subject: string; accuracy_percent: number }> | null };

  const subjects: string[] = ['GS1', 'GS2', 'GS3', 'GS4', 'CSAT', 'Current Affairs'];

  return subjects.map((subject) => {
    const recentSub = recent?.filter((a) => a.subject === subject) || [];
    const prevSub = previous?.filter((a) => a.subject === subject) || [];

    const recentAccuracy = recentSub.length > 0
      ? Math.round(recentSub.reduce((sum, a) => sum + (a.accuracy_percent || 0), 0) / recentSub.length)
      : 0;

    const prevAccuracy = prevSub.length > 0
      ? Math.round(prevSub.reduce((sum, a) => sum + (a.accuracy_percent || 0), 0) / prevSub.length)
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
