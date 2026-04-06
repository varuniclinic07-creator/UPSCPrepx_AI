/**
 * Doubt Thread View Page
 * 
 * Master Prompt v8.0 - Feature F5 (READ Mode)
 * - Single thread view with full conversation
 * - ThreadView component integration
 * - Loading and error states
 * - Navigation back to main page
 * - Bilingual support (EN+HI)
 * - Saffron theme design
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ThreadView } from '@/components/doubt/thread-view';
import { ArrowLeft, Loader2, AlertCircle, MessageSquare } from 'lucide-react';

// ============================================================================
// INTERFACES
// ============================================================================

interface ThreadData {
  id: string;
  title: { en: string; hi?: string };
  subject: 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'Essay' | 'Optional' | 'CSAT' | 'General';
  topic?: string;
  createdAt: string;
  updatedAt: string;
  status: 'open' | 'resolved' | 'archived';
  question: {
    id: string;
    text: string;
    textHi?: string;
    attachments?: Array<{ type: 'image' | 'audio'; url: string }>;
    createdAt: string;
  };
  answers: Array<{
    id: string;
    text: string;
    textHi?: string;
    sources?: Array<{ title: string; url?: string; type: string; relevanceScore: number }>;
    followUpQuestions?: string[];
    keyPoints?: string[];
    wordCount?: number;
    createdAt: string;
    isFollowUp: boolean;
    followUpQuestion?: string;
  }>;
  rating?: {
    rating?: number;
    isHelpful?: boolean;
    isFlagged?: boolean;
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DoubtThreadPage() {
  const params = useParams();
  const router = useRouter();
  const threadId = params.id as string;

  // State
  const [thread, setThread] = useState<ThreadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHindi, setShowHindi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch thread
  const fetchThread = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/doubt/thread/${threadId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch thread');
      }

      setThread(data.data);
    } catch (err) {
      console.error('Failed to fetch thread:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  // Initial fetch
  useEffect(() => {
    fetchThread();
  }, [fetchThread]);

  // Handle rate
  const handleRate = async (answerId: string, rating: any) => {
    try {
      const response = await fetch('/api/doubt/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answerId, ...rating }),
      });

      const result = await response.json();

      if (!result.success) {
        console.error('Failed to rate:', result.error);
      } else {
        // Update local state
        setThread(prev => {
          if (!prev) return null;
          return {
            ...prev,
            rating: {
              ...prev.rating,
              ...rating,
            },
          };
        });
      }
    } catch (err) {
      console.error('Failed to rate:', err);
    }
  };

  // Handle follow-up
  const handleFollowUp = async (threadId: string, question: string) => {
    try {
      setIsSubmitting(true);

      const response = await fetch('/api/doubt/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, question }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit follow-up');
      }

      // Refresh thread
      await fetchThread();
    } catch (err) {
      console.error('Failed to submit follow-up:', err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-saffron-600" />
          <p className="text-gray-600">
            {showHindi ? 'लोड हो रहा है...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !thread) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full p-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              {showHindi ? 'त्रुटि' : 'Error'}
            </h2>
            <p className="text-red-600 text-sm mb-4">{error || 'Thread not found'}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => router.push('/doubt-solver')}
                className="px-4 py-2 bg-saffron-600 text-white rounded-lg hover:bg-saffron-700 transition-colors"
              >
                {showHindi ? 'वापस जाएं' : 'Go Back'}
              </button>
              <button
                onClick={fetchThread}
                className="px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
              >
                {showHindi ? 'पुनः प्रयास करें' : 'Retry'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/doubt-solver')}
              className="flex items-center gap-2 text-gray-600 hover:text-saffron-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">
                {showHindi ? 'वापस' : 'Back'}
              </span>
            </button>

            <button
              onClick={() => setShowHindi(!showHindi)}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {showHindi ? 'English' : 'हिंदी'}
            </button>
          </div>
        </div>
      </header>

      {/* Thread Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ThreadView
          thread={thread}
          onRate={handleRate}
          onFollowUp={handleFollowUp}
          showHindi={showHindi}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>
                {showHindi
                  ? `${thread.answers.length} उत्तर`
                  : `${thread.answers.length} answer${thread.answers.length !== 1 ? 's' : ''}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>
                {thread.status === 'resolved'
                  ? showHindi ? '✓ हल किया गया' : '✓ Resolved'
                  : thread.status === 'archived'
                  ? showHindi ? 'आर्काइव्ड' : 'Archived'
                  : showHindi ? 'खुला' : 'Open'
                }
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
