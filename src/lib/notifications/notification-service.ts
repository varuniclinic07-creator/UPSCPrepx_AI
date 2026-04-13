// ═══════════════════════════════════════════════════════════════
// NOTIFICATION SERVICE
// Push, email, and in-app notifications
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';

export interface Notification {
    id: string;
    userId: string;
    type: 'info' | 'success' | 'warning' | 'achievement';
    title: string;
    message: string;
    read: boolean;
    actionUrl?: string;
    createdAt: string;
}

/**
 * Create notification
 */
export async function createNotification(
    userId: string,
    type: Notification['type'],
    title: string,
    message: string,
    actionUrl?: string
): Promise<void> {
    const supabase = await createClient();

    await (supabase.from('notifications') as any).insert({
        user_id: userId,
        type,
        title,
        message,
        action_url: actionUrl,
        read: false
    });

    // Send web push notification (best-effort)
    try {
        const { sendPushToUser } = await import('./push-service');
        await sendPushToUser(userId, { title, body: message, url: actionUrl, tag: type });
    } catch {
        // Push is best-effort; in-app notification is already saved
    }
}

/**
 * Get user notifications
 */
export async function getUserNotifications(
    userId: string,
    limit: number = 20
): Promise<Notification[]> {
    const supabase = await createClient();

    const { data, error } = await (supabase
        .from('notifications') as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw new Error(error.message);

    return (data || []).map((n: any) => ({
        id: n.id,
        userId: n.user_id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        actionUrl: n.action_url,
        createdAt: n.created_at
    }));
}

/**
 * Mark as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
    const supabase = await createClient();
    await (supabase
        .from('notifications') as any)
        .update({ read: true })
        .eq('id', notificationId);
}

/**
 * Get unread count
 */
export async function getUnreadCount(userId: string): Promise<number> {
    const supabase = await createClient();

    const { count } = await (supabase
        .from('notifications') as any)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

    return count || 0;
}

// Notification templates
export const NOTIFICATION_TEMPLATES = {
    newBadge: (badgeName: string) => ({
        type: 'achievement' as const,
        title: 'New Badge Earned!',
        message: `Congratulations! You've earned the "${badgeName}" badge.`
    }),
    streakMilestone: (days: number) => ({
        type: 'success' as const,
        title: 'Streak Milestone!',
        message: `Amazing! You've maintained a ${days}-day study streak.`
    }),
    quizCompleted: (score: number) => ({
        type: 'info' as const,
        title: 'Quiz Completed',
        message: `You scored ${score}% on your recent quiz.`
    }),
    digestReady: () => ({
        type: 'info' as const,
        title: 'Daily Digest Ready',
        message: 'Your personalized current affairs digest is ready.',
        actionUrl: '/digest'
    })
};
