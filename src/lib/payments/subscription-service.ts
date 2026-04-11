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
    const { data: plan, error: planError } = await (supabase
        .from('subscription_plans') as any)
        .select('*')
        .eq('id', planId)
        .single();

    if (planError || !plan) {
        console.error('Plan fetch error:', planError);
        throw new Error('Plan not found');
    }

    const now = new Date();
    const durationMonths = plan.duration_months || 1;
    const endsAt = new Date();
    endsAt.setMonth(endsAt.getMonth() + durationMonths);

    // Check if user already has active subscription
    const { data: existingSub } = await (supabase
        .from('user_subscriptions') as any)
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gte('ends_at', now.toISOString())
        .single();

    if (existingSub) {
        // Extend existing subscription
        const { data: updatedSub } = await (supabase
            .from('user_subscriptions') as any)
            .update({
                ends_at: endsAt.toISOString(),
                tier: plan.tier,
                plan_id: planId,
                payment_id: paymentId,
                last_renewed_at: now.toISOString(),
                billing_cycle: 'monthly', // Default for single payment
                updated_at: now.toISOString()
            })
            .eq('id', existingSub.id)
            .select()
            .single();

        // Update user table
        await (supabase
            .from('users') as any)
            .update({
                subscription_tier: plan.tier,
                subscription_status: 'active',
                subscription_ends_at: endsAt.toISOString(),
                post_trial: false
            })
            .eq('id', userId);

        return {
            id: updatedSub.id,
            userId,
            tier: plan.tier,
            status: 'active',
            startsAt: now,
            endsAt
        };
    }

    // Create new subscription
    const { data: subscription, error } = await (supabase
        .from('user_subscriptions') as any)
        .insert({
            user_id: userId,
            plan_id: planId,
            payment_id: paymentId,
            tier: plan.tier,
            billing_cycle: 'monthly',
            starts_at: now.toISOString(),
            ends_at: endsAt.toISOString(),
            current_period_start: now.toISOString(),
            current_period_end: endsAt.toISOString(),
            status: 'active',
            auto_renew: false // Manual renewal for now
        })
        .select()
        .single();

    if (error) {
        console.error('Subscription creation error:', error);
        throw new Error('Failed to create subscription');
    }

    // Update user table
    await (supabase
        .from('users') as any)
        .update({
            subscription_tier: plan.tier,
            subscription_status: 'active',
            subscription_ends_at: endsAt.toISOString(),
            post_trial: false
        })
        .eq('id', userId);

    // Mark trial as converted if exists
    try {
        await (supabase.rpc as any)('convert_trial_to_paid', {
            p_user_id: userId,
            p_plan_tier: plan.tier
        });
    } catch (rpcError) {
        console.log('Trial conversion RPC not available, skipping');
    }

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