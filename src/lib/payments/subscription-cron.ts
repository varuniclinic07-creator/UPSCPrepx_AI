// ═══════════════════════════════════════════════════════════════
// SUBSCRIPTION RENEWAL CRON
// Check and renew/expire subscriptions daily
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';

/**
 * Expire subscriptions that have ended
 */
export async function expireSubscriptions() {
    const supabase = await createClient();

    try {
        const { data: expired } = await (supabase.rpc as any)('expire_subscriptions');

        console.log(`✅ Expired ${expired?.[0]?.expired_count || 0} subscriptions`);

        return expired?.[0]?.expired_count || 0;
    } catch (error) {
        console.error('Subscription expiry error:', error);
        throw error;
    }
}

/**
 * Send renewal reminders (7 days before expiry)
 */
export async function sendRenewalReminders() {
    const supabase = await createClient();

    try {
        const now = new Date();
        const sevenDaysLater = new Date();
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

        // Get subscriptions expiring in 7 days
        const { data: expiringSubs } = await (supabase
            .from('user_subscriptions') as any)
            .select(`
        *,
        users(email, name),
        subscription_plans(name)
      `)
            .eq('status', 'active')
            .gte('ends_at', now.toISOString())
            .lte('ends_at', sevenDaysLater.toISOString());

        if (!expiringSubs || expiringSubs.length === 0) {
            console.log('No subscriptions expiring soon');
            return 0;
        }

        // Send email reminders (integrate with email service)
        for (const sub of expiringSubs) {
            console.log(`Reminder: ${sub.users.email} - ${sub.subscription_plans.name} expires on ${sub.ends_at}`);

            // TODO: Send actual email via SendGrid/SES
            // await sendEmail({
            //   to: sub.users.email,
            //   subject: 'Your subscription is expiring soon',
            //   template: 'renewal-reminder',
            //   data: { name: sub.users.name, expiryDate: sub.ends_at, plan: sub.subscription_plans.name }
            // });
        }

        console.log(`✅ Sent ${expiringSubs.length} renewal reminders`);
        return expiringSubs.length;

    } catch (error) {
        console.error('Renewal reminder error:', error);
        throw error;
    }
}

/**
 * Run all subscription maintenance tasks
 */
export async function runSubscriptionMaintenance() {
    console.log('🔄 Running subscription maintenance...');

    const expiredCount = await expireSubscriptions();
    const remindersCount = await sendRenewalReminders();

    console.log(`✅ Maintenance complete - ${expiredCount} expired, ${remindersCount} reminders sent`);
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
