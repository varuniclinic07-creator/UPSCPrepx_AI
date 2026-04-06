import { createClient } from '@/lib/supabase/server';
import type { User } from '@/types';

/**
 * Admin service for dashboard statistics and user management
 */

interface AdminStats {
    totalUsers: number;
    activeUsers: number;
    trialUsers: number;
    basicUsers: number;
    premiumUsers: number;
    totalNotes: number;
    totalQuizzes: number;
    totalLeads: number;
}

/**
 * Get admin dashboard stats
 */
export async function getAdminStats(): Promise<AdminStats> {
    const supabase = await createClient();

    // Get user counts by tier
    const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

    const { count: trialUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_tier', 'trial');

    const { count: basicUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_tier', 'basic');

    const { count: premiumUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_tier', 'premium');

    // Get content counts
    const { count: totalNotes } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true });

    const { count: totalQuizzes } = await supabase
        .from('quizzes')
        .select('*', { count: 'exact', head: true });

    // Get lead count
    const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

    // Active users (logged in last 7 days) - approximated by updated_at
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: activeUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', sevenDaysAgo.toISOString());

    return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        trialUsers: trialUsers || 0,
        basicUsers: basicUsers || 0,
        premiumUsers: premiumUsers || 0,
        totalNotes: totalNotes || 0,
        totalQuizzes: totalQuizzes || 0,
        totalLeads: totalLeads || 0,
    };
}

/**
 * Get all users with pagination
 */
export async function getUsers(options: {
    page?: number;
    limit?: number;
    role?: string;
    tier?: string;
    search?: string;
}): Promise<{ users: User[]; total: number }> {
    const { page = 1, limit = 20, role, tier, search } = options;
    const offset = (page - 1) * limit;

    const supabase = await createClient();

    let query = supabase
        .from('users')
        .select('*', { count: 'exact' });

    if (role) {
        query = query.eq('role', role);
    }

    if (tier) {
        query = query.eq('subscription_tier', tier);
    }

    if (search) {
        query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }

    const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return {
        users: (data || []).map(d => mapDbUserToUser(d as any)),
        total: count || 0,
    };
}

/**
 * Update user role or subscription
 */
export async function updateUser(
    userId: string,
    updates: { role?: string; subscriptionTier?: string }
): Promise<User> {
    const supabase = await createClient();

    const dbUpdates: Record<string, string> = {};
    if (updates.role) dbUpdates.role = updates.role;
    if (updates.subscriptionTier) dbUpdates.subscription_tier = updates.subscriptionTier;

    const { data, error } = await (supabase.from('users') as any)
        .update(dbUpdates)
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to update user: ${error.message}`);
    }

    return mapDbUserToUser(data as any);
}

/**
 * Get AI providers
 */
export async function getAIProviders() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('ai_providers')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        throw new Error(`Failed to fetch AI providers: ${error.message}`);
    }

    return data || [];
}

/**
 * Update AI provider
 */
export async function updateAIProvider(
    providerId: string,
    updates: { isActive?: boolean; isDefault?: boolean; rateLimitRpm?: number }
) {
    const supabase = await createClient();

    const dbUpdates: Record<string, unknown> = {};
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.isDefault !== undefined) dbUpdates.is_default = updates.isDefault;
    if (updates.rateLimitRpm !== undefined) dbUpdates.rate_limit_rpm = updates.rateLimitRpm;

    const { data, error } = await (supabase.from('ai_providers') as any)
        .update(dbUpdates)
        .eq('id', providerId)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to update provider: ${error.message}`);
    }

    return data;
}

/**
 * Get feature config
 */
export async function getFeatures() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('feature_config')
        .select('*')
        .order('sort_order', { ascending: true });

    if (error) {
        throw new Error(`Failed to fetch features: ${error.message}`);
    }

    return data || [];
}

/**
 * Update feature config
 */
export async function updateFeature(
    featureId: string,
    updates: { isEnabled?: boolean; isVisible?: boolean; minTier?: string }
) {
    const supabase = await createClient();

    const dbUpdates: Record<string, unknown> = {};
    if (updates.isEnabled !== undefined) dbUpdates.is_enabled = updates.isEnabled;
    if (updates.isVisible !== undefined) dbUpdates.is_visible = updates.isVisible;
    if (updates.minTier !== undefined) dbUpdates.min_tier = updates.minTier;

    const { data, error } = await (supabase.from('feature_config') as any)
        .update(dbUpdates)
        .eq('id', featureId)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to update feature: ${error.message}`);
    }

    return data;
}

/**
 * Get leads with pagination
 */
export async function getLeads(options: {
    page?: number;
    limit?: number;
    status?: string;
}) {
    const { page = 1, limit = 20, status } = options;
    const offset = (page - 1) * limit;

    const supabase = await createClient();

    let query = supabase
        .from('leads')
        .select('*', { count: 'exact' });

    if (status) {
        query = query.eq('status', status);
    }

    const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        throw new Error(`Failed to fetch leads: ${error.message}`);
    }

    return {
        leads: data || [],
        total: count || 0,
    };
}

/**
 * Update lead status
 */
export async function updateLead(
    leadId: string,
    updates: { status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'; notes?: string }
) {
    const supabase = await createClient();

    const dbUpdates: Record<string, string | undefined> = {
        status: updates.status,
        notes: updates.notes
    };

    const { data, error } = await (supabase.from('leads') as any)
        .update(dbUpdates)
        .eq('id', leadId)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to update lead: ${error.message}`);
    }

    return data;
}

// Helper to map DB user to User type
function mapDbUserToUser(dbUser: Record<string, unknown>): User {
    return {
        id: dbUser.id as string,
        email: dbUser.email as string,
        name: dbUser.name as string | null,
        avatarUrl: dbUser.avatar_url as string | null,
        role: dbUser.role as 'user' | 'admin' | 'super_admin',
        subscriptionTier: dbUser.subscription_tier as 'trial' | 'basic' | 'premium',
        subscriptionEndsAt: dbUser.subscription_ends_at
            ? new Date(dbUser.subscription_ends_at as string)
            : null,
        preferences: (dbUser.preferences as Record<string, unknown>) || {},
    };
}
