/**
 * Onboarding Page - F1 Smart Onboarding
 * 
 * Main entry point for the onboarding flow.
 * Protected route - requires authentication.
 * Mobile-responsive, bilingual (EN+HI).
 * 
 * Master Prompt v8.0 - Rule 3: SIMPLIFIED_LANGUAGE_PROMPT
 */

'use client';

import React, { useEffect, useState } from 'react';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function OnboardingPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // Redirect to login with return URL
          router.push(`/login?redirect=${encodeURIComponent('/onboarding')}`);
          return;
        }

        // Check if user already completed onboarding
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('onboarding_completed_at')
          .eq('id', session.user.id)
          .single();

        if (profile?.onboarding_completed_at) {
          // Already completed, redirect to dashboard
          router.push('/dashboard');
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, supabase]);

  // Loading State
  if (isLoading || isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🎯</div>
          <p className="text-gray-600 font-medium">Loading your onboarding...</p>
          <p className="text-gray-500 text-sm mt-2">आपका ऑनबोर्डिंग लोड हो रहा है...</p>
          <div className="mt-8 w-64 h-2 bg-gray-200 rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-gradient-to-r from-saffron-500 to-orange-600 animate-pulse w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  // Not Authenticated (should redirect, but show fallback)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to continue</p>
          <p className="text-gray-500 text-sm mb-6">कृपया जारी रखने के लिए लॉग इन करें</p>
          <button
            onClick={() => router.push('/login')}
            className="px-8 py-3 bg-saffron-500 text-white rounded-xl hover:bg-saffron-600 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Authenticated - Show Onboarding Wizard
  return <OnboardingWizard />;
}
