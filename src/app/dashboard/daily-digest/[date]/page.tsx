/**
 * Daily Current Affairs - Archive Page
 * 
 * Master Prompt v8.0 - Feature F2 (READ Mode)
 * - Browse historical digests by date
 * - Calendar navigation
 * - Subject filtering
 * - Bilingual support (EN+HI)
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DailyDigestGrid } from '@/components/ca/daily-digest-card';
import { DigestFilter, FilterState } from '@/components/ca/digest-filter';
import { Calendar, ChevronLeft, ChevronRight, BookOpen, Archive } from 'lucide-react';

// ============================================================================
// INTERFACES
// ============================================================================

interface Article {
  id: string;
  title: { en: string; hi: string };
  summary: { en: string; hi: string };
  url: string;
  imageUrl?: string;
  category: string;
  importance: number;
  wordCount: number;
  readTimeMin: number;
  publishedAt: string;
  syllabus: Array<{
    subject: 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'Essay';
    topic: string;
    relevanceScore: number;
  }>;
  mcqCount: number;
}

interface DigestData {
  digestId: string;
  date: string;
  title: string;
  summary: string;
  articles: Article[];
  totalArticles: number;
  subjectDistribution: {
    GS1: number;
    GS2: number;
    GS3: number;
    GS4: number;
    Essay: number;
  };
  isPublished: boolean;
  publishedAt: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DailyDigestArchivePage() {
  const params = useParams();
  const router = useRouter();
  const dateParam = params.date as string;

  // State
  const [digest, setDigest] = useState<DigestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHindi, setShowHindi] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    subject: null,
    dateFrom: '',
    dateTo: '',
    importance: null,
    category: null,
    search: '',
  });

  // Parse date from URL
  const currentDate = dateParam || new Date().toISOString().split('T')[0];

  // Fetch digest for specific date
  const fetchDigest = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/ca/daily?date=${currentDate}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch digest');
      }

      setDigest(data.data);
    } catch (err) {
      console.error('Failed to fetch digest:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  // Initial fetch
  useEffect(() => {
    fetchDigest();
  }, [fetchDigest]);

  // Navigate to adjacent dates
  const navigateDate = (days: number) => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + days);
    const newDate = date.toISOString().split('T')[0];
    router.push(`/dashboard/daily-digest/${newDate}`);
  };

  // Filter articles
  const filteredArticles = digest?.articles.filter(article => {
    if (filters.subject) {
      const hasSubject = article.syllabus.some(s => s.subject === filters.subject);
      if (!hasSubject) return false;
    }
    if (filters.importance && article.importance < filters.importance) {
      return false;
    }
    if (filters.category && article.category !== filters.category) {
      return false;
    }
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const title = (showHindi ? article.title.hi : article.title.en).toLowerCase();
      const summary = (showHindi ? article.summary.hi : article.summary.en).toLowerCase();
      if (!title.includes(searchTerm) && !summary.includes(searchTerm)) {
        return false;
      }
    }
    return true;
  }) || [];

  const sortedArticles = [...filteredArticles].sort((a, b) => b.importance - a.importance);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron-600 mx-auto mb-4" />
          <p className="text-gray-600">
            {showHindi ? 'लोड हो रहा है...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 font-semibold mb-2">
              {showHindi ? 'त्रुटि' : 'Error'}
            </p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button
            onClick={fetchDigest}
            className="px-4 py-2 bg-saffron-600 text-white rounded-lg hover:bg-saffron-700 transition-colors"
          >
            {showHindi ? 'पुनः प्रयास करें' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-saffron-100 rounded-lg">
                <Archive className="w-6 h-6 text-saffron-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {showHindi ? 'आर्काइव' : 'Archive'}
                </h1>
                <p className="text-sm text-gray-600">
                  {formatDate(currentDate)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateDate(-1)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                title={showHindi ? 'पिछला दिन' : 'Previous Day'}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigateDate(1)}
                disabled={currentDate >= new Date().toISOString().split('T')[0]}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={showHindi ? 'अगला दिन' : 'Next Day'}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowHindi(!showHindi)}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {showHindi ? 'English' : 'हिंदी'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Date Navigation */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateDate(-7)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">
                {showHindi ? 'पिछले सप्ताह' : 'Last Week'}
              </span>
            </button>

            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <span className="font-medium">
                {formatDate(currentDate)}
              </span>
            </div>

            <button
              onClick={() => router.push('/dashboard/daily-digest')}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-saffron-600 text-white hover:bg-saffron-700 rounded-lg transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">
                {showHindi ? 'आज का डाइजेस्ट' : "Today's Digest"}
              </span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <DigestFilter
            filters={filters}
            onFilterChange={setFilters}
            showHindi={showHindi}
            onToggleLanguage={() => setShowHindi(!showHindi)}
          />
        </div>

        {/* Articles Grid */}
        {sortedArticles.length > 0 ? (
          <DailyDigestGrid
            articles={sortedArticles}
            showHindi={showHindi}
            onToggleLanguage={() => setShowHindi(!showHindi)}
          />
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Archive className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {showHindi ? 'कोई लेख नहीं मिला' : 'No Articles Found'}
            </h3>
            <p className="text-gray-600 mb-4">
              {showHindi 
                ? 'इस तारीख के लिए कोई डाइजेस्ट उपलब्ध नहीं है' 
                : 'No digest available for this date'}
            </p>
            <button
              onClick={() => router.push('/dashboard/daily-digest')}
              className="px-4 py-2 bg-saffron-600 text-white rounded-lg hover:bg-saffron-700 transition-colors"
            >
              {showHindi ? 'आज का डाइजेस्ट देखें' : "View Today's Digest"}
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-600">
            <p>
              {showHindi 
                ? 'आर्काइव में पुराने करंट अफेयर्स डाइजेस्ट ब्राउज़ करें' 
                : 'Browse historical current affairs digests in the archive'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
