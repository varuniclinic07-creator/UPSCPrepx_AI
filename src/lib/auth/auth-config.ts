import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { User } from '@/types';

// ═══════════════════════════════════════════════════════════════════════════
// AUTH CONFIGURATION - Server-side authentication with Robust Error Handling
// Following backend-architect.md: "Explicit Error Handling - Log meaningful information"
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get current authenticated user
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    // Create Supabase client (this will throw if config is missing)
    const supabase = await createServerSupabaseClient();

    // Get auth user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.warn('[Auth] Auth error:', authError.message);
      return null;
    }

    if (!authUser) {
      return null;
    }

    // Get user profile from database
    // Get user profile from database
    const { data: profile, error: profileError } = await (supabase
      .from('users') as any)
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError) {
      // Profile might not exist yet (new user) or table doesn't exist
      console.warn('[Auth] Profile fetch error:', profileError.message);

      // Check if it's a "relation does not exist" error (table missing)
      if (profileError.message.includes('relation') || profileError.code === 'PGRST116') {
        console.error('[Auth] Users table may not exist in database');
      }

      // Return minimal user from auth data
      return {
        id: authUser.id,
        email: authUser.email!,
        name: authUser.user_metadata?.name || null,
        avatarUrl: null,
        role: 'user',
        subscriptionTier: 'trial',
        subscriptionEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        preferences: {},
      };
    }

    if (!profile) {
      // Profile doesn't exist yet (new user)
      console.warn('[Auth] User profile not found, returning minimal user');
      return {
        id: authUser.id,
        email: authUser.email!,
        name: authUser.user_metadata?.name || null,
        avatarUrl: null,
        role: 'user',
        subscriptionTier: 'trial',
        subscriptionEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        preferences: {},
      };
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatar_url,
      role: profile.role as User['role'],
      subscriptionTier: profile.subscription_tier as User['subscriptionTier'],
      subscriptionEndsAt: profile.subscription_ends_at
        ? new Date(profile.subscription_ends_at)
        : null,
      preferences: (profile.preferences as Record<string, unknown>) || {},
    };
  } catch (error) {
    console.error('[Auth] Error getting current user:', error);
    return null;
  }
}

/**
 * Require authenticated user
 * Throws error if not authenticated
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

/**
 * Require admin user
 * Throws error if not admin
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    throw new Error('Admin access required');
  }
  return user;
}

/**
 * Check if user's subscription is active
 */
export function isSubscriptionActive(user: User): boolean {
  if (!user.subscriptionEndsAt) return false;
  return new Date(user.subscriptionEndsAt) > new Date();
}

/**
 * Check if user can access a feature based on subscription tier
 */
export function canAccessFeature(
  user: User,
  requiredTier: 'trial' | 'basic' | 'premium'
): boolean {
  const tierOrder = { trial: 0, basic: 1, premium: 2 };

  // Check if subscription is active first
  if (!isSubscriptionActive(user)) {
    return false;
  }

  return tierOrder[user.subscriptionTier] >= tierOrder[requiredTier];
}

/**
 * Get subscription days remaining
 */
export function getSubscriptionDaysRemaining(user: User): number {
  if (!user.subscriptionEndsAt) return 0;
  const diff = new Date(user.subscriptionEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Require session - throws if not authenticated
 * Alias for requireUser that returns a session-like object
 */
export async function requireSession() {
  const user = await requireUser();
  return {
    user,
    userId: user.id,
  };
}