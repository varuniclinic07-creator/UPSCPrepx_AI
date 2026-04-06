'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types';

interface UserContextValue {
    user: User | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    isAdmin: boolean;
    isPremium: boolean;
    canAccess: (minTier: 'trial' | 'basic' | 'premium') => boolean;
    signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

/**
 * Hook to access current user and session
 */
export function useUser(): UserContextValue {
    const context = useContext(UserContext);

    // If not in provider, create standalone hook
    if (context === undefined) {
        return useUserStandalone();
    }

    return context;
}

/**
 * Standalone user hook (when not using provider)
 */
function useUserStandalone(): UserContextValue {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUser = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/user');

            if (!response.ok) {
                if (response.status === 401) {
                    setUser(null);
                    return;
                }
                throw new Error('Failed to fetch user');
            }

            const data = await response.json();
            setUser(data.user);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const signOut = useCallback(async () => {
        try {
            const supabase = createClient();
            await supabase.auth.signOut();
            setUser(null);
            window.location.href = '/login';
        } catch (err) {
            console.error('Sign out error:', err);
        }
    }, []);

    useEffect(() => {
        fetchUser();

        // Listen for auth changes
        const supabase = createClient();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event) => {
                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    fetchUser();
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [fetchUser]);

    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    const isPremium = user?.subscriptionTier === 'premium';

    const canAccess = useCallback((minTier: 'trial' | 'basic' | 'premium') => {
        if (!user) return false;

        const tierOrder: Record<string, number> = {
            trial: 0,
            basic: 1,
            premium: 2,
        };

        return tierOrder[user.subscriptionTier] >= tierOrder[minTier];
    }, [user]);

    return {
        user,
        loading,
        error,
        refetch: fetchUser,
        isAdmin,
        isPremium,
        canAccess,
        signOut,
    };
}

/**
 * Provider component for user context
 */
export function UserProvider({ children }: { children: React.ReactNode }) {
    const userValue = useUserStandalone();

    return (
        <UserContext.Provider value={userValue} >
            {children}
        </UserContext.Provider>
    );
}

/**
 * Hook to check if user has access to a feature
 */
export function useFeatureAccess(minTier: 'trial' | 'basic' | 'premium'): {
    hasAccess: boolean;
    loading: boolean;
} {
    const { loading, canAccess } = useUser();

    return {
        hasAccess: canAccess(minTier),
        loading,
    };
}

/**
 * Hook to get user's subscription info
 */
export function useSubscription() {
    const { user, loading } = useUser();

    const daysLeft = user?.subscriptionEndsAt
        ? Math.max(0, Math.ceil((new Date(user.subscriptionEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : 0;

    const isExpired = user?.subscriptionEndsAt
        ? new Date(user.subscriptionEndsAt) < new Date()
        : false;

    return {
        tier: user?.subscriptionTier || 'trial',
        expiresAt: user?.subscriptionEndsAt,
        daysLeft,
        isExpired,
        loading,
    };
}
