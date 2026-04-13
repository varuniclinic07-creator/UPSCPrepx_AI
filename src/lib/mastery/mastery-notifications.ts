/**
 * Mastery Notification Triggers
 *
 * Generates smart notifications based on mastery events:
 * - Streak milestones (3, 7, 14, 30, 60, 100 days)
 * - Mastery level-ups (weak→developing→strong→mastered)
 * - SRS due reminders (batch alert for overdue items)
 * - Weekly progress digest
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

// ─── Streak Milestones ───────────────────────────────────────────

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

export async function checkStreakMilestones(userId: string, currentStreak: number): Promise<void> {
  if (!STREAK_MILESTONES.includes(currentStreak)) return;

  const supabase = getSupabase();

  // Check if we already notified for this milestone
  const { data: existing } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('type', 'achievement')
    .like('title', `%${currentStreak}-day%`)
    .limit(1);

  if (existing && existing.length > 0) return;

  const messages: Record<number, string> = {
    3: 'Great start! 3 days in a row. Consistency is key to UPSC success.',
    7: 'One full week of daily study! You\'re building a strong habit.',
    14: 'Two weeks strong! Your dedication is showing in your mastery scores.',
    30: 'A full month of daily practice! You\'re in the top 5% of aspirants.',
    60: 'Two months of consistent study! Your knowledge graph is flourishing.',
    100: 'LEGENDARY! 100-day streak. You\'re unstoppable!',
  };

  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'achievement',
    title: `${currentStreak}-day Study Streak!`,
    message: messages[currentStreak] || `Amazing ${currentStreak}-day streak!`,
    is_read: false,
  });
}

// ─── Mastery Level-Up ────────────────────────────────────────────

export async function notifyLevelUp(
  userId: string,
  nodeTitle: string,
  oldLevel: string,
  newLevel: string
): Promise<void> {
  // Only notify on upgrades, not downgrades
  const levels = ['not_started', 'weak', 'developing', 'strong', 'mastered'];
  if (levels.indexOf(newLevel) <= levels.indexOf(oldLevel)) return;

  const supabase = getSupabase();

  const levelEmoji: Record<string, string> = {
    developing: 'Developing',
    strong: 'Strong',
    mastered: 'Mastered',
  };

  const label = levelEmoji[newLevel] || newLevel;

  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'success',
    title: `Level Up: ${label}!`,
    message: `Your mastery of "${nodeTitle}" has reached ${label} level. Keep it up!`,
    is_read: false,
  });
}

// ─── SRS Due Reminders ───────────────────────────────────────────

export async function generateDueReminders(userId: string): Promise<number> {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  // Count overdue items
  const { count } = await supabase
    .from('user_mastery')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .lte('next_revision_at', now);

  const dueCount = count || 0;
  if (dueCount === 0) return 0;

  // Check if we already sent a reminder today
  const today = new Date().toISOString().split('T')[0];
  const { data: todayReminder } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('type', 'info')
    .like('title', '%revision%')
    .gte('created_at', today)
    .limit(1);

  if (todayReminder && todayReminder.length > 0) return dueCount;

  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'info',
    title: `${dueCount} topic${dueCount > 1 ? 's' : ''} ready for revision`,
    message: `You have ${dueCount} topic${dueCount > 1 ? 's' : ''} due for spaced repetition review. Revise now to strengthen your memory!`,
    link: '/dashboard/revision',
    is_read: false,
  });

  return dueCount;
}

// ─── Weekly Progress Digest ──────────────────────────────────────

export async function generateWeeklyDigest(userId: string): Promise<void> {
  const supabase = getSupabase();

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  // Get this week's activity
  const { data: recentActivity } = await supabase
    .from('user_mastery')
    .select('mastery_level, accuracy_score, attempts, correct, time_spent_seconds')
    .eq('user_id', userId)
    .gte('last_attempted_at', weekAgo);

  if (!recentActivity || recentActivity.length === 0) {
    // No activity — gentle nudge
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'info',
      title: 'Weekly Study Reminder',
      message: 'You haven\'t studied this week. Even 15 minutes a day makes a difference for UPSC preparation!',
      link: '/dashboard',
      is_read: false,
    });
    return;
  }

  const topicsStudied = recentActivity.length;
  const totalTime = recentActivity.reduce((s, r) => s + (r.time_spent_seconds || 0), 0);
  const avgAccuracy = recentActivity.reduce((s, r) => s + (r.accuracy_score || 0), 0) / topicsStudied;
  const mastered = recentActivity.filter(r => r.mastery_level === 'mastered').length;

  const minutes = Math.round(totalTime / 60);
  const hours = Math.floor(minutes / 60);
  const timeStr = hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;

  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'success',
    title: 'Your Weekly Progress',
    message: [
      `Topics studied: ${topicsStudied}`,
      `Time invested: ${timeStr}`,
      `Average accuracy: ${Math.round(avgAccuracy * 100)}%`,
      mastered > 0 ? `Topics mastered: ${mastered}` : null,
    ].filter(Boolean).join(' | '),
    link: '/dashboard/revision',
    is_read: false,
  });
}

export const masteryNotifications = {
  checkStreakMilestones,
  notifyLevelUp,
  generateDueReminders,
  generateWeeklyDigest,
};
