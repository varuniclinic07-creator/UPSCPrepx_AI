/**
 * Mains Evaluation Result Component
 * 
 * Displays AI evaluation results with 4-criteria scores, feedback, and model answer.
 * Bilingual support (English + Hindi).
 * 
 * Master Prompt v8.0 - Rule 3: SIMPLIFIED_LANGUAGE_PROMPT
 */

'use client';

import React, { useState } from 'react';
import { MainsScoreCard } from './mains-score-card';

interface EvaluationResult {
  id: string;
  answer_id: string;
  overall_score: number;
  overall_percentage: number;
  grade: string;
  structure_score: number;
  content_score: number;
  analysis_score: number;
  presentation_score: number;
  feedback_text: string;
  feedback_text_hindi?: string;
  strengths: string[];
  improvements: string[];
  model_answer_points: string[];
  word_count: number;
  time_taken_sec: number;
  evaluation_time_sec: number;
  created_at: string;
}

interface MainsEvaluationResultProps {
  evaluation: EvaluationResult;
  questionText: string;
  userAnswer: string;
  language?: 'en' | 'hi' | 'both';
  onRetry?: () => void;
  onPracticeAnother?: () => void;
}

export function MainsEvaluationResult({
  evaluation,
  questionText,
  userAnswer,
  language = 'en',
  onRetry,
  onPracticeAnother,
}: MainsEvaluationResultProps) {
  const [showHindi, setShowHindi] = useState(language === 'both' || language === 'hi');
  const [activeTab, setActiveTab] = useState<'feedback' | 'answer' | 'model'>('feedback');

  // Grade color mapping
  const gradeColors = {
    'Excellent': 'bg-green-100 text-green-800 border-green-200',
    'Good': 'bg-blue-100 text-blue-800 border-blue-200',
    'Average': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Below Average': 'bg-orange-100 text-orange-800 border-orange-200',
    'Poor': 'bg-red-100 text-red-800 border-red-200',
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-saffron-500 to-orange-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">📊 Evaluation Report</h2>
          {evaluation.feedback_text_hindi && (
            <button
              onClick={() => setShowHindi(!showHindi)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition-colors"
            >
              {showHindi ? 'English' : 'हिंदी'}
            </button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-saffron-100 text-xs mb-1">Overall Score</p>
            <p className="text-3xl font-bold">{evaluation.overall_percentage}%</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-saffron-100 text-xs mb-1">Grade</p>
            <p className="text-xl font-bold">{evaluation.grade}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-saffron-100 text-xs mb-1">Time Taken</p>
            <p className="text-xl font-bold">{formatTime(evaluation.time_taken_sec)}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-saffron-100 text-xs mb-1">Evaluation Time</p>
            <p className="text-xl font-bold">{evaluation.evaluation_time_sec}s ⚡</p>
          </div>
        </div>
      </div>

      {/* Score Cards */}
      <MainsScoreCard
        structure={evaluation.structure_score}
        content={evaluation.content_score}
        analysis={evaluation.analysis_score}
        presentation={evaluation.presentation_score}
        overall={evaluation.overall_percentage}
      />

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('feedback')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'feedback'
                  ? 'bg-saffron-50 text-saffron-700 border-b-2 border-saffron-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              💡 Feedback
            </button>
            <button
              onClick={() => setActiveTab('answer')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'answer'
                  ? 'bg-saffron-50 text-saffron-700 border-b-2 border-saffron-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              📝 Your Answer
            </button>
            <button
              onClick={() => setActiveTab('model')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'model'
                  ? 'bg-saffron-50 text-saffron-700 border-b-2 border-saffron-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              📚 Model Points
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'feedback' && (
            <div className="space-y-6">
              {/* Overall Feedback */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span>📖</span> Overall Feedback:
                </h3>
                <div className={`prose max-w-none p-4 rounded-lg ${
                  showHindi ? 'bg-blue-50' : 'bg-gray-50'
                }`}>
                  {showHindi && evaluation.feedback_text_hindi ? (
                    <>
                      <p className="text-gray-800 leading-relaxed mb-3">
                        {evaluation.feedback_text_hindi}
                      </p>
                      <div className="w-full h-px bg-gray-200 my-3" />
                      <p className="text-gray-600 leading-relaxed">
                        {evaluation.feedback_text}
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-800 leading-relaxed">
                      {evaluation.feedback_text}
                    </p>
                  )}
                </div>
              </div>

              {/* Strengths */}
              <div>
                <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center gap-2">
                  <span className="text-xl">✅</span> Strengths (What you did well):
                </h3>
                <ul className="space-y-2">
                  {evaluation.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span className="text-green-800 text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div>
                <h3 className="text-lg font-bold text-orange-900 mb-3 flex items-center gap-2">
                  <span className="text-xl">🎯</span> Areas for Improvement:
                </h3>
                <ul className="space-y-2">
                  {evaluation.improvements.map((improvement, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <span className="text-orange-600 mt-0.5">→</span>
                      <span className="text-orange-800 text-sm">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'answer' && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>📝</span> Your Answer:
              </h3>
              <div className="prose max-w-none p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div
                  className="text-gray-800 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: userAnswer }}
                />
              </div>
            </div>
          )}

          {activeTab === 'model' && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>📚</span> Model Answer Points (Key points to include):
              </h3>
              <ul className="space-y-3">
                {evaluation.model_answer_points.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-purple-900 text-sm">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-8 py-3 bg-gradient-to-r from-saffron-500 to-orange-600 hover:shadow-lg hover:shadow-saffron-500/50 text-white font-bold rounded-xl transition-all transform hover:scale-105"
          >
            🔄 Retry Same Question
          </button>
        )}
        {onPracticeAnother && (
          <button
            onClick={onPracticeAnother}
            className="px-8 py-3 bg-white border-2 border-saffron-500 text-saffron-700 font-bold rounded-xl hover:bg-saffron-50 transition-all"
          >
            📝 Practice Another Question
          </button>
        )}
      </div>

      {/* Performance Tip */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-blue-900 text-sm text-center">
          <strong>💡 Tip:</strong> Practice 3-5 answers daily for best results. Focus on structure, content depth, and time management.
        </p>
      </div>
    </div>
  );
}
