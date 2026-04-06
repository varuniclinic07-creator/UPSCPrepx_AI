// ═══════════════════════════════════════════════════════════════
// AUTH GUARDS (HOCs)
// Protect routes by authentication and subscription status
// ═══════════════════════════════════════════════════════════════

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, ComponentType } from 'react';

export interface WithAuthOptions {
    requireAuth?: boolean;
    requireSubscription?: boolean;
    requiredTier?: 'trial' | 'basic' | 'premium' | 'premium_plus';
    requireAdmin?: boolean;
}

/**
 * Higher-Order Component for authentication
 */
export function withAuth<P extends object>(
    Component: ComponentType<P>,
    options: WithAuthOptions = {}
) {
    return function AuthGuardedComponent(props: P) {
        const { data: session, status } = useSession();
        const router = useRouter();

        const {
            requireAuth = true,
            requireSubscription = false,
            requiredTier,
            requireAdmin = false
        } = options;

        useEffect(() => {
            if (status === 'loading') return;

            // Check authentication
            if (requireAuth && !session) {
                router.push('/auth/signin');
                return;
            }

            // Check admin role
            const userRole = (session?.user as any)?.role;
            if (requireAdmin && userRole !== 'admin' && userRole !== 'super_admin') {
                router.push('/unauthorized');
                return;
            }

            // Check subscription
            if (requireSubscription || requiredTier) {
                const userTier = (session?.user as any)?.subscriptionTier || 'trial';

                const tierHierarchy = ['trial', 'basic', 'premium', 'premium_plus'];
                const userTierIndex = tierHierarchy.indexOf(userTier);
                const requiredTierIndex = tierHierarchy.indexOf(requiredTier || 'basic');

                if (userTierIndex < requiredTierIndex) {
                    router.push('/upgrade');
                    return;
                }
            }
        }, [session, status, router]);

        // Show loading state
        if (status === 'loading') {
            return <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>;
        }

        // Don't render if not authenticated
        if (requireAuth && !session) {
            return null;
        }

        return <Component {...props} />;
    };
}

/**
 * Hook to check if user can access a feature
 */
export function useFeatureAccess(featureName: string) {
    const { data: session } = useSession();

    const checkAccess = async () => {
        if (!session?.user) return false;

        try {
            const response = await fetch(`/api/features/check?feature=${featureName}`);
            const data = await response.json();
            return data.allowed;
        } catch (error) {
            console.error('Feature access check error:', error);
            return false;
        }
    };

    return { checkAccess };
}

/**
 * Hook to get user's subscription info
 */
export function useSubscription() {
    const { data: session } = useSession();

    const tier = (session?.user as any)?.subscriptionTier || 'trial';
    const isActive = session?.user ? true : false;

    const canAccessFeature = (requiredTier: string) => {
        const tierHierarchy = ['trial', 'basic', 'premium', 'premium_plus'];
        const userTierIndex = tierHierarchy.indexOf(tier);
        const requiredTierIndex = tierHierarchy.indexOf(requiredTier);

        return userTierIndex >= requiredTierIndex;
    };

    return {
        tier,
        isActive,
        canAccessFeature,
        isPremium: tier === 'premium' || tier === 'premium_plus',
        isTrial: tier === 'trial'
    };
}
