/**
 * MCQ Question Card Component
 * 
 * Master Prompt v8.0 - Feature F7 (READ Mode)
 * - Question display with bilingual support
 * - Subject/topic badges
 * - Timer display
 * - Navigation controls
 * - Mark for review
 * - Keyboard shortcuts
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Clock, Bookmark, Flag, ChevronLeft, ChevronRight } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface Question {
  id: string;
  questionNumber?: number;
  questionText: { en: string; hi: string };
  options: Array<{ text: { en: string; hi: string } }>;
  subject: string;
  topic?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeEstimateSec: number;
  marks: number;
  negativeMarks: number;
  isPyy?: boolean;
  year?: number;
}

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedOption?: number;
  timeRemaining?: number;
  showHindi: boolean;
  onOptionSelect: (optionNumber: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onMarkForReview: () => void;
  isMarkedForReview?: boolean;
  isLastQuestion: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DIFFICULTY_COLORS = {
  Easy: 'bg-green-100 text-green-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Hard: 'bg-red-100 text-red-800',
};

const SUBJECT_COLORS: Record<string, string> = {
  GS1: 'bg-blue-100 text-blue-800',
  GS2: 'bg-purple-100 text-purple-800',
  GS3: 'bg-indigo-100 text-indigo-800',
  GS4: 'bg-pink-100 text-pink-800',
  CSAT: 'bg-orange-100 text-orange-800',
};

// ============================================================================
// COMPONENT
// ============================================================================

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedOption,
  timeRemaining,
  showHindi,
  onOptionSelect,
  onNext,
  onPrevious,
  onMarkForReview,
  isMarkedForReview = false,
  isLastQuestion,
}: QuestionCardProps) {
  const [isHoveringOption, setIsHoveringOption] = useState<number | null>(null);

  // Keyboard shortcuts
  useCallback(
    (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '4') {
        onOptionSelect(parseInt(e.key));
      } else if (e.key === 'ArrowRight') {
        onNext();
      } else if (e.key === 'ArrowLeft') {
        onPrevious();
      } else if (e.key.toLowerCase() === 'r') {
        onMarkForReview();
      }
    },
    [onOptionSelect, onNext, onPrevious, onMarkForReview]
  );

  const questionText = showHindi ? question.questionText.hi : question.questionText.en;
  const optionText = (optionIndex: number) =>
    showHindi ? question.options[optionIndex].text.hi : question.options[optionIndex].text.en;

  const progress = ((questionNumber) / totalQuestions) * 100;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-saffron-500 to-orange-500 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-white font-bold text-lg">
              {showHindi ? `प्रश्न ${questionNumber}` : `Question ${questionNumber}`}
            </span>
            <span className="text-white/80 text-sm">
              {showHindi ? `कुल ${totalQuestions} में से` : `of ${totalQuestions}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Timer */}
            {timeRemaining !== undefined && (
              <div className="flex items-center gap-1 text-white">
                <Clock className="w-4 h-4" />
                <span className="font-mono text-sm">
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}

            {/* Mark for Review */}
            <button
              onClick={onMarkForReview}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                isMarkedForReview
                  ? 'bg-white text-saffron-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Flag className="w-3 h-3" />
              {showHindi ? 'रिव्यू' : 'Review'}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Info Badges */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-2">
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${
            SUBJECT_COLORS[question.subject] || 'bg-gray-100 text-gray-800'
          }`}
        >
          {question.subject}
        </span>

        <span className={`px-2 py-0.5 rounded text-xs font-medium ${DIFFICULTY_COLORS[question.difficulty]}`}>
          {question.difficulty}
        </span>

        {question.isPyy && question.year && (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-saffron-100 text-saffron-800">
            PYQ {question.year}
          </span>
        )}

        {question.topic && (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
            {question.topic}
          </span>
        )}

        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
          +{question.marks} / -{question.negativeMarks}
        </span>
      </div>

      {/* Question Text */}
      <div className="px-4 py-4">
        <p className="text-gray-900 text-base md:text-lg leading-relaxed font-medium">
          {questionText}
        </p>
      </div>

      {/* Options */}
      <div className="px-4 pb-4 space-y-2">
        {question.options.map((option, index) => {
          const optionNumber = index + 1;
          const isSelected = selectedOption === optionNumber;
          const isHovered = isHoveringOption === optionNumber;

          return (
            <button
              key={index}
              onClick={() => onOptionSelect(optionNumber)}
              onMouseEnter={() => setIsHoveringOption(optionNumber)}
              onMouseLeave={() => setIsHoveringOption(null)}
              className={`w-full text-left p-3 md:p-4 rounded-lg border-2 transition-all duration-200 ${
                isSelected
                  ? 'border-saffron-500 bg-saffron-50 shadow-md'
                  : isHovered
                  ? 'border-saffron-300 bg-saffron-50/50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                    isSelected
                      ? 'bg-saffron-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="text-gray-900 flex-1">{optionText(index)}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <button
          onClick={onPrevious}
          disabled={questionNumber === 1}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {showHindi ? 'पिछला' : 'Previous'}
        </button>

        <span className="text-sm text-gray-600">
          {showHindi ? `${questionNumber} / ${totalQuestions}` : `${questionNumber} / ${totalQuestions}`}
        </span>

        <button
          onClick={onNext}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-saffron-600 text-white hover:bg-saffron-700 transition-colors"
        >
          {isLastQuestion ? (showHindi ? 'सबमिट' : 'Submit') : showHindi ? 'अगला' : 'Next'}
          {!isLastQuestion && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          {showHindi
            ? 'कीबोर्ड शॉर्टकट: 1-4 (विकल्प), ←→ (नेविगेशन), R (रिव्यू)'
            : 'Keyboard: 1-4 (options), ←→ (navigate), R (review)'}
        </p>
      </div>
    </div>
  );
}
