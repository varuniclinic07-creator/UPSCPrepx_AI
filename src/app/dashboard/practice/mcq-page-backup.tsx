/**
 * MCQ Practice - Main Page
 * 
 * Master Prompt v8.0 - Feature F7 (READ Mode)
 * - Practice mode selection
 * - Subject-wise practice
 * - PYQs access
 * - Mock tests
 * - Performance overview
 * - Bilingual support
 */

'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Trophy, Clock, Target, TrendingUp, Play } from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface PracticeMode {
  id: string;
  title: { en: string; hi: string };
  description: { en: string; hi: string };
  icon: string;
  color: string;
  questions?: number;
  duration?: string;
}

interface SubjectStats {
  subject: string;
  totalQuestions: number;
  attempted: number;
  accuracy: number;
  lastPracticed?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PRACTICE_MODES: PracticeMode[] = [
  {
    id: 'subject-wise',
    title: { en: 'Subject-wise Practice', hi: 'विषयवार अभ्यास' },
    description: { en: 'Practice by GS subjects', hi: 'GS विषयों के अनुसार अभ्यास' },
    icon: 'BookOpen',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    id: 'pyqs',
    title: { en: 'Previous Year Questions', hi: 'पिछले वर्ष के प्रश्न' },
    description: { en: 'UPSC PYQs (2013-2025)', hi: 'UPSC PYQs (2013-2025)' },
    icon: 'Clock',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'adaptive',
    title: { en: 'Adaptive Practice', hi: 'अनुकूलित अभ्यास' },
    description: { en: 'AI-adjusted difficulty', hi: 'AI-समायोजित कठिनाई' },
    icon: 'Target',
    color: 'from-saffron-500 to-orange-500',
  },
  {
    id: 'mock-tests',
    title: { en: 'Full Mock Tests', hi: 'पूर्ण मॉक टेस्ट' },
    description: { en: 'UPSC exam pattern', hi: 'UPSC परीक्षा पैटर्न' },
    icon: 'Trophy',
    color: 'from-green-500 to-emerald-500',
  },
];

const SUBJECTS: SubjectStats[] = [
  { subject: 'GS1', totalQuestions: 2500, attempted: 0, accuracy: 0 },
  { subject: 'GS2', totalQuestions: 2800, attempted: 0, accuracy: 0 },
  { subject: 'GS3', totalQuestions: 3000, attempted: 0, accuracy: 0 },
  { subject: 'GS4', totalQuestions: 2200, attempted: 0, accuracy: 0 },
  { subject: 'CSAT', totalQuestions: 1500, attempted: 0, accuracy: 0 },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function MCQPracticePage() {
  const [showHindi, setShowHindi] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subjectStats, setSubjectStats] = useState<SubjectStats[]>(SUBJECTS);

  useEffect(() => {
    // Fetch user's practice stats
    fetchSubjectStats();
    setLoading(false);
  }, []);

  const fetchSubjectStats = async () => {
    try {
      const response = await fetch('/api/mcq/analytics');
      const data = await response.json();
      if (data.success && data.data.subjectBreakdown) {
        setSubjectStats(data.data.subjectBreakdown);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen':
        return <BookOpen className="w-8 h-8" />;
      case 'Clock':
        return <Clock className="w-8 h-8" />;
      case 'Target':
        return <Target className="w-8 h-8" />;
      case 'Trophy':
        return <Trophy className="w-8 h-8" />;
      default:
        return <BookOpen className="w-8 h-8" />;
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-saffron-100 rounded-lg">
                <Target className="w-6 h-6 text-saffron-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {showHindi ? 'MCQ अभ्यास' : 'MCQ Practice'}
                </h1>
                <p className="text-sm text-gray-600">
                  {showHindi ? '10,000+ प्रश्न उपलब्ध' : '10,000+ Questions Available'}
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
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <p className="text-2xl font-bold text-saffron-600">0</p>
            <p className="text-sm text-gray-600">
              {showHindi ? 'कुल अभ्यास' : 'Total Practice'}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <p className="text-2xl font-bold text-green-600">0%</p>
            <p className="text-sm text-gray-600">
              {showHindi ? 'सटीकता' : 'Accuracy'}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <p className="text-2xl font-bold text-blue-600">0</p>
            <p className="text-sm text-gray-600">
              {showHindi ? 'मॉक टेस्ट' : 'Mock Tests'}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <p className="text-2xl font-bold text-purple-600">0</p>
            <p className="text-sm text-gray-600">
              {showHindi ? 'XP अर्जित' : 'XP Earned'}
            </p>
          </div>
        </div>

        {/* Practice Modes */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {showHindi ? 'अभ्यास मोड चुनें' : 'Choose Practice Mode'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PRACTICE_MODES.map((mode) => (
              <Link
                key={mode.id}
                href={`/dashboard/practice/${mode.id}`}
                className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-saffron-300 transition-all"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${mode.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                  {getIcon(mode.icon)}
                </div>
                <h3 className="font-bold text-gray-900 mb-1">
                  {showHindi ? mode.title.hi : mode.title.en}
                </h3>
                <p className="text-sm text-gray-600">
                  {showHindi ? mode.description.hi : mode.description.en}
                </p>
                <div className="mt-4 flex items-center gap-2 text-saffron-600 text-sm font-medium">
                  <Play className="w-4 h-4" />
                  <span>{showHindi ? 'शुरू करें' : 'Start'}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Subject-wise Overview */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {showHindi ? 'विषयवार प्रगति' : 'Subject-wise Progress'}
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {showHindi ? 'विषय' : 'Subject'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {showHindi ? 'कुल प्रश्न' : 'Total Questions'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {showHindi ? 'अभ्यास किए' : 'Attempted'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {showHindi ? 'सटीकता' : 'Accuracy'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {showHindi ? 'कार्रवाई' : 'Action'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {subjectStats.map((subject) => (
                  <tr key={subject.subject} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {subject.subject}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {subject.totalQuestions}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {subject.attempted}
                    </td>
                    <td className="px-4 py-3">
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
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/practice/subject-wise/${subject.subject}`}
                        className="text-saffron-600 hover:text-saffron-700 text-sm font-medium"
                      >
                        {showHindi ? 'अभ्यास' : 'Practice'} →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {showHindi ? 'हाल की गतिविधि' : 'Recent Activity'}
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">
              {showHindi
                ? 'अभ्यास शुरू करें और अपनी प्रगति देखें'
                : 'Start practicing to see your activity'}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
