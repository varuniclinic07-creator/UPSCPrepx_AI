/**
 * Mains Question Card Component
 * 
 * Displays UPSC Mains question with metadata, word limit, time limit.
 * Supports bilingual display (English + Hindi).
 * 
 * Master Prompt v8.0 - Rule 3: SIMPLIFIED_LANGUAGE_PROMPT
 */

'use client';

import React, { useState } from 'react';

interface MainsQuestionCardProps {
  id: string;
  questionText: string;
  questionTextHindi?: string;
  subject: 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'Essay';
  topic: string;
  wordLimit: number;
  timeLimitMin: number;
  marks: number;
  year?: number;
  isPYQ?: boolean;
  language?: 'en' | 'hi' | 'both';
  onStart?: () => void;
}

export function MainsQuestionCard({
  id,
  questionText,
  questionTextHindi,
  subject,
  topic,
  wordLimit,
  timeLimitMin,
  marks,
  year,
  isPYQ = false,
  language = 'en',
  onStart,
}: MainsQuestionCardProps) {
  const [showHindi, setShowHindi] = useState(language === 'both' || language === 'hi');

  // Subject color mapping
  const subjectColors = {
    GS1: 'bg-blue-100 text-blue-800 border-blue-200',
    GS2: 'bg-green-100 text-green-800 border-green-200',
    GS3: 'bg-purple-100 text-purple-800 border-purple-200',
    GS4: 'bg-orange-100 text-orange-800 border-orange-200',
    Essay: 'bg-pink-100 text-pink-800 border-pink-200',
  };

  // Subject icons
  const subjectIcons = {
    GS1: '📚',
    GS2: '🏛️',
    GS3: '📊',
    GS4: '🎯',
    Essay: '✍️',
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-saffron-500 to-orange-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{subjectIcons[subject]}</span>
            <div>
              <h2 className="text-white font-bold text-lg">{subject} Mains Practice</h2>
              {isPYQ && year && (
                <p className="text-saffron-100 text-sm">PYQ {year} • {marks} Marks</p>
              )}
            </div>
          </div>
          {questionTextHindi && (
            <button
              onClick={() => setShowHindi(!showHindi)}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition-colors"
            >
              {showHindi ? 'English' : 'हिंदी'}
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {/* Topic Tag */}
        <div className="mb-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${subjectColors[subject]}`}>
            {topic}
          </span>
        </div>

        {/* Question Text */}
        <div className="mb-6">
          {showHindi && questionTextHindi ? (
            <div className="space-y-3">
              <p className="text-gray-700 text-lg leading-relaxed font-medium">
                {questionTextHindi}
              </p>
              <div className="w-full h-px bg-gray-200" />
              <p className="text-gray-600 text-base leading-relaxed">
                {questionText}
              </p>
            </div>
          ) : (
            <p className="text-gray-800 text-lg leading-relaxed font-medium">
              {questionText}
            </p>
          )}
        </div>

        {/* Instructions */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <h3 className="text-blue-900 font-semibold mb-2 flex items-center gap-2">
            <span>💡</span> Instructions / निर्देश:
          </h3>
          <ul className="text-blue-800 text-sm space-y-1.5 list-disc list-inside">
            <li>Word limit: <strong>{wordLimit} words</strong> (शब्द सीमा)</li>
            <li>Time limit: <strong>{timeLimitMin} minutes</strong> (समय सीमा)</li>
            <li>Start with a brief introduction (20-30 words)</li>
            <li>Use clear paragraph structure with headings</li>
            <li>Include relevant examples, data, and case studies</li>
            <li>End with a balanced conclusion (15-20 words)</li>
          </ul>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500 text-xs mb-1">Word Limit</p>
            <p className="text-gray-900 font-bold text-lg">{wordLimit}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500 text-xs mb-1">Time Limit</p>
            <p className="text-gray-900 font-bold text-lg">{timeLimitMin} min</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500 text-xs mb-1">Marks</p>
            <p className="text-gray-900 font-bold text-lg">{marks}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500 text-xs mb-1">Type</p>
            <p className="text-gray-900 font-bold text-lg">{isPYQ ? 'PYQ' : 'Practice'}</p>
          </div>
        </div>

        {/* Tips Box */}
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
          <h3 className="text-green-900 font-semibold mb-2 flex items-center gap-2">
            <span>🎯</span> Exam Tips:
          </h3>
          <ul className="text-green-800 text-sm space-y-1.5 list-disc list-inside">
            <li>Structure: Introduction → Body (3-4 points) → Conclusion</li>
            <li>Use keywords from the question in your answer</li>
            <li>Quote relevant articles, committees, or reports</li>
            <li>Add a diagram/flowchart if applicable (saves time, adds value)</li>
            <li>Keep sentences short and clear (10th-class level)</li>
          </ul>
        </div>

        {/* Start Button */}
        {onStart && (
          <button
            onClick={onStart}
            className="w-full py-4 bg-gradient-to-r from-saffron-500 to-orange-600 hover:shadow-lg hover:shadow-saffron-500/50 text-white font-bold text-lg rounded-xl transition-all transform hover:scale-[1.02]"
          >
            Start Writing →
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <p className="text-gray-500 text-xs text-center">
          📝 Your answer will be evaluated in &lt;60 seconds with AI-powered feedback
        </p>
      </div>
    </div>
  );
}
