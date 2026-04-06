/**
 * Mains History List Component
 * 
 * Displays user's past answer evaluations with filtering and pagination.
 * Shows score trends, subject distribution, and progress over time.
 * 
 * Master Prompt v8.0 - Rule 3: SIMPLIFIED_LANGUAGE_PROMPT
 */

'use client';

import React, { useState, useEffect } from 'react';

interface Evaluation {
  id: string;
  question_text: string;
  subject: 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'Essay';
  topic: string;
  overall_percentage: number;
  grade: string;
  word_count: number;
  time_taken_sec: number;
  created_at: string;
  is_pyo: boolean;
  year?: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Stats {
  total_answers: number;
  average_score: number;
  best_score: number;
  subject_wise_avg: Record<string, number>;
}

interface MainsHistoryListProps {
  evaluations: Evaluation[];
  pagination: Pagination;
  stats: Stats;
  onPageChange?: (page: number) => void;
  onSubjectFilter?: (subject: string | null) => void;
  onViewEvaluation?: (id: string) => void;
}

export function MainsHistoryList({
  evaluations,
  pagination,
  stats,
  onPageChange,
  onSubjectFilter,
  onViewEvaluation,
}: MainsHistoryListProps) {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');

  const subjects = ['GS1', 'GS2', 'GS3', 'GS4', 'Essay'];

  // Grade color mapping
  const gradeColors = {
    'Excellent': 'bg-green-100 text-green-800 border-green-200',
    'Good': 'bg-blue-100 text-blue-800 border-blue-200',
    'Average': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Below Average': 'bg-orange-100 text-orange-800 border-orange-200',
    'Poor': 'bg-red-100 text-red-800 border-red-200',
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle subject filter
  const handleSubjectClick = (subject: string) => {
    const newSubject = selectedSubject === subject ? null : subject;
    setSelectedSubject(newSubject);
    onSubjectFilter?.(newSubject);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header Stats */}
      <div className="bg-gradient-to-r from-saffron-500 to-orange-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">📊 Your Mains Practice History</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-saffron-100 text-xs mb-1">Total Answers</p>
            <p className="text-3xl font-bold">{stats.total_answers}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-saffron-100 text-xs mb-1">Average Score</p>
            <p className="text-3xl font-bold">{stats.average_score.toFixed(1)}%</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-saffron-100 text-xs mb-1">Best Score</p>
            <p className="text-3xl font-bold">{stats.best_score}%</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-saffron-100 text-xs mb-1">This Month</p>
            <p className="text-3xl font-bold">
              {evaluations.filter(e => {
                const d = new Date(e.created_at);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              }).length}
            </p>
          </div>
        </div>
      </div>

      {/* Subject Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-2">Filter by Subject:</h3>
            <div className="flex flex-wrap gap-2">
              {subjects.map(subject => (
                <button
                  key={subject}
                  onClick={() => handleSubjectClick(subject)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedSubject === subject
                      ? 'bg-saffron-500 text-white shadow-lg shadow-saffron-500/50'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {subject}
                </button>
              ))}
              {selectedSubject && (
                <button
                  onClick={() => handleSubjectClick(selectedSubject)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100"
                >
                  ✕ Clear
                </button>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-2">Sort by:</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('date')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  sortBy === 'date'
                    ? 'bg-saffron-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📅 Date
              </button>
              <button
                onClick={() => setSortBy('score')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  sortBy === 'score'
                    ? 'bg-saffron-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📊 Score
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Subject-wise Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-3">📈 Subject-wise Average:</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {subjects.map(subject => {
            const avg = stats.subject_wise_avg[subject] || 0;
            return (
              <div key={subject} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-600 text-xs mb-1">{subject}</p>
                <p className={`text-xl font-bold ${
                  avg >= 70 ? 'text-green-600' :
                  avg >= 50 ? 'text-blue-600' :
                  avg >= 30 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {avg.toFixed(0)}%
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Evaluations List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-bold text-gray-900">
            {selectedSubject ? `${selectedSubject} ` : ''}Evaluations
            {selectedSubject && <span className="text-gray-500 font-normal">(filtered)</span>}
          </h3>
        </div>

        {evaluations.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No evaluations yet</h3>
            <p className="text-gray-600 mb-6">Start practicing to see your evaluation history here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {evaluations.map((eval_, idx) => (
              <div
                key={eval_.id}
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onViewEvaluation?.(eval_.id)}
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Subject + Question */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        eval_.subject === 'GS1' ? 'bg-blue-100 text-blue-800' :
                        eval_.subject === 'GS2' ? 'bg-green-100 text-green-800' :
                        eval_.subject === 'GS3' ? 'bg-purple-100 text-purple-800' :
                        eval_.subject === 'GS4' ? 'bg-orange-100 text-orange-800' :
                        'bg-pink-100 text-pink-800'
                      }`}>
                        {eval_.subject}
                      </span>
                      {eval_.is_pyo && eval_.year && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          PYQ {eval_.year}
                        </span>
                      )}
                      <span className="text-gray-500 text-xs">{formatDate(eval_.created_at)}</span>
                    </div>
                    <p className="text-gray-900 font-medium truncate">{eval_.question_text}</p>
                    <p className="text-gray-500 text-sm">{eval_.topic} • {eval_.word_count} words • {formatTime(eval_.time_taken_sec)}</p>
                  </div>

                  {/* Right: Score */}
                  <div className="flex-shrink-0 text-right">
                    <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border ${gradeColors[eval_.grade as keyof typeof gradeColors]}`}>
                      <span className="text-lg font-bold">{eval_.overall_percentage}%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{eval_.grade}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} evaluations
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => onPageChange?.(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => onPageChange?.(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Progress Tip */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-blue-900 text-sm text-center">
          <strong>💡 Tip:</strong> Practice at least 2 answers daily to see consistent improvement. Focus on your weaker subjects first.
        </p>
      </div>
    </div>
  );
}
