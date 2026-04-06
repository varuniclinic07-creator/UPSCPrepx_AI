// ═══════════════════════════════════════════════════════════════
// TRIAL ACTIVATION SERVICE
// Auto-activates 24-hour trial on signup
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';

export interface TrialInfo {
    userId: string;
    startedAt: Date;
    endsAt: Date;
    isActive: boolean;
    timeRemainingSeconds: number;
}

/**
 * Activate trial for new user (called by signup trigger)
 * NOTE: This is primarily handled by database trigger,
 * but this function can be used for manual activation
 */
export async function activateTrial(userId: string): Promise<TrialInfo> {
    const supabase = await createClient();

    const now = new Date();
    const endsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user record
    const { error: userError } = await (supabase
        .from('users') as any)
        .update({
            trial_started_at: now.toISOString(),
            trial_ends_at: endsAt.toISOString(),
            trial_used: true,
            subscription_status: 'trial'
        })
        .eq('id', userId);

    if (userError) {
        console.error('Error activating trial:', userError);
        throw new Error('Failed to activate trial');
    }

    // Create trial session
    const { error: sessionError } = await (supabase
        .from('trial_sessions') as any)
        .insert({
            user_id: userId,
            started_at: now.toISOString(),
            ends_at: endsAt.toISOString()
        });

    if (sessionError) {
        console.error('Error creating trial session:', sessionError);
    }

    return {
        userId,
        startedAt: now,
        endsAt,
        isActive: true,
        timeRemainingSeconds: 24 * 60 * 60
    };
}

/**
 * Check trial status for user
 */
export async function checkTrialStatus(userId: string): Promise<{
    isActive: boolean;
    timeRemainingSeconds: number;
    hasExpired: boolean;
    canAccessPremium: boolean;
}> {
    const supabase = await createClient();

    const { data, error } = await (supabase as any).rpc('check_trial_status', {
        p_user_id: userId
    });

    if (error || !data || data.length === 0) {
        return {
            isActive: false,
            timeRemainingSeconds: 0,
            hasExpired: true,
            canAccessPremium: false
        };
    }

    const result = data[0];

    return {
        isActive: result.is_active,
        timeRemainingSeconds: result.time_remaining_seconds,
        hasExpired: result.has_expired,
        canAccessPremium: result.can_access_premium
    };
}

/**
 * Track feature usage during trial
 */
export async function trackTrialFeatureUsage(
    userId: string,
    featureName: string
): Promise<void> {
    const supabase = await createClient();

    await (supabase as any).rpc('track_trial_feature_usage', {
        p_user_id: userId,
        p_feature_name: featureName
    });
}

/**
 * Check if user can access feature (post-trial)
 */
export async function canAccessFeaturePostTrial(
    userId: string,
    featureName: string,
    contentType?: string
): Promise<boolean> {
    const supabase = await createClient();

    const { data, error } = await (supabase as any).rpc('can_access_feature_post_trial', {
        p_user_id: userId,
        p_feature_name: featureName,
        p_content_type: contentType
    });

    if (error || !data) {
        return false;
    }

    return data;
}

/**
 * Get trial statistics for user
 */
export async function getTrialStats(userId: string) {
    const supabase = await createClient();

    const { data: session } = await (supabase
        .from('trial_sessions') as any)
        .select('*')
        .eq('user_id', userId)
        .single();

    if (!session) {
        return null;
    }

    const now = new Date();
    const endsAt = new Date(session.ends_at);
    const timeRemaining = Math.max(0, endsAt.getTime() - now.getTime());

    return {
        startedAt: new Date(session.started_at),
        endsAt,
        timeRemainingMs: timeRemaining,
        timeRemainingHours: timeRemaining / (1000 * 60 * 60),
        isExpired: session.is_expired,
        featuresUsed: session.features_used || [],
        totalNotesGenerated: session.total_notes_generated,
        totalQuizzesTaken: session.total_quizzes_taken,
        convertedToPaid: session.converted_to_paid,
        convertedAt: session.converted_at,
        convertedToPlan: session.converted_to_plan
    };
}
