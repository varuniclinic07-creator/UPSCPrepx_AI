// ═══════════════════════════════════════════════════════════════
// SUBSCRIPTION SERVICE
// Business logic for subscription management
// ═══════════════════════════════════════════════════════════════

import { BaseService, ServiceResult } from './base.service';
import { createClient } from '@/lib/supabase/server';
import { createSubscriptionError, createNotFoundError } from '@/lib/errors/app-error';

export interface SubscriptionStatus {
    tier: string;
    status: 'active' | 'cancelled' | 'expired' | 'trial' | 'free';
    endsAt?: string;
    startsAt?: string;
    billingCycle?: string;
    trial?: {
        isActive: boolean;
        endsAt?: string;
        isPostTrial: boolean;
    };
    features: {
        hasFullAccess: boolean;
        isFree: boolean;
    };
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    slug: string;
    tier: string;
    priceMonthly: number;
    priceQuarterly?: number;
    priceYearly?: number;
    gstPercentage: number;
    durationMonths: number;
    features: string[];
    limits: Record<string, unknown>;
    isPopular: boolean;
}

export class SubscriptionService extends BaseService {
    constructor() {
        super({
            serviceName: 'subscription',
            timeoutMs: 10000,
            maxRetries: 3,
        });
    }

    /**
     * Get user's subscription status
     */
    async getSubscriptionStatus(userId: string): Promise<ServiceResult<SubscriptionStatus>> {
        return this.safeExecute('getSubscriptionStatus', async () => {
            const supabase = await createClient();

            // Try RPC first
            let subscription = null;
            try {
                const { data: rpcData } = await (supabase.rpc as any)('get_user_subscription_tier', {
                    p_user_id: userId,
                });
                if (rpcData) {
                    subscription = { tier: rpcData };
                }
            } catch {
                // RPC not available, use direct query
            }

            // Direct query fallback
            if (!subscription) {
                const now = new Date().toISOString();

                const { data: userSub } = await (supabase.from('user_subscriptions') as any)
                    .select(`
                        *,
                        subscription_plans (name, tier, features, limits)
                    `)
                    .eq('user_id', userId)
                    .eq('status', 'active')
                    .gte('ends_at', now)
                    .order('ends_at', { ascending: false })
                    .single();

                if (userSub) {
                    subscription = {
                        id: userSub.id,
                        tier: userSub.tier,
                        status: userSub.status,
                        endsAt: userSub.ends_at,
                        startsAt: userSub.starts_at,
                        billingCycle: userSub.billing_cycle,
                        plan: userSub.subscription_plans,
                    };
                }
            }

            // Get user data for trial info
            const { data: userData } = await (supabase.from('users') as any)
                .select('subscription_tier, subscription_status, subscription_ends_at, trial_started_at, trial_ends_at, post_trial')
                .eq('id', userId)
                .single();

            const now = new Date();
            const isTrialActive = userData?.trial_ends_at &&
                new Date(userData.trial_ends_at) > now &&
                userData.subscription_status === 'trial';

            const isPostTrial = userData?.post_trial === true;

            return {
                subscription: subscription || null,
                user: {
                    tier: userData?.subscription_tier || 'free',
                    status: userData?.subscription_status || 'free',
                    endsAt: userData?.subscription_ends_at,
                    trial: {
                        isActive: isTrialActive,
                        endsAt: userData?.trial_ends_at,
                        isPostTrial: isPostTrial,
                    },
                },
                features: {
                    hasFullAccess: !!(subscription || isTrialActive),
                    isFree: !subscription && !isTrialActive,
                },
            } as SubscriptionStatus;
        });
    }

    /**
     * Get all available subscription plans
     */
    async getPlans(): Promise<ServiceResult<SubscriptionPlan[]>> {
        return this.safeExecute('getPlans', async () => {
            const supabase = await createClient();

            const { data: plans, error } = await (supabase.from('subscription_plans') as any)
                .select('*')
                .eq('is_active', true)
                .order('price_monthly', { ascending: true });

            if (error) {
                throw createSubscriptionError('Failed to fetch plans', { databaseError: error });
            }

            return (plans as any[]).map((plan) => ({
                id: plan.id,
                name: plan.name,
                slug: plan.slug,
                tier: plan.tier,
                priceMonthly: plan.price_monthly,
                priceQuarterly: plan.price_quarterly,
                priceYearly: plan.price_yearly,
                gstPercentage: plan.gst_percentage || 18,
                durationMonths: plan.duration_months || 1,
                features: plan.features || [],
                limits: plan.limits || {},
                isPopular: plan.is_popular || false,
            }));
        });
    }

    /**
     * Get plan by slug
     */
    async getPlanBySlug(slug: string): Promise<ServiceResult<SubscriptionPlan>> {
        return this.safeExecute('getPlanBySlug', async () => {
            const supabase = await createClient();

            const { data: plan, error } = await (supabase.from('subscription_plans') as any)
                .select('*')
                .eq('slug', slug)
                .single();

            if (error || !plan) {
                throw createNotFoundError('Plan', slug);
            }

            return {
                id: plan.id,
                name: plan.name,
                slug: plan.slug,
                tier: plan.tier,
                priceMonthly: plan.price_monthly,
                priceQuarterly: plan.price_quarterly,
                priceYearly: plan.price_yearly,
                gstPercentage: plan.gst_percentage || 18,
                durationMonths: plan.duration_months || 1,
                features: plan.features || [],
                limits: plan.limits || {},
                isPopular: plan.is_popular || false,
            };
        });
    }

    /**
     * Upgrade user's subscription
     */
    async upgradeSubscription(userId: string, newPlanSlug: string): Promise<ServiceResult<void>> {
        return this.safeExecute('upgradeSubscription', async () => {
            const supabase = await createClient();

            // Get new plan
            const { data: newPlan } = await (supabase.from('subscription_plans') as any)
                .select('*')
                .eq('slug', newPlanSlug)
                .single();

            if (!newPlan) {
                throw createNotFoundError('Plan', newPlanSlug);
            }

            // Get current subscription
            const now = new Date().toISOString();
            const { data: currentSub } = await (supabase.from('user_subscriptions') as any)
                .select('*')
                .eq('user_id', userId)
                .eq('status', 'active')
                .gte('ends_at', now)
                .single();

            if (currentSub) {
                // Extend existing subscription
                const newEndsAt = new Date(currentSub.ends_at);
                newEndsAt.setMonth(newEndsAt.getMonth() + (newPlan.duration_months || 1));

                await (supabase.from('user_subscriptions') as any)
                    .update({
                        tier: newPlan.tier,
                        plan_id: newPlan.id,
                        ends_at: newEndsAt.toISOString(),
                        billing_cycle: 'monthly',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', currentSub.id);
            } else {
                // Create new subscription
                const startsAt = new Date();
                const endsAt = new Date();
                endsAt.setMonth(endsAt.getMonth() + (newPlan.duration_months || 1));

                await (supabase.from('user_subscriptions') as any).insert({
                    user_id: userId,
                    plan_id: newPlan.id,
                    tier: newPlan.tier,
                    billing_cycle: 'monthly',
                    starts_at: startsAt.toISOString(),
                    ends_at: endsAt.toISOString(),
                    status: 'active',
                });
            }

            // Update user table
            await (supabase.from('users') as any)
                .update({
                    subscription_tier: newPlan.tier,
                    subscription_status: 'active',
                    subscription_ends_at: new Date().setMonth(new Date().getMonth() + (newPlan.duration_months || 1)),
                })
                .eq('id', userId);

            this.logger.info('Subscription upgraded', {
                userId,
                newPlan: newPlan.tier,
            });
        });
    }

    /**
     * Cancel user's subscription
     */
    async cancelSubscription(userId: string, reason?: string): Promise<ServiceResult<void>> {
        return this.safeExecute('cancelSubscription', async () => {
            const supabase = await createClient();

            const now = new Date().toISOString();

            // Get active subscription
            const { data: subscription } = await (supabase.from('user_subscriptions') as any)
                .select('*')
                .eq('user_id', userId)
                .eq('status', 'active')
                .gte('ends_at', now)
                .single();

            if (!subscription) {
                throw createNotFoundError('Active subscription', userId);
            }

            // Mark as cancelled at period end
            await (supabase.from('user_subscriptions') as any)
                .update({
                    cancel_at_period_end: true,
                    cancelled_at: new Date().toISOString(),
                    cancellation_reason: reason,
                })
                .eq('id', subscription.id);

            this.logger.info('Subscription cancelled', {
                userId,
                subscriptionId: subscription.id,
                reason,
            });
        });
    }

    /**
     * Check if user has access to a feature based on tier
     */
    async hasFeatureAccess(userId: string, feature: string): Promise<ServiceResult<boolean>> {
        return this.safeExecute('hasFeatureAccess', async () => {
            const { data: subscription } = await this.getSubscriptionStatus(userId);

            // Free tier has limited access
            if (subscription?.features.isFree) {
                // Check usage limits for free tier
                const supabase = await createClient();
                const { count } = await (supabase.from('usage_tracking') as any)
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', userId)
                    .eq('feature_name', feature)
                    .gte('used_at', new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z').toISOString());

                // Free tier limits (configurable)
                const freeLimits: Record<string, number> = {
                    notes_generate: 5,
                    mcq: 3,
                    doubt: 3,
                    mind_maps: 2,
                };

                const limit = freeLimits[feature] || 0;
                return (count || 0) < limit;
            }

            // Paid tiers have full access
            return subscription?.features.hasFullAccess || false;
        });
    }
}

// Singleton instance
let subscriptionServiceInstance: SubscriptionService | null = null;

export function getSubscriptionService(): SubscriptionService {
    if (!subscriptionServiceInstance) {
        subscriptionServiceInstance = new SubscriptionService();
    }
    return subscriptionServiceInstance;
}
