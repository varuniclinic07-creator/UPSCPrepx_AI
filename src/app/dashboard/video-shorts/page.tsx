'use client';

/**
 * BMAD Phase 4: Feature 6 - Video Shorts Library Page
 * Main page for browsing 60-second UPSC explainer videos
 */

import React from 'react';
import { ShortsLibrary } from '@/components/video/shorts-library';
import { useUser } from '@/hooks/use-user';

export default function VideoShortsPage() {
  const { user, loading: isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ShortsLibrary
        userId={user?.id}
        isPremium={
          user?.subscriptionTier === 'premium' ||
          (user?.subscriptionTier as string) === 'premium_plus'
        }
      />
    </div>
  );
}
