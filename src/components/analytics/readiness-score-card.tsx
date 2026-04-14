/**
 * Readiness Score Card Component
 * 
 * Master Prompt v8.0 - Feature F9 (READ Mode)
 * - Overall exam readiness score (0-100)
 * - Factor breakdown with weights
 * - Predicted readiness date
 * - Bilingual support
 */

import React, { useState, useEffect } from 'react';
import { Award, TrendingUp, Calendar, AlertTriangle, CheckCircle, Target } from 'lucide-react';

interface ReadinessScoreCardProps {
  showHindi: boolean;
  planId?: string;
}

interface ReadinessFactors {
  coverage: number;
  accuracy: number;
  consistency: number;
  mocks: number;
}

export function ReadinessScoreCard({ showHindi, planId }: ReadinessScoreCardProps) {
  const [score, setScore] = useState(0);
  const [factors, setFactors] = useState<ReadinessFactors>({ coverage: 0, accuracy: 0, consistency: 0, mocks: 0 });
  const [readinessDate, setReadinessDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReadinessData();
  }, [planId]);

  const fetchReadinessData = async () => {
    setLoading(true);
    try {
      // In production: fetch from /api/analytics/readiness-score
      // Sample data for demonstration
      const sampleFactors: ReadinessFactors = {
        coverage: 35,
        accuracy: 62,
        consistency: 50,
        mocks: 25,
      };

      const calculatedScore = Math.round(
        sampleFactors.coverage * 0.35 +
        sampleFactors.accuracy * 0.30 +
        sampleFactors.consistency * 0.20 +
        sampleFactors.mocks * 0.15
      );

      setFactors(sampleFactors);
      setScore(calculatedScore);

      // Predict readiness date based on score and trend
      const daysNeeded = Math.max(0, Math.round((100 - calculatedScore) * 3));
      if (daysNeeded > 0) {
        const date = new Date();
        date.setDate(date.getDate() + daysNeeded);
        setReadinessDate(date.toISOString().split('T')[0]);
      } else {
        setReadinessDate(new Date().toISOString().split('T')[0]);
      }
    } catch (error) {
      console.error('Failed to fetch readiness data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (s: number) => {
    if (s >= 80) return 'stroke-green-500 text-green-600';
    if (s >= 60) return 'stroke-yellow-500 text-yellow-600';
    if (s >= 40) return 'stroke-orange-500 text-orange-600';
    return 'stroke-red-500 text-red-600';
  };

  const getScoreTextColor = (s: number) => {
    if (s >= 80) return 'text-green-600';
    if (s >= 60) return 'text-yellow-600';
    if (s >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return { en: 'Exam Ready!', hi: 'परीक्षा के लिए तैयार!' };
    if (s >= 60) return { en: 'On Track', hi: 'सही दिशा में' };
    if (s >= 40) return { en: 'Needs Focus', hi: 'ध्यान देने की ज़रूरत' };
    return { en: 'Starting Phase', hi: 'शुरुआती चरण' };
  };

  const scoreLabel = getScoreLabel(score);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gray-200" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
          <div className="h-3 bg-gray-200 rounded w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200 flex items-center gap-2">
        <Award className={`w-5 h-5 ${getScoreTextColor(score)}`} />
        <h3 className="text-lg font-semibold text-gray-900">
          {showHindi ? 'परीक्षा तैयारी स्कोर' : 'Exam Readiness Score'}
        </h3>
      </div>

      {/* Score Gauge */}
      <div className="p-6">
        <div className="relative w-40 h-40 mx-auto">
          {/* Background Circle */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="10"
            />
            {/* Progress Circle */}
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              className={getScoreColor(score)}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            />
          </svg>

          {/* Score Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${getScoreTextColor(score)}`}>
              {score}
            </span>
            <span className="text-xs text-gray-500">/ 100</span>
          </div>
        </div>

        {/* Status Label */}
        <div className="text-center mt-4">
          <p className={`text-sm font-medium ${getScoreTextColor(score)}`}>
            {score >= 80 ? '✅' : score >= 60 ? '📈' : score >= 40 ? '⚠️' : '📚'} {scoreLabel[showHindi ? 'hi' : 'en']}
          </p>
          {readinessDate && (
            <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
              <Calendar className="w-3 h-3" />
              {showHindi ? 'अनुमानित तैयारी:' : 'Est. ready:'}{' '}
              {new Date(readinessDate).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Factor Breakdown */}
        <div className="mt-6 space-y-3">
          {/* Syllabus Coverage */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-blue-500" />
              {showHindi ? 'पाठ्यक्रम' : 'Coverage'} (35%)
            </span>
            <div className="flex items-center gap-2">
              <div className="w-20 bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${factors.coverage}%` }}
                />
              </div>
              <span className="text-xs font-medium w-8 text-right">{factors.coverage}%</span>
            </div>
          </div>

          {/* Accuracy */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 flex items-center gap-1">
              <Target className="w-3 h-3 text-green-500" />
              {showHindi ? 'सटीकता' : 'Accuracy'} (30%)
            </span>
            <div className="flex items-center gap-2">
              <div className="w-20 bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-green-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${factors.accuracy}%` }}
                />
              </div>
              <span className="text-xs font-medium w-8 text-right">{factors.accuracy}%</span>
            </div>
          </div>

          {/* Consistency */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-purple-500" />
              {showHindi ? 'निरंतरता' : 'Consistency'} (20%)
            </span>
            <div className="flex items-center gap-2">
              <div className="w-20 bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-purple-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${factors.consistency}%` }}
                />
              </div>
              <span className="text-xs font-medium w-8 text-right">{factors.consistency}%</span>
            </div>
          </div>

          {/* Mock Tests */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 flex items-center gap-1">
              <Award className="w-3 h-3 text-orange-500" />
              {showHindi ? 'मॉक टेस्ट' : 'Mock Tests'} (15%)
            </span>
            <div className="flex items-center gap-2">
              <div className="w-20 bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-orange-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${factors.mocks}%` }}
                />
              </div>
              <span className="text-xs font-medium w-8 text-right">{factors.mocks}%</span>
            </div>
          </div>
        </div>

        {/* Improvement Suggestion */}
        {score < 80 && (
          <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-orange-700">
                {showHindi
                  ? `सुझाव: ${factors.coverage < 50 ? 'पाठ्यक्रम कवरेज बढ़ाएं' : factors.accuracy < 60 ? 'MCQ सटीकता सुधारें' : 'मॉक टेस्ट और बढ़ाएं'}`
                  : `Tip: Focus on ${factors.coverage < 50 ? 'increasing syllabus coverage' : factors.accuracy < 60 ? 'improving MCQ accuracy' : 'taking more mock tests'}`
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
