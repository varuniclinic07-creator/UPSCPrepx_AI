/**
 * MCQ Practice Dashboard Component
 * 
 * Master Prompt v8.0 - Feature F7 (READ Mode)
 * - Session summary display
 * - Score, accuracy, time statistics
 * - XP earned display
 * - Subject-wise breakdown
 * - Improvement suggestions
 * - Bilingual support
 */

'use client';

import React from 'react';
import { Trophy, Target, Clock, TrendingUp, Award, BookOpen } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface SessionStats {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unattempted: number;
  accuracy: number;
  timeSpentSec: number;
  averageTimePerQuestion: number;
  xpEarned: number;
  score: number;
  maxScore: number;
  percentile?: number;
}

interface SubjectBreakdown {
  subject: string;
  total: number;
  correct: number;
  accuracy: number;
}

interface PracticeDashboardProps {
  stats: SessionStats;
  subjectBreakdown?: SubjectBreakdown[];
  showHindi: boolean;
  onRetry?: () => void;
  onContinue?: () => void;
  onReview?: () => void;
  isMockTest?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ACCURACY_COLORS = {
  excellent: 'text-green-600 bg-green-50 border-green-200',
  good: 'text-blue-600 bg-blue-50 border-blue-200',
  average: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  poor: 'text-red-600 bg-red-50 border-red-200',
};

const getAccuracyLevel = (accuracy: number) => {
  if (accuracy >= 80) return 'excellent';
  if (accuracy >= 60) return 'good';
  if (accuracy >= 40) return 'average';
  return 'poor';
};

// ============================================================================
// COMPONENT
// ============================================================================

export function PracticeDashboard({
  stats,
  subjectBreakdown,
  showHindi,
  onRetry,
  onContinue,
  onReview,
  isMockTest = false,
}: PracticeDashboardProps) {
  const accuracyLevel = getAccuracyLevel(stats.accuracy);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-saffron-500 to-orange-500 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-white" />
            <h2 className="text-white font-bold text-lg">
              {showHindi
                ? isMockTest
                  ? 'मॉक टेस्ट परिणाम'
                  : 'अभ्यास सारांश'
                : isMockTest
                ? 'Mock Test Results'
                : 'Practice Summary'}
            </h2>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6">
        {/* Main Score Card */}
        <div className="text-center p-6 bg-gradient-to-br from-saffron-50 to-orange-50 rounded-xl border border-saffron-200">
          <p className="text-sm text-gray-600 mb-2">
            {showHindi ? 'आपका स्कोर' : 'Your Score'}
          </p>
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className={`text-5xl md:text-6xl font-bold ${getScoreColor((stats.score / stats.maxScore) * 100)}`}>
              {stats.score}
            </span>
            <span className="text-2xl text-gray-400">/ {stats.maxScore}</span>
          </div>
          {stats.percentile && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm">
              <TrendingUp className="w-4 h-4 text-saffron-600" />
              <span className="text-sm font-medium text-gray-700">
                {showHindi ? `शीर्ष ${stats.percentile}%` : `Top ${stats.percentile}%`}
              </span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Accuracy */}
          <div className={`p-4 rounded-lg border-2 text-center ${ACCURACY_COLORS[accuracyLevel]}`}>
            <Target className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.accuracy}%</p>
            <p className="text-xs font-medium">
              {showHindi ? 'सटीकता' : 'Accuracy'}
            </p>
          </div>

          {/* Time Spent */}
          <div className="p-4 rounded-lg border-2 border-blue-200 text-blue-600 bg-blue-50 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{formatTime(stats.timeSpentSec)}</p>
            <p className="text-xs font-medium">
              {showHindi ? 'समय लिया' : 'Time Taken'}
            </p>
          </div>

          {/* XP Earned */}
          <div className="p-4 rounded-lg border-2 border-purple-200 text-purple-600 bg-purple-50 text-center">
            <Award className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">+{stats.xpEarned}</p>
            <p className="text-xs font-medium">XP {showHindi ? 'अर्जित' : 'Earned'}</p>
          </div>

          {/* Average Time */}
          <div className="p-4 rounded-lg border-2 border-indigo-200 text-indigo-600 bg-indigo-50 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.averageTimePerQuestion}s</p>
            <p className="text-xs font-medium">
              {showHindi ? 'औसत/प्रश्न' : 'Avg/Question'}
            </p>
          </div>
        </div>

        {/* Answer Breakdown */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600">{stats.correctAnswers}</p>
            <p className="text-xs text-green-700">
              {showHindi ? 'सही' : 'Correct'}
            </p>
          </div>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
            <p className="text-2xl font-bold text-red-600">{stats.incorrectAnswers}</p>
            <p className="text-xs text-red-700">
              {showHindi ? 'गलत' : 'Incorrect'}
            </p>
          </div>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
            <p className="text-2xl font-bold text-gray-600">{stats.unattempted}</p>
            <p className="text-xs text-gray-700">
              {showHindi ? 'अनुत्तरित' : 'Unattempted'}
            </p>
          </div>
        </div>

        {/* Subject Breakdown */}
        {subjectBreakdown && subjectBreakdown.length > 0 && (
          <div>
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              {showHindi ? 'विषयवार प्रदर्शन' : 'Subject-wise Performance'}
            </h3>
            <div className="space-y-2">
              {subjectBreakdown.map((subject, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="font-medium text-gray-900">{subject.subject}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      {subject.correct}/{subject.total}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        subject.accuracy >= 80
                          ? 'bg-green-100 text-green-800'
                          : subject.accuracy >= 60
                          ? 'bg-blue-100 text-blue-800'
                          : subject.accuracy >= 40
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {subject.accuracy}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 px-4 py-3 bg-saffron-600 text-white rounded-lg hover:bg-saffron-700 transition-colors font-medium"
            >
              {showHindi ? 'पुनः प्रयास करें' : 'Retry'}
            </button>
          )}
          {onReview && (
            <button
              onClick={onReview}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {showHindi ? 'विश्लेषण देखें' : 'View Analysis'}
            </button>
          )}
          {onContinue && (
            <button
              onClick={onContinue}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              {showHindi ? 'जारी रखें' : 'Continue'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
