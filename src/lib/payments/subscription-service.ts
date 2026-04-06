// ═══════════════════════════════════════════════════════════════
// SUBSCRIPTION SERVICE
// Create and manage user subscriptions
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';

export interface Subscription {
    id: string;
    userId: string;
    tier: string;
    status: string;
    startsAt: Date;
    endsAt: Date;
}

/**
 * Create subscription from payment
 */
export async function createSubscription(
    userId: string,
    planId: string,
    paymentId: string
): Promise<Subscription> {
    const supabase = await createClient();

    // Get plan details
    const { data: plan } = await (supabase
        .from('subscription_plans') as any)
        .select('*')
        .eq('id', planId)
        .single();

    if (!plan) {
        throw new Error('Plan not found');
    }

    const now = new Date();
    const endsAt = new Date();
    endsAt.setMonth(endsAt.getMonth() + plan.duration_months);

    // Create subscription
    const { data: subscription, error } = await (supabase
        .from('user_subscriptions') as any)
        .insert({
            user_id: userId,
            payment_id: paymentId,
            plan_id: planId,
            tier: plan.tier,
            starts_at: now.toISOString(),
            ends_at: endsAt.toISOString(),
            status: 'active'
        })
        .select()
        .single();

    if (error) {
        throw new Error('Failed to create subscription');
    }

    // Update user
    await (supabase
        .from('users') as any)
        .update({
            subscription_tier: plan.tier,
            subscription_status: 'active',
            subscription_ends_at: endsAt.toISOString(),
            post_trial: false // Disable post-trial access
        })
        .eq('id', userId);

    // Mark trial as converted if exists
    await (supabase.rpc as any)('convert_trial_to_paid', {
        p_user_id: userId,
        p_plan_tier: plan.tier
    });

    return {
        id: subscription.id,
        userId,
        tier: plan.tier,
        status: 'active',
        startsAt: now,
        endsAt
    };
}

/**
 * Renew expired subscriptions (for auto-renewal)
 */
export async function renewSubscription(subscriptionId: string, _paymentId: string) {
    const supabase = await createClient();

    const { data: subscription } = await (supabase
        .from('user_subscriptions') as any)
        .select('*, subscription_plans(*)')
        .eq('id', subscriptionId)
        .single();

    if (!subscription) {
        throw new Error('Subscription not found');
    }

    const plan = subscription.subscription_plans;
    const newEndsAt = new Date();
    newEndsAt.setMonth(newEndsAt.getMonth() + plan.duration_months);

    // Update subscription
    await (supabase
        .from('user_subscriptions') as any)
        .update({
            ends_at: newEndsAt.toISOString(),
            status: 'active',
            last_renewed_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

    // Update user
    await (supabase
        .from('users') as any)
        .update({
            subscription_status: 'active',
            subscription_ends_at: newEndsAt.toISOString()
        })
        .eq('id', subscription.user_id);
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string) {
    const supabase = await createClient();

    const { data: subscription } = await (supabase
        .from('user_subscriptions') as any)
        .select('*')
        .eq('id', subscriptionId)
        .single();

    if (!subscription) {
        throw new Error('Subscription not found');
    }

    await (supabase
        .from('user_subscriptions') as any)
        .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

    await (supabase
        .from('users') as any)
        .update({
            subscription_status: 'cancelled'
        })
        .eq('id', subscription.user_id);
}