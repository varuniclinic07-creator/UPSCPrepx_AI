// ═══════════════════════════════════════════════════════════════
// SESSION MANAGEMENT - SUPABASE AUTH ONLY
// Check trial status, feature access, and subscription
// ═══════════════════════════════════════════════════════════════

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { checkTrialStatus, canAccessFeaturePostTrial } from '@/lib/trial/trial-service';

export interface UserSession {
    id: string;
    email: string;
    name?: string;
    phone?: string;
    role: string;
    subscriptionTier: string;
    subscriptionStatus: string;
    trialEndsAt?: string;
    subscriptionEndsAt?: string;
}

/**
 * Get user session with subscription info
 */
export async function getUserSession(): Promise<UserSession | null> {
    const supabase = await createServerSupabaseClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
        return null;
    }

    const { data: user } = await (supabase
        .from('users') as any)
        .select('*')
        .eq('id', authUser.id)
        .single();

    if (!user) {
        return null;
    }

    return {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        subscriptionTier: user.subscription_tier,
        subscriptionStatus: user.subscription_status,
        trialEndsAt: user.trial_ends_at,
        subscriptionEndsAt: user.subscription_ends_at
    };
}

/**
 * Check if user can access a feature
 */
export async function canAccessFeature(
    userId: string,
    featureName: string,
    contentType?: string
): Promise<boolean> {
    const supabase = await createServerSupabaseClient();

    // Get user
    const { data: user } = await (supabase
        .from('users') as any)
        .select('*')
        .eq('id', userId)
        .single();

    if (!user) {
        return false;
    }

    // If paid subscriber, allow all
    if (['basic', 'premium', 'premium_plus'].includes(user.subscription_tier) &&
        user.subscription_status === 'active') {
        return true;
    }

    // Check trial status
    const trialStatus = await checkTrialStatus(userId);

    if (trialStatus.canAccessPremium) {
        return true;
    }

    // Check post-trial access
    if (user.post_trial) {
        return await canAccessFeaturePostTrial(userId, featureName, contentType);
    }

    return false;
}

/**
 * Require session (throw error if not authenticated)
 */
export async function requireSession(): Promise<UserSession> {
    const session = await getUserSession();

    if (!session) {
        throw new Error('Unauthorized');
    }

    return session;
}

/**
 * Require subscription (throw error if trial/expired)
 */
export async function requireSubscription(minTier: string = 'basic'): Promise<UserSession> {
    const session = await requireSession();

    const tierHierarchy = ['trial', 'basic', 'premium', 'premium_plus'];
    const userTierIndex = tierHierarchy.indexOf(session.subscriptionTier);
    const minTierIndex = tierHierarchy.indexOf(minTier);

    if (userTierIndex < minTierIndex) {
        throw new Error('Subscription required');
    }

    if (session.subscriptionStatus !== 'active' && session.subscriptionStatus !== 'trial') {
        throw new Error('Active subscription required');
    }

    return session;
}

/**
 * Require admin role
 */
export async function requireAdmin(): Promise<UserSession> {
    const session = await requireSession();

    if (session.role !== 'admin' && session.role !== 'super_admin') {
        throw new Error('Admin access required');
    }

    return session;
}

/**
 * Alias for requireSession - used by some API routes
 */
export const requireAuth = requireSession;