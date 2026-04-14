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
import type { Database } from '@/types/supabase';

let _sb: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() {
  if (!_sb)
    _sb = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!,
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

  const title = `${currentStreak}-day Study Streak!`;
  const body = messages[currentStreak] || `Amazing ${currentStreak}-day streak!`;

  await (supabase.from('notifications') as any).insert({
    user_id: userId,
    type: 'achievement',
    title,
    message: body,
    is_read: false,
  });

  // Best-effort web push
  try {
    const { sendPushToUser } = await import('@/lib/notifications/push-service');
    await sendPushToUser(userId, { title, body, tag: 'streak' });
  } catch { /* push is best-effort */ }
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

  const title = `Level Up: ${label}!`;
  const body = `Your mastery of "${nodeTitle}" has reached ${label} level. Keep it up!`;

  await (supabase.from('notifications') as any).insert({
    user_id: userId,
    type: 'success',
    title,
    message: body,
    is_read: false,
  });

  // Best-effort web push
  try {
    const { sendPushToUser } = await import('@/lib/notifications/push-service');
    await sendPushToUser(userId, { title, body, tag: 'mastery-levelup' });
  } catch { /* push is best-effort */ }
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

  const title = `${dueCount} topic${dueCount > 1 ? 's' : ''} ready for revision`;
  const body = `You have ${dueCount} topic${dueCount > 1 ? 's' : ''} due for spaced repetition review. Revise now to strengthen your memory!`;

  await (supabase.from('notifications') as any).insert({
    user_id: userId,
    type: 'info',
    title,
    message: body,
    link: '/dashboard/revision',
    is_read: false,
  });

  // Best-effort web push
  try {
    const { sendPushToUser } = await import('@/lib/notifications/push-service');
    await sendPushToUser(userId, { title, body, url: '/dashboard/revision', tag: 'srs-due' });
  } catch { /* push is best-effort */ }

  return dueCount;
}

// ─── Weekly Progress Digest ──────────────────────────────────────

export async function generateWeeklyDigest(userId: string): Promise<void> {
  const supabase = getSupabase();

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  // Get this week's activity
  const { data: recentActivityRaw } = await supabase
    .from('user_mastery')
    .select('mastery_level, accuracy_score, attempts, correct, time_spent_seconds')
    .eq('user_id', userId)
    .gte('last_attempted_at', weekAgo);

  const recentActivity = recentActivityRaw as any[] | null;

  if (!recentActivity || recentActivity.length === 0) {
    // No activity — gentle nudge
    const nudgeTitle = 'Weekly Study Reminder';
    const nudgeBody = 'You haven\'t studied this week. Even 15 minutes a day makes a difference for UPSC preparation!';
    await (supabase.from('notifications') as any).insert({
      user_id: userId,
      type: 'info',
      title: nudgeTitle,
      message: nudgeBody,
      link: '/dashboard',
      is_read: false,
    });
    try {
      const { sendPushToUser } = await import('@/lib/notifications/push-service');
      await sendPushToUser(userId, { title: nudgeTitle, body: nudgeBody, url: '/dashboard', tag: 'weekly-digest' });
    } catch { /* push is best-effort */ }
    return;
  }

  const topicsStudied = recentActivity.length;
  const totalTime = recentActivity.reduce((s, r) => s + (r.time_spent_seconds || 0), 0);
  const avgAccuracy = recentActivity.reduce((s, r) => s + (r.accuracy_score || 0), 0) / topicsStudied;
  const mastered = recentActivity.filter(r => r.mastery_level === 'mastered').length;

  const minutes = Math.round(totalTime / 60);
  const hours = Math.floor(minutes / 60);
  const timeStr = hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;

  const digestTitle = 'Your Weekly Progress';
  const digestBody = [
    `Topics studied: ${topicsStudied}`,
    `Time invested: ${timeStr}`,
    `Average accuracy: ${Math.round(avgAccuracy * 100)}%`,
    mastered > 0 ? `Topics mastered: ${mastered}` : null,
  ].filter(Boolean).join(' | ');

  await (supabase.from('notifications') as any).insert({
    user_id: userId,
    type: 'success',
    title: digestTitle,
    message: digestBody,
    link: '/dashboard/revision',
    is_read: false,
  });

  // Best-effort web push
  try {
    const { sendPushToUser } = await import('@/lib/notifications/push-service');
    await sendPushToUser(userId, { title: digestTitle, body: digestBody, url: '/dashboard/revision', tag: 'weekly-digest' });
  } catch { /* push is best-effort */ }
}

// ─── CA Topic Alerts ────────────────────────────────────────────

/**
 * "New CA linked to your weak topic: {topic} — revise now"
 * Queries today's current_affairs that have node_id set,
 * checks if user_mastery for that node_id is weak/developing,
 * and creates a notification for each match.
 */
export async function generateCATopicAlerts(userId: string): Promise<number> {
  const supabase = getSupabase();
  const today = new Date().toISOString().split('T')[0];

  // Get today's CA articles that are linked to a knowledge node
  const { data: caArticlesRaw } = await supabase
    .from('current_affairs')
    .select('id, title, node_id')
    .not('node_id', 'is', null)
    .gte('created_at', today);

  const caArticles = caArticlesRaw as any[] | null;
  if (!caArticles || caArticles.length === 0) return 0;

  const nodeIds = caArticles.map((ca: any) => ca.node_id).filter(Boolean);

  // Check which of these nodes are weak or developing for this user
  const { data: weakNodesRaw } = await supabase
    .from('user_mastery')
    .select('node_id, mastery_level')
    .eq('user_id', userId)
    .in('node_id', nodeIds)
    .in('mastery_level', ['weak', 'developing']);

  const weakNodes = weakNodesRaw as any[] | null;
  if (!weakNodes || weakNodes.length === 0) return 0;

  const weakNodeIds = new Set(weakNodes.map((n: any) => n.node_id));
  let created = 0;

  for (const ca of caArticles) {
    if (!weakNodeIds.has(ca.node_id)) continue;

    // Deduplicate: check if we already sent this alert today
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'info')
      .like('title', `%${ca.title}%`)
      .gte('created_at', today)
      .limit(1);

    if (existing && existing.length > 0) continue;

    const title = `New CA linked to your weak topic: ${ca.title}`;
    const body = `New CA linked to your weak topic: ${ca.title} — revise now`;

    await (supabase.from('notifications') as any).insert({
      user_id: userId,
      type: 'info',
      title,
      message: body,
      link: '/dashboard/revision',
      is_read: false,
    });

    try {
      const { sendPushToUser } = await import('@/lib/notifications/push-service');
      await sendPushToUser(userId, { title, body, url: '/dashboard/revision', tag: 'ca-topic-alert' });
    } catch { /* push is best-effort */ }

    created++;
  }

  return created;
}

// ─── Subject Inactivity Alerts ──────────────────────────────────

/**
 * "You haven't studied {subject} in {days} days — {count} new CAs linked"
 * Groups user_mastery by subject (via knowledge_nodes.subject),
 * finds subjects where MAX(last_attempted_at) > 7 days ago,
 * and counts new CA articles linked to that subject.
 */
export async function generateSubjectInactivityAlerts(userId: string): Promise<number> {
  const supabase = getSupabase();
  const today = new Date().toISOString().split('T')[0];

  // Get user mastery with subject info from knowledge_nodes
  const { data: masteryRowsRaw } = await supabase
    .from('user_mastery')
    .select('node_id, last_attempted_at, knowledge_nodes(subject)')
    .eq('user_id', userId);

  const masteryRows = masteryRowsRaw as any[] | null;
  if (!masteryRows || masteryRows.length === 0) return 0;

  // Group by subject and find max last_attempted_at
  const subjectMap: Record<string, { lastAttempted: string; nodeIds: string[] }> = {};

  for (const row of masteryRows) {
    const subject = (row.knowledge_nodes as any)?.subject;
    if (!subject) continue;

    if (!subjectMap[subject]) {
      subjectMap[subject] = { lastAttempted: row.last_attempted_at || '', nodeIds: [] };
    }

    subjectMap[subject].nodeIds.push(row.node_id);

    if (row.last_attempted_at && row.last_attempted_at > subjectMap[subject].lastAttempted) {
      subjectMap[subject].lastAttempted = row.last_attempted_at;
    }
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
  let created = 0;

  for (const [subject, data] of Object.entries(subjectMap)) {
    if (!data.lastAttempted) continue;

    const lastDate = new Date(data.lastAttempted);
    if (lastDate >= sevenDaysAgo) continue;

    const daysSince = Math.floor((Date.now() - lastDate.getTime()) / 86400000);

    // Count new CA articles linked to nodes in this subject
    const { count: caCount } = await supabase
      .from('current_affairs')
      .select('*', { count: 'exact', head: true })
      .in('node_id', data.nodeIds)
      .gte('created_at', data.lastAttempted);

    // Deduplicate: check if we already sent this alert today
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'info')
      .like('title', `%${subject}%`)
      .like('title', '%haven%')
      .gte('created_at', today)
      .limit(1);

    if (existing && existing.length > 0) continue;

    const linkedCAs = caCount || 0;
    const title = `You haven't studied ${subject} in ${daysSince} days`;
    const body = `You haven't studied ${subject} in ${daysSince} days — ${linkedCAs} new CAs linked`;

    await (supabase.from('notifications') as any).insert({
      user_id: userId,
      type: 'info',
      title,
      message: body,
      link: '/dashboard/revision',
      is_read: false,
    });

    try {
      const { sendPushToUser } = await import('@/lib/notifications/push-service');
      await sendPushToUser(userId, { title, body, url: '/dashboard/revision', tag: 'subject-inactivity' });
    } catch { /* push is best-effort */ }

    created++;
  }

  return created;
}

// ─── Accuracy Regression Alerts ─────────────────────────────────

/**
 * "Your {subject} accuracy dropped from {old}% to {new}% — 15-min revision suggested"
 * Compares this week's average accuracy per subject vs last week's.
 * If dropped by more than 10%, creates a notification.
 */
export async function generateAccuracyRegressionAlerts(userId: string): Promise<number> {
  const supabase = getSupabase();
  const today = new Date().toISOString().split('T')[0];
  const now = Date.now();
  const oneWeekAgo = new Date(now - 7 * 86400000).toISOString();
  const twoWeeksAgo = new Date(now - 14 * 86400000).toISOString();

  // Get this week's mastery data with subject
  const { data: thisWeek } = await supabase
    .from('user_mastery')
    .select('node_id, accuracy_score, knowledge_nodes(subject)')
    .eq('user_id', userId)
    .gte('last_attempted_at', oneWeekAgo);

  // Get last week's mastery data with subject
  const { data: lastWeek } = await supabase
    .from('user_mastery')
    .select('node_id, accuracy_score, knowledge_nodes(subject)')
    .eq('user_id', userId)
    .gte('last_attempted_at', twoWeeksAgo)
    .lt('last_attempted_at', oneWeekAgo);

  if (!thisWeek || thisWeek.length === 0 || !lastWeek || lastWeek.length === 0) return 0;

  // Average accuracy per subject for each week
  function avgBySubject(rows: any[]): Record<string, number> {
    const sums: Record<string, { total: number; count: number }> = {};
    for (const row of rows) {
      const subject = (row.knowledge_nodes as any)?.subject;
      if (!subject || row.accuracy_score == null) continue;
      if (!sums[subject]) sums[subject] = { total: 0, count: 0 };
      sums[subject].total += row.accuracy_score;
      sums[subject].count++;
    }
    const result: Record<string, number> = {};
    for (const [sub, { total, count }] of Object.entries(sums)) {
      result[sub] = total / count;
    }
    return result;
  }

  const thisWeekAvg = avgBySubject(thisWeek);
  const lastWeekAvg = avgBySubject(lastWeek);

  let created = 0;

  for (const [subject, oldAccuracy] of Object.entries(lastWeekAvg)) {
    const newAccuracy = thisWeekAvg[subject];
    if (newAccuracy == null) continue;

    const oldPct = Math.round(oldAccuracy * 100);
    const newPct = Math.round(newAccuracy * 100);
    const drop = oldPct - newPct;

    if (drop <= 10) continue;

    // Deduplicate: check if we already sent this alert today
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'warning')
      .like('title', `%${subject}%accuracy%`)
      .gte('created_at', today)
      .limit(1);

    if (existing && existing.length > 0) continue;

    const title = `${subject} accuracy dropped`;
    const body = `Your ${subject} accuracy dropped from ${oldPct}% to ${newPct}% — 15-min revision suggested`;

    await (supabase.from('notifications') as any).insert({
      user_id: userId,
      type: 'warning',
      title,
      message: body,
      link: '/dashboard/revision',
      is_read: false,
    });

    try {
      const { sendPushToUser } = await import('@/lib/notifications/push-service');
      await sendPushToUser(userId, { title, body, url: '/dashboard/revision', tag: 'accuracy-regression' });
    } catch { /* push is best-effort */ }

    created++;
  }

  return created;
}

export const masteryNotifications = {
  checkStreakMilestones,
  notifyLevelUp,
  generateDueReminders,
  generateWeeklyDigest,
  generateCATopicAlerts,
  generateSubjectInactivityAlerts,
  generateAccuracyRegressionAlerts,
};
