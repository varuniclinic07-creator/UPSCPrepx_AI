'use client';

/**
 * BMAD Phase 4: Feature 6 - Video Shorts Generator Page
 * Page for generating new 60-second UPSC explainer videos
 */

import React from 'react';
import { ShortsGenerator } from '@/components/video/shorts-generator';
import { useUser } from '@/hooks/use-user';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function VideoShortsGeneratePage() {
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
      {/* Back Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/dashboard/video-shorts"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Library
          </Link>
        </div>
      </div>

      {/* Generator Component */}
      <ShortsGenerator
        userId={user?.id}
        isPremium={
          user?.subscriptionTier === 'premium' ||
          (user?.subscriptionTier as string) === 'premium_plus'
        }
      />
    </div>
  );
}
