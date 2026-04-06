/**
 * Subject Performance Chart Component
 * 
 * Master Prompt v8.0 - Feature F9 (READ Mode)
 * - Bar chart of MCQ accuracy per subject
 * - Target line (70%)
 * - Trend indicators
 * - Bilingual support
 */

import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SubjectPerformanceChartProps {
  showHindi: boolean;
}

interface SubjectPerformance {
  subject: string;
  accuracy: number;
  attempts: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

const SUBJECT_COLORS: Record<string, string> = {
  GS1: '#3B82F6',
  GS2: '#10B981',
  GS3: '#F97316',
  GS4: '#8B5CF6',
  CSAT: '#EF4444',
  'Current Affairs': '#F59E0B',
};

const SUBJECT_LABELS: Record<string, { en: string; hi: string }> = {
  GS1: { en: 'GS1', hi: 'GS1' },
  GS2: { en: 'GS2', hi: 'GS2' },
  GS3: { en: 'GS3', hi: 'GS3' },
  GS4: { en: 'GS4', hi: 'GS4' },
  CSAT: { en: 'CSAT', hi: 'CSAT' },
  'Current Affairs': { en: 'Current Affairs', hi: 'करंट अफेयर्स' },
};

export function SubjectPerformanceChart({ showHindi }: SubjectPerformanceChartProps) {
  const [subjects, setSubjects] = useState<SubjectPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Sample data for demonstration
      const sampleData: SubjectPerformance[] = [
        { subject: 'GS1', accuracy: 68, attempts: 145, trend: 'up', change: 5.2 },
        { subject: 'GS2', accuracy: 72, attempts: 189, trend: 'up', change: 3.8 },
        { subject: 'GS3', accuracy: 55, attempts: 112, trend: 'down', change: -4.1 },
        { subject: 'GS4', accuracy: 61, attempts: 87, trend: 'stable', change: 0.5 },
        { subject: 'CSAT', accuracy: 78, attempts: 96, trend: 'up', change: 8.3 },
        { subject: 'Current Affairs', accuracy: 64, attempts: 134, trend: 'down', change: -2.1 },
      ];
      setSubjects(sampleData);
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const targetAccuracy = 70;
  const maxAccuracy = 100;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-saffron-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {showHindi ? 'विषय प्रदर्शन' : 'Subject Performance'}
          </h3>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {showHindi ? 'MCQ सटीकता (% में)' : 'MCQ Accuracy (%)'}
        </p>
      </div>

      {/* Chart */}
      <div className="p-4">
        {/* Target Line Label */}
        <div className="relative mb-2">
          <div className="absolute right-0 text-[10px] text-gray-400">
            {targetAccuracy}% {showHindi ? 'लक्ष्य' : 'target'}
          </div>
          <div className="border-t-2 border-dashed border-red-300" style={{ top: `${100 - targetAccuracy}%` }} />
        </div>

        {/* Subject Bars */}
        <div className="space-y-3">
          {subjects.map((subject) => {
            const isAboveTarget = subject.accuracy >= targetAccuracy;
            const width = Math.min(subject.accuracy, maxAccuracy);

            return (
              <div key={subject.subject} className="flex items-center gap-3">
                {/* Subject Label */}
                <div className="w-24 text-xs font-medium text-gray-700">
                  {SUBJECT_LABELS[subject.subject]?.[showHindi ? 'hi' : 'en'] || subject.subject}
                </div>

                {/* Bar */}
                <div className="flex-1 relative">
                  <div className="bg-gray-100 rounded-full h-7 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{
                        width: `${width}%`,
                        backgroundColor: isAboveTarget ? SUBJECT_COLORS[subject.subject] : '#EF4444',
                      }}
                    >
                      <span className="text-xs font-bold text-white">{subject.accuracy}%</span>
                    </div>
                  </div>

                  {/* Target Marker */}
                  <div
                    className="absolute top-0 h-7 border-l-2 border-dashed border-red-400"
                    style={{ left: `${targetAccuracy}%` }}
                  />
                </div>

                {/* Trend */}
                <div className="w-16 flex items-center gap-1">
                  {subject.trend === 'up' ? (
                    <span className="flex items-center gap-0.5 text-green-600 text-xs font-medium">
                      <TrendingUp className="w-3 h-3" />+{subject.change}%
                    </span>
                  ) : subject.trend === 'down' ? (
                    <span className="flex items-center gap-0.5 text-red-600 text-xs font-medium">
                      <TrendingDown className="w-3 h-3" />{subject.change}%
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-gray-500 text-xs font-medium">
                      <Minus className="w-3 h-3" />{subject.change}%
                    </span>
                  )}
                </div>

                {/* Attempts */}
                <div className="w-12 text-xs text-gray-500 text-right">
                  {subject.attempts}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded" />
            {showHindi ? 'लक्ष्य से ऊपर' : 'Above target'}
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded" />
            {showHindi ? 'लक्ष्य से नीचे' : 'Below target'}
          </span>
          <span className="text-gray-400">
            --- {showHindi ? 'लक्ष्य रेखा' : 'Target line'}
          </span>
        </div>
      </div>
    </div>
  );
}