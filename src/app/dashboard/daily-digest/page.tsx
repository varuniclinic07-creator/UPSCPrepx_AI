/**
 * Daily Current Affairs - Main Page
 * 
 * Master Prompt v8.0 - Feature F2 (READ Mode)
 * - Displays today's digest with article grid
 * - Subject filtering (GS1, GS2, GS3, GS4, Essay)
 * - Bilingual support (EN+HI)
 * - Importance-based sorting
 * - MCQ integration
 * - Syllabus mapping display
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DailyDigestGrid } from '@/components/ca/daily-digest-card';
import { DigestFilter, FilterState } from '@/components/ca/digest-filter';
import { SubjectDistribution } from '@/components/ca/syllabus-tags';
import { BookOpen, Calendar, Filter, TrendingUp } from 'lucide-react';

// ============================================================================
// INTERFACES
// ============================================================================

interface Article {
  id: string;
  title: {
    en: string;
    hi: string;
  };
  summary: {
    en: string;
    hi: string;
  };
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

export default function DailyDigestPage() {
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

  // Fetch daily digest
  const fetchDigest = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const date = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/ca/daily?date=${date}`);
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
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchDigest();
  }, [fetchDigest]);

  // Filter articles based on current filters
  const filteredArticles = digest?.articles.filter(article => {
    // Subject filter
    if (filters.subject) {
      const hasSubject = article.syllabus.some(
        s => s.subject === filters.subject
      );
      if (!hasSubject) return false;
    }

    // Importance filter
    if (filters.importance && article.importance < filters.importance) {
      return false;
    }

    // Category filter
    if (filters.category && article.category !== filters.category) {
      return false;
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const titleMatch = (showHindi ? article.title.hi : article.title.en)
        .toLowerCase()
        .includes(searchTerm);
      const summaryMatch = (showHindi ? article.summary.hi : article.summary.en)
        .toLowerCase()
        .includes(searchTerm);
      const topicMatch = article.syllabus.some(s =>
        s.topic.toLowerCase().includes(searchTerm)
      );

      if (!titleMatch && !summaryMatch && !topicMatch) {
        return false;
      }
    }

    return true;
  }) || [];

  // Sort by importance (highest first)
  const sortedArticles = [...filteredArticles].sort(
    (a, b) => b.importance - a.importance
  );

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
                <BookOpen className="w-6 h-6 text-saffron-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {showHindi ? 'दैनिक करंट अफेयर्स' : 'Daily Current Affairs'}
                </h1>
                <p className="text-sm text-gray-600">
                  {digest?.date && new Date(digest.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHindi(!showHindi)}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {showHindi ? 'English' : 'हिंदी'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Summary Card */}
        {digest && digest.totalArticles > 0 && (
          <div className="bg-gradient-to-r from-saffron-500 to-orange-500 rounded-xl p-6 text-white">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold">{digest.totalArticles}</p>
                <p className="text-sm opacity-90">
                  {showHindi ? 'लेख' : 'Articles'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {digest.articles.filter(a => a.mcqCount > 0).length}
                </p>
                <p className="text-sm opacity-90">
                  {showHindi ? 'MCQ के साथ' : 'With MCQs'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {digest.articles.filter(a => a.importance >= 4).length}
                </p>
                <p className="text-sm opacity-90">
                  {showHindi ? 'महत्वपूर्ण' : 'Important'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {digest.articles.reduce((sum, a) => sum + a.readTimeMin, 0)}
                </p>
                <p className="text-sm opacity-90">
                  {showHindi ? 'मिनट' : 'Minutes'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Subject Distribution */}
        {digest && digest.totalArticles > 0 && (
          <SubjectDistribution
            distribution={digest.subjectDistribution}
            showHindi={showHindi}
          />
        )}

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
            <Filter className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {showHindi ? 'कोई लेख नहीं मिला' : 'No Articles Found'}
            </h3>
            <p className="text-gray-600 mb-4">
              {showHindi 
                ? 'फ़िल्टर बदलें या बाद में वापस आएं' 
                : 'Try adjusting filters or check back later'}
            </p>
            <button
              onClick={() => setFilters({
                subject: null,
                dateFrom: '',
                dateTo: '',
                importance: null,
                category: null,
                search: '',
              })}
              className="px-4 py-2 bg-saffron-600 text-white rounded-lg hover:bg-saffron-700 transition-colors"
            >
              {showHindi ? 'सभी फ़िल्टर साफ़ करें' : 'Clear All Filters'}
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>
                {showHindi 
                  ? 'नया डाइजेस्ट सुबह 5 बजे IST पर' 
                  : 'New digest at 5:00 AM IST'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>
                {showHindi ? 'स्रोत: PIB, PRS, The Hindu' : 'Sources: PIB, PRS, The Hindu'}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
