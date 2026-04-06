/**
 * MCQ Mock Test View Component
 * 
 * Master Prompt v8.0 - Feature F7 (READ Mode)
 * - Full mock test interface
 * - Question palette (1-100)
 * - Section tabs (GS1, GS2, GS3, GS4, CSAT)
 * - Navigation panel
 * - Timer display
 * - Submit confirmation
 * - Bilingual support
 */

'use client';

import React, { useState } from 'react';
import { Clock, CheckCircle, XCircle, HelpCircle, Flag, AlertTriangle } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface QuestionStatus {
  id: string;
  number: number;
  status: 'unanswered' | 'answered' | 'marked-for-review' | 'not-visited';
  section: string;
}

interface MockTestViewProps {
  questions: QuestionStatus[];
  currentQuestion: number;
  timeRemaining: number;
  showHindi: boolean;
  onQuestionSelect: (questionNumber: number) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SECTIONS = ['GS1', 'GS2', 'GS3', 'GS4', 'CSAT'];

const STATUS_COLORS = {
  unanswered: 'bg-white border-gray-300 text-gray-700',
  answered: 'bg-green-500 border-green-600 text-white',
  'marked-for-review': 'bg-yellow-500 border-yellow-600 text-white',
  'not-visited': 'bg-gray-100 border-gray-200 text-gray-400',
};

// ============================================================================
// COMPONENT
// ============================================================================

export function MockTestView({
  questions,
  currentQuestion,
  timeRemaining,
  showHindi,
  onQuestionSelect,
  onSubmit,
  isSubmitting = false,
}: MockTestViewProps) {
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('all');

  // Calculate stats
  const answered = questions.filter((q) => q.status === 'answered').length;
  const marked = questions.filter((q) => q.status === 'marked-for-review').length;
  const unvisited = questions.filter((q) => q.status === 'not-visited').length;
  const unanswered = questions.filter((q) => q.status === 'unanswered').length;

  // Format time
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Filter questions by section
  const filteredQuestions =
    activeSection === 'all'
      ? questions
      : questions.filter((q) => q.section === activeSection);

  // Get time warning color
  const getTimeColor = () => {
    const percentage = (timeRemaining / 7200) * 100; // 2 hours = 7200 seconds
    if (percentage <= 25) return 'text-red-600 bg-red-50 border-red-300';
    if (percentage <= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-300';
    return 'text-green-600 bg-green-50 border-green-300';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar - Timer & Submit */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Timer */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${getTimeColor()}`}>
              <Clock className="w-5 h-5" />
              <span className="text-2xl font-bold font-mono">{formatTime(timeRemaining)}</span>
              {timeRemaining <= 900 && (
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              )}
            </div>

            {/* Stats */}
            <div className="hidden md:flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span>{showHindi ? 'उत्तर दिए' : 'Answered'}: {answered}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded" />
                <span>{showHindi ? 'रिव्यू' : 'Review'}: {marked}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded" />
                <span>{showHindi ? 'देखे नहीं' : 'Not Visited'}: {unvisited}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-white border-2 border-gray-300 rounded" />
                <span>{showHindi ? 'बिना उत्तर' : 'Unanswered'}: {unanswered}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={() => setShowSubmitConfirm(true)}
              disabled={isSubmitting}
              className="px-6 py-2 bg-saffron-600 text-white rounded-lg hover:bg-saffron-700 disabled:opacity-50 font-medium transition-colors"
            >
              {showHindi ? 'टेस्ट सबमिट करें' : 'Submit Test'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Content - Question */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-gray-200 p-6 min-h-[400px]">
              {/* Section Tabs */}
              <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200 pb-3">
                <button
                  onClick={() => setActiveSection('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === 'all'
                      ? 'bg-saffron-100 text-saffron-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {showHindi ? 'सभी' : 'All'} ({questions.length})
                </button>
                {SECTIONS.map((section) => {
                  const count = questions.filter((q) => q.section === section).length;
                  return (
                    <button
                      key={section}
                      onClick={() => setActiveSection(section)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        activeSection === section
                          ? 'bg-saffron-100 text-saffron-800'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {section} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Question Placeholder */}
              <div className="flex items-center justify-center h-64 text-gray-400">
                <div className="text-center">
                  <HelpCircle className="w-12 h-12 mx-auto mb-2" />
                  <p>{showHindi ? 'प्रश्न यहाँ दिखाई देगा' : 'Question will be displayed here'}</p>
                  <p className="text-sm mt-1">
                    {showHindi ? `वर्तमान प्रश्न: ${currentQuestion}` : `Current Question: ${currentQuestion}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Question Palette */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-20">
              <h3 className="font-bold text-gray-900 mb-3">
                {showHindi ? 'प्रश्न पालेट' : 'Question Palette'}
              </h3>

              {/* Legend */}
              <div className="mb-3 space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded" />
                  <span>{showHindi ? 'उत्तर दिया' : 'Answered'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded" />
                  <span>{showHindi ? 'रिव्यू के लिए चिह्नित' : 'Marked for Review'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded" />
                  <span>{showHindi ? 'देखे नहीं' : 'Not Visited'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded" />
                  <span>{showHindi ? 'बिना उत्तर' : 'Unanswered'}</span>
                </div>
              </div>

              {/* Question Grid */}
              <div className="grid grid-cols-5 gap-2 max-h-[500px] overflow-y-auto">
                {filteredQuestions.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => onQuestionSelect(q.number)}
                    className={`w-10 h-10 rounded-lg border-2 text-sm font-bold transition-all ${
                      q.number === currentQuestion
                        ? 'ring-2 ring-saffron-500 ring-offset-2'
                        : ''
                    } ${STATUS_COLORS[q.status]}`}
                  >
                    {q.number}
                  </button>
                ))}
              </div>

              {/* Navigation */}
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => onQuestionSelect(Math.max(1, currentQuestion - 1))}
                  disabled={currentQuestion === 1}
                  className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm font-medium"
                >
                  ← {showHindi ? 'पिछला' : 'Previous'}
                </button>
                <button
                  onClick={() => onQuestionSelect(Math.min(questions.length, currentQuestion + 1))}
                  disabled={currentQuestion === questions.length}
                  className="w-full px-3 py-2 bg-saffron-600 text-white rounded-lg hover:bg-saffron-700 disabled:opacity-50 text-sm font-medium"
                >
                  {showHindi ? 'अगला' : 'Next'} →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4">
            <div className="text-center mb-4">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {showHindi ? 'टेस्ट सबमिट करें?' : 'Submit Test?'}
              </h3>
              <p className="text-gray-600">
                {showHindi
                  ? `आपने ${answered} प्रश्नों के उत्तर दिए हैं। ${unanswered} प्रश्न अनुत्तरित हैं।`
                  : `You have answered ${answered} questions. ${unanswered} questions are unanswered.`}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                {showHindi ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  onSubmit();
                  setShowSubmitConfirm(false);
                }}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-saffron-600 text-white rounded-lg hover:bg-saffron-700 disabled:opacity-50 font-medium"
              >
                {showHindi ? 'हाँ, सबमिट करें' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
