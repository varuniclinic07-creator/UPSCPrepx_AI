/**
 * Doubt Solver - Main Page
 * 
 * Master Prompt v8.0 - Feature F5 (READ Mode)
 * - AI doubt solver with multi-modal input
 * - Recent doubts list
 * - Subject filtering
 * - Search functionality
 * - Bilingual support (EN+HI)
 * - Saffron theme design
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DoubtInput } from '@/components/doubt/doubt-input';
import { MessageSquare, Search, Filter, Clock, BookOpen, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';

// ============================================================================
// INTERFACES
// ============================================================================

interface DoubtThread {
  id: string;
  title: { en: string; hi?: string };
  subject: 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'Essay' | 'Optional' | 'CSAT' | 'General';
  topic?: string;
  createdAt: string;
  status: 'open' | 'resolved' | 'archived';
  answerCount: number;
  rating?: { rating?: number; isHelpful?: boolean };
}

interface FilterState {
  subject: string | null;
  status: string | null;
  search: string;
  dateFrom: string;
  dateTo: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SUBJECTS = [
  { value: 'all', label: 'All Subjects', icon: '📚' },
  { value: 'GS1', label: 'GS1', icon: '📚' },
  { value: 'GS2', label: 'GS2', icon: '⚖️' },
  { value: 'GS3', label: 'GS3', icon: '💰' },
  { value: 'GS4', label: 'GS4', icon: '🧭' },
  { value: 'Essay', label: 'Essay', icon: '✍️' },
  { value: 'Optional', label: 'Optional', icon: '🎯' },
  { value: 'CSAT', label: 'CSAT', icon: '📊' },
  { value: 'General', label: 'General', icon: '💡' },
];

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'archived', label: 'Archived' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DoubtSolverPage() {
  // State
  const [showHindi, setShowHindi] = useState(false);
  const [threads, setThreads] = useState<DoubtThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    subject: 'all',
    status: 'all',
    search: '',
    dateFrom: '',
    dateTo: '',
  });
  const [view, setView] = useState<'ask' | 'history'>('ask');

  // Fetch doubts
  const fetchDoubts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.subject && filters.subject !== 'all') {
        params.set('subject', filters.subject);
      }
      if (filters.status && filters.status !== 'all') {
        params.set('status', filters.status);
      }
      if (filters.search) {
        params.set('search', filters.search);
      }
      if (filters.dateFrom) {
        params.set('from', filters.dateFrom);
      }
      if (filters.dateTo) {
        params.set('to', filters.dateTo);
      }

      const response = await fetch(`/api/doubt/history?${params}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch doubts');
      }

      setThreads(data.data.threads || []);
    } catch (err) {
      console.error('Failed to fetch doubts:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Initial fetch
  useEffect(() => {
    fetchDoubts();
  }, [fetchDoubts]);

  // Handle submit doubt
  const handleSubmitDoubt = async (data: any) => {
    try {
      setIsSubmitting(true);

      const response = await fetch('/api/doubt/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit doubt');
      }

      // Refresh list
      await fetchDoubts();

      // Show success message
      alert(
        showHindi
          ? 'आपका संदेह जमा हो गया है! AI उत्तर तैयार किया जा रहा है.'
          : 'Your doubt has been submitted! AI is preparing the answer.'
      );
    } catch (err) {
      console.error('Failed to submit doubt:', err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle rate doubt
  const handleRateDoubt = async (answerId: string, rating: any) => {
    try {
      const response = await fetch('/api/doubt/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answerId, ...rating }),
      });

      const result = await response.json();

      if (!result.success) {
        console.error('Failed to rate:', result.error);
      }
    } catch (err) {
      console.error('Failed to rate:', err);
    }
  };

  // Handle follow-up
  const handleFollowUp = async (threadId: string, question: string) => {
    try {
      const response = await fetch('/api/doubt/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, question }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit follow-up');
      }

      // Refresh list
      await fetchDoubts();
    } catch (err) {
      console.error('Failed to submit follow-up:', err);
      throw err;
    }
  };

  // Filter threads
  const filteredThreads = threads.filter(thread => {
    // Subject filter
    if (filters.subject && filters.subject !== 'all' && thread.subject !== filters.subject) {
      return false;
    }

    // Status filter
    if (filters.status && filters.status !== 'all' && thread.status !== filters.status) {
      return false;
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const titleMatch = (showHindi && thread.title.hi ? thread.title.hi : thread.title.en)
        .toLowerCase()
        .includes(searchTerm);
      const topicMatch = thread.topic?.toLowerCase().includes(searchTerm);

      if (!titleMatch && !topicMatch) {
        return false;
      }
    }

    return true;
  });

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-700';
      case 'archived':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'resolved':
        return showHindi ? 'हल किया गया' : 'Resolved';
      case 'archived':
        return showHindi ? 'आर्काइव्ड' : 'Archived';
      default:
        return showHindi ? 'खुला' : 'Open';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Get subject icon
  const getSubjectIcon = (subject: string) => {
    const icons: Record<string, string> = {
      GS1: '📚',
      GS2: '⚖️',
      GS3: '💰',
      GS4: '🧭',
      Essay: '✍️',
      Optional: '🎯',
      CSAT: '📊',
      General: '💡',
    };
    return icons[subject] || '📖';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-saffron-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-saffron-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {showHindi ? 'AI संदेह समाधान' : 'AI Doubt Solver'}
                </h1>
                <p className="text-sm text-gray-600">
                  {showHindi
                    ? 'टेक्स्ट, छवि या आवाज़ के साथ पूछें'
                    : 'Ask with text, image, or voice'}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* View Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setView('ask')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'ask'
                ? 'bg-saffron-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border'
            }`}
          >
            {showHindi ? 'नया प्रश्न पूछें' : 'Ask New Question'}
          </button>
          <button
            onClick={() => setView('history')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'history'
                ? 'bg-saffron-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border'
            }`}
          >
            {showHindi ? 'मेरे संदेह' : 'My Doubts'}
            {threads.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {threads.length}
              </span>
            )}
          </button>
        </div>

        {/* Ask View */}
        {view === 'ask' && (
          <div className="max-w-3xl mx-auto">
            <DoubtInput
              onSubmit={handleSubmitDoubt}
              isLoading={isSubmitting}
              showHindi={showHindi}
            />

            {/* Features */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">
                    {showHindi ? 'तुरंत उत्तर' : 'Instant Answers'}
                  </h3>
                </div>
                <p className="text-sm text-gray-600">
                  {showHindi
                    ? 'AI <60 सेकंड में उत्तर देता है'
                    : 'AI provides answers in <60 seconds'}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <BookOpen className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">
                    {showHindi ? 'RAG-आधारित' : 'RAG-Grounded'}
                  </h3>
                </div>
                <p className="text-sm text-gray-600">
                  {showHindi
                    ? 'सटीक उत्तर के लिए सामग्री लाइब्रेरेरी से खोजें'
                    : 'Searches content library for accurate answers'}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">
                    {showHindi ? 'अनुवर्ती प्रश्न' : 'Follow-ups'}
                  </h3>
                </div>
                <p className="text-sm text-gray-600">
                  {showHindi
                    ? 'स्पष्टीकरण के लिए अधिक प्रश्न पूछें'
                    : 'Ask more questions for clarification'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* History View */}
        {view === 'history' && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      placeholder={showHindi ? 'खोजें...' : 'Search...'}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saffron-500 focus:border-saffron-500 text-sm"
                    />
                  </div>
                </div>

                {/* Subject Filter */}
                <div>
                  <select
                    value={filters.subject || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value || null }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saffron-500 focus:border-saffron-500 text-sm"
                  >
                    {SUBJECTS.map(s => (
                      <option key={s.value} value={s.value}>
                        {s.icon} {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    value={filters.status || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value || null }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saffron-500 focus:border-saffron-500 text-sm"
                  >
                    {STATUS_FILTERS.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-saffron-600" />
                <p className="text-gray-600">
                  {showHindi ? 'लोड हो रहा है...' : 'Loading...'}
                </p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
                <p className="text-red-800 font-medium mb-2">
                  {showHindi ? 'त्रुटि' : 'Error'}
                </p>
                <p className="text-red-600 text-sm mb-4">{error}</p>
                <button
                  onClick={fetchDoubts}
                  className="px-4 py-2 bg-saffron-600 text-white rounded-lg hover:bg-saffron-700 transition-colors"
                >
                  {showHindi ? 'पुनः प्रयास करें' : 'Retry'}
                </button>
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {showHindi ? 'कोई संदेह नहीं मिला' : 'No doubts found'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {showHindi
                    ? 'पहला प्रश्न पूछें या फ़िल्टर बदलें'
                    : 'Ask your first question or adjust filters'}
                </p>
                <button
                  onClick={() => setView('ask')}
                  className="px-4 py-2 bg-saffron-600 text-white rounded-lg hover:bg-saffron-700 transition-colors"
                >
                  {showHindi ? 'नया प्रश्न पूछें' : 'Ask New Question'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredThreads.map(thread => (
                  <a
                    key={thread.id}
                    href={`/doubt-solver/${thread.id}`}
                    className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-saffron-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-saffron-100 rounded-lg">
                        <span className="text-lg">{getSubjectIcon(thread.subject)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 truncate">
                            {showHindi && thread.title.hi ? thread.title.hi : thread.title.en}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(thread.status)}`}>
                            {getStatusText(thread.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span>{thread.subject}</span>
                          {thread.topic && (
                            <>
                              <span>•</span>
                              <span>{thread.topic}</span>
                            </>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(thread.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {thread.answerCount} {showHindi ? 'उत्तर' : 'answers'}
                          </span>
                        </div>
                      </div>
                      {thread.rating?.rating && (
                        <div className="flex items-center gap-1 text-amber-500">
                          <span className="text-sm font-medium">{thread.rating.rating}</span>
                          <span>★</span>
                        </div>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
