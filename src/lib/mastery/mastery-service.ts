/**
 * Unified Mastery Service — SM-2 SRS for user_mastery table
 *
 * Consolidates all mastery tracking into a single service:
 * - SM-2 spaced repetition scheduling
 * - Mastery level calculation from accuracy + attempts
 * - Due revision queries
 * - Dashboard stats aggregation
 */

import { createClient } from '@supabase/supabase-js';

let _sb: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_sb)
    _sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  return _sb;
}

// ─── Types ───────────────────────────────────────────────────────

export type MasteryLevel = 'not_started' | 'weak' | 'developing' | 'strong' | 'mastered';

export interface MasteryRecord {
  id: string;
  user_id: string;
  node_id: string;
  accuracy_score: number;
  attempts: number;
  correct: number;
  time_spent_seconds: number;
  mastery_level: MasteryLevel;
  next_revision_at: string | null;
  last_attempted_at: string | null;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
}

export interface MasteryStats {
  total_nodes: number;
  not_started: number;
  weak: number;
  developing: number;
  strong: number;
  mastered: number;
  due_today: number;
  avg_accuracy: number;
  total_time_minutes: number;
  current_streak: number;
}

export interface DueItem {
  node_id: string;
  title: string;
  subject: string | null;
  syllabus_code: string | null;
  mastery_level: MasteryLevel;
  accuracy_score: number;
  next_revision_at: string;
  last_attempted_at: string | null;
}

// ─── SM-2 Algorithm ──────────────────────────────────────────────

/**
 * SM-2 quality mapping from accuracy percentage:
 *   0-20%  → 0 (complete blackout)
 *   21-40% → 1 (incorrect, but familiar)
 *   41-55% → 2 (incorrect, but easy to recall)
 *   56-70% → 3 (correct with difficulty)
 *   71-85% → 4 (correct with hesitation)
 *   86-100% → 5 (perfect response)
 */
export function accuracyToQuality(accuracy: number): number {
  if (accuracy <= 0.2) return 0;
  if (accuracy <= 0.4) return 1;
  if (accuracy <= 0.55) return 2;
  if (accuracy <= 0.7) return 3;
  if (accuracy <= 0.85) return 4;
  return 5;
}

/**
 * Core SM-2 calculation — returns new interval, ease factor, repetitions
 */
export function sm2Calculate(
  interval_days: number,
  ease_factor: number,
  repetitions: number,
  quality: number // 0-5
): { interval_days: number; ease_factor: number; repetitions: number } {
  if (quality < 3) {
    // Failed: reset interval, reduce ease
    return {
      interval_days: 1,
      ease_factor: Math.max(1.3, ease_factor - 0.2),
      repetitions: 0,
    };
  }

  // Success
  let newInterval: number;
  if (repetitions === 0) {
    newInterval = 1;
  } else if (repetitions === 1) {
    newInterval = 6;
  } else {
    newInterval = Math.ceil(interval_days * ease_factor);
  }

  // SM-2 ease factor adjustment
  const newEase = Math.max(
    1.3,
    ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  // Hard/Easy modifiers
  if (quality === 3) {
    newInterval = Math.max(1, Math.ceil(newInterval * 1.2));
  } else if (quality === 5) {
    newInterval = Math.ceil(newInterval * 1.5);
  }

  return {
    interval_days: newInterval,
    ease_factor: newEase,
    repetitions: repetitions + 1,
  };
}

/**
 * Derive mastery level from accuracy and attempt count
 */
export function calculateMasteryLevel(accuracy: number, attempts: number): MasteryLevel {
  if (attempts === 0) return 'not_started';
  if (accuracy < 0.3) return 'weak';
  if (accuracy < 0.55) return 'developing';
  if (accuracy < 0.8) return 'strong';
  return 'mastered';
}

// ─── Core Service Functions ──────────────────────────────────────

/**
 * Update mastery after a practice/quiz result.
 * Creates record if none exists, updates SM-2 scheduling.
 *
 * @param userId - auth user id
 * @param nodeId - knowledge_nodes id
 * @param correct - number of correct answers in this session
 * @param total - total questions attempted
 * @param timeSpentSec - seconds spent on this session
 */
export async function updateMastery(
  userId: string,
  nodeId: string,
  correct: number,
  total: number,
  timeSpentSec: number = 0
): Promise<MasteryRecord | null> {
  const supabase = getSupabase();

  // Get existing record
  const { data: existing } = await supabase
    .from('user_mastery')
    .select('*')
    .eq('user_id', userId)
    .eq('node_id', nodeId)
    .maybeSingle();

  const prevAttempts = existing?.attempts ?? 0;
  const prevCorrect = existing?.correct ?? 0;
  const prevTime = existing?.time_spent_seconds ?? 0;
  const prevEase = existing?.ease_factor ?? 2.5;
  const prevInterval = existing?.interval_days ?? 0;
  const prevReps = existing?.repetitions ?? 0;

  const newAttempts = prevAttempts + total;
  const newCorrect = prevCorrect + correct;
  const newTime = prevTime + timeSpentSec;
  const accuracy = newAttempts > 0 ? newCorrect / newAttempts : 0;
  const sessionAccuracy = total > 0 ? correct / total : 0;

  // SM-2 scheduling based on this session's accuracy
  const quality = accuracyToQuality(sessionAccuracy);
  const { interval_days, ease_factor, repetitions } = sm2Calculate(
    prevInterval,
    prevEase,
    prevReps,
    quality
  );

  const nextRevision = new Date();
  nextRevision.setDate(nextRevision.getDate() + interval_days);

  const masteryLevel = calculateMasteryLevel(accuracy, newAttempts);
  const now = new Date().toISOString();

  const record = {
    user_id: userId,
    node_id: nodeId,
    accuracy_score: Math.round(accuracy * 1000) / 1000,
    attempts: newAttempts,
    correct: newCorrect,
    time_spent_seconds: newTime,
    mastery_level: masteryLevel,
    next_revision_at: nextRevision.toISOString(),
    last_attempted_at: now,
    ease_factor: Math.round(ease_factor * 100) / 100,
    interval_days,
    repetitions,
    updated_at: now,
  };

  let result: MasteryRecord | null = null;

  if (existing) {
    const { data, error } = await supabase
      .from('user_mastery')
      .update(record)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) { console.error('mastery update error:', error); return null; }
    result = data as MasteryRecord;
  } else {
    const { data, error } = await supabase
      .from('user_mastery')
      .insert(record)
      .select()
      .single();
    if (error) { console.error('mastery insert error:', error); return null; }
    result = data as MasteryRecord;
  }

  // Check for mastery-based achievements (best-effort, non-blocking)
  try {
    const { achievements } = await import('@/lib/gamification/achievement-service');
    await achievements.checkUserAchievements(userId);
  } catch (err) {
    console.error('Achievement check (non-blocking):', err);
  }

  // Notify on mastery level-up
  if (existing && existing.mastery_level !== masteryLevel) {
    try {
      const { notifyLevelUp } = await import('@/lib/mastery/mastery-notifications');
      const { data: node } = await supabase
        .from('knowledge_nodes')
        .select('title')
        .eq('id', nodeId)
        .single();
      if (node) {
        await notifyLevelUp(userId, node.title, existing.mastery_level, masteryLevel);
      }
    } catch (err) {
      console.error('Level-up notification (non-blocking):', err);
    }
  }

  return result;
}

/**
 * Get items due for revision (SRS due)
 */
export async function getDueRevisions(
  userId: string,
  limit: number = 20
): Promise<DueItem[]> {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('user_mastery')
    .select(`
      node_id,
      mastery_level,
      accuracy_score,
      next_revision_at,
      last_attempted_at,
      knowledge_nodes!inner (title, subject, syllabus_code)
    `)
    .eq('user_id', userId)
    .lte('next_revision_at', now)
    .order('next_revision_at', { ascending: true })
    .limit(limit);

  if (error) { console.error('getDueRevisions error:', error); return []; }

  return (data || []).map((row: any) => ({
    node_id: row.node_id,
    title: row.knowledge_nodes?.title ?? '',
    subject: row.knowledge_nodes?.subject ?? null,
    syllabus_code: row.knowledge_nodes?.syllabus_code ?? null,
    mastery_level: row.mastery_level,
    accuracy_score: row.accuracy_score,
    next_revision_at: row.next_revision_at,
    last_attempted_at: row.last_attempted_at,
  }));
}

/**
 * Get mastery stats for dashboard
 */
export async function getMasteryStats(userId: string): Promise<MasteryStats> {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  // All mastery records for user
  const { data: records, error } = await supabase
    .from('user_mastery')
    .select('mastery_level, accuracy_score, time_spent_seconds, next_revision_at, last_attempted_at')
    .eq('user_id', userId);

  if (error || !records) {
    return {
      total_nodes: 0, not_started: 0, weak: 0, developing: 0,
      strong: 0, mastered: 0, due_today: 0, avg_accuracy: 0,
      total_time_minutes: 0, current_streak: 0,
    };
  }

  const counts = { not_started: 0, weak: 0, developing: 0, strong: 0, mastered: 0 };
  let totalAccuracy = 0;
  let totalTimeSec = 0;
  let dueToday = 0;
  let attemptedCount = 0;

  for (const r of records) {
    const level = r.mastery_level as MasteryLevel;
    if (level in counts) counts[level]++;
    if (r.accuracy_score > 0) {
      totalAccuracy += r.accuracy_score;
      attemptedCount++;
    }
    totalTimeSec += r.time_spent_seconds || 0;
    if (r.next_revision_at && r.next_revision_at <= now) dueToday++;
  }

  // Calculate streak from last_attempted_at dates
  const streak = await calculateStreak(userId);

  return {
    total_nodes: records.length,
    ...counts,
    due_today: dueToday,
    avg_accuracy: attemptedCount > 0 ? Math.round((totalAccuracy / attemptedCount) * 100) : 0,
    total_time_minutes: Math.round(totalTimeSec / 60),
    current_streak: streak,
  };
}

/**
 * Calculate current study streak (consecutive days with activity)
 */
async function calculateStreak(userId: string): Promise<number> {
  const supabase = getSupabase();

  // Get distinct dates with activity, ordered descending
  const { data, error } = await supabase
    .from('user_mastery')
    .select('last_attempted_at')
    .eq('user_id', userId)
    .not('last_attempted_at', 'is', null)
    .order('last_attempted_at', { ascending: false });

  if (error || !data || data.length === 0) return 0;

  // Extract unique dates
  const dates = [...new Set(
    data.map((r: any) => r.last_attempted_at?.split('T')[0]).filter(Boolean)
  )].sort((a, b) => b.localeCompare(a)); // descending

  if (dates.length === 0) return 0;

  // Check if today or yesterday has activity (streak must be current)
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

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

/**
 * Bulk lookup: get mastery levels for multiple nodes at once
 */
export async function getMasteryForNodes(
  userId: string,
  nodeIds: string[]
): Promise<Map<string, MasteryLevel>> {
  if (nodeIds.length === 0) return new Map();
  const supabase = getSupabase();

  const { data } = await supabase
    .from('user_mastery')
    .select('node_id, mastery_level')
    .eq('user_id', userId)
    .in('node_id', nodeIds);

  const map = new Map<string, MasteryLevel>();
  for (const r of data || []) {
    map.set(r.node_id, r.mastery_level as MasteryLevel);
  }
  return map;
}

export const masteryService = {
  updateMastery,
  getDueRevisions,
  getMasteryStats,
  getMasteryForNodes,
  calculateMasteryLevel,
  sm2Calculate,
  accuracyToQuality,
};
