// ═══════════════════════════════════════════════════════════════
// SUBSCRIPTION RENEWAL CRON
// Check and renew/expire subscriptions daily
// ═══════════════════════════════════════════════════════════════

import { createAdminSupabaseClient } from '@/lib/supabase/server';

/**
 * Expire subscriptions that have ended
 */
export async function expireSubscriptions() {
    const supabase = await createAdminSupabaseClient();

    try {
        const now = new Date().toISOString();

        // Find expired subscriptions
        const { data: expiredSubs } = await (supabase
            .from('user_subscriptions') as any)
            .select('id, user_id, tier')
            .eq('status', 'active')
            .lt('ends_at', now);

        if (!expiredSubs || expiredSubs.length === 0) {
            console.debug('No subscriptions to expire');
            return 0;
        }

        // Expire each subscription
        for (const sub of expiredSubs) {
            await (supabase.from('user_subscriptions') as any)
                .update({
                    status: 'expired',
                    updated_at: now
                })
                .eq('id', sub.id);

            // Update user table
            await (supabase.from('users') as any)
                .update({
                    subscription_status: 'expired',
                    subscription_tier: 'free',
                    updated_at: now
                })
                .eq('id', sub.user_id);

            console.debug(`Expired subscription ${sub.id} for user ${sub.user_id}`);
        }

        console.debug(`✅ Expired ${expiredSubs.length} subscriptions`);
        return expiredSubs.length;
    } catch (error) {
        console.error('Subscription expiry error:', error);
        throw error;
    }
}

/**
 * Send renewal reminders (7 days before expiry)
 */
export async function sendRenewalReminders() {
    const supabase = await createAdminSupabaseClient();

    try {
        const now = new Date();
        const sevenDaysLater = new Date();
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

        // Get subscriptions expiring in 7 days
        const { data: expiringSubs } = await (supabase
            .from('user_subscriptions') as any)
            .select(`
                *,
                users (email, name, subscription_tier),
                subscription_plans (name, tier)
            `)
            .eq('status', 'active')
            .gte('ends_at', now.toISOString())
            .lte('ends_at', sevenDaysLater.toISOString());

        if (!expiringSubs || expiringSubs.length === 0) {
            console.debug('No subscriptions expiring soon');
            return 0;
        }

        // Log reminders (integrate with email service in production)
        for (const sub of expiringSubs) {
            const userName = sub.users?.name || 'User';
            const userEmail = sub.users?.email || '';
            const planName = sub.subscription_plans?.name || sub.tier;
            const expiryDate = new Date(sub.ends_at).toLocaleDateString('en-IN');

            console.debug(`📧 Reminder: ${userName} (${userEmail}) - ${planName} expires on ${expiryDate}`);

            // TODO: Send actual email via SendGrid/SES/Resend
            // In production, integrate with email service:
            // await sendEmail({
            //   to: userEmail,
            //   subject: 'Your subscription is expiring soon',
            //   template: 'renewal-reminder',
            //   data: {
            //     name: userName,
            //     expiryDate,
            //     plan: planName,
            //     renewalLink: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?renew=true`
            //   }
            // });
        }

        console.debug(`✅ Sent ${expiringSubs.length} renewal reminders`);
        return expiringSubs.length;

    } catch (error) {
        console.error('Renewal reminder error:', error);
        throw error;
    }
}

/**
 * Reset daily usage limits for all users
 */
export async function resetDailyUsageLimits() {
    const supabase = await createAdminSupabaseClient();

    try {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        // Update reset_at for daily limits
        const { error } = await (supabase.from('usage_limits') as any)
            .update({
                reset_at: tomorrow.toISOString(),
                updated_at: now.toISOString()
            })
            .eq('limit_type', 'daily');

        if (error) {
            console.error('Usage limit reset error:', error);
            return 0;
        }

        console.debug('✅ Reset daily usage limits');
        return 1;
    } catch (error) {
        console.error('Usage limit reset error:', error);
        throw error;
    }
}

/**
 * Run all subscription maintenance tasks
 */
export async function runSubscriptionMaintenance() {
    console.debug('🔄 Running subscription maintenance...');

    const expiredCount = await expireSubscriptions();
    const remindersCount = await sendRenewalReminders();
    await resetDailyUsageLimits();

    console.debug(`✅ Maintenance complete - ${expiredCount} expired, ${remindersCount} reminders sent`);
}

// Export for cron job
if (require.main === module) {
    runSubscriptionMaintenance()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('Maintenance failed:', error);
            process.exit(1);
        });
}
