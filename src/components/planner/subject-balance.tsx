/**
 * Subject Balance Component
 * 
 * Master Prompt v8.0 - Feature F8 (READ Mode)
 * - Shows subject-wise study time distribution
 * - Bilingual support
 * - Mobile-first responsive design
 */

'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, TrendingUp } from 'lucide-react';

interface SubjectBalanceProps {
  showHindi?: boolean;
  planId?: string;
}

interface SubjectData {
  id: string;
  name: string;
  nameHi: string;
  hoursSpent: number;
  targetHours: number;
  percentage: number;
  color: string;
}

export function SubjectBalance({ showHindi = false, planId }: SubjectBalanceProps) {
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjectBalance();
  }, [planId]);

  const fetchSubjectBalance = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockData: SubjectData[] = [
        {
          id: '1',
          name: 'History',
          nameHi: 'इतिहास',
          hoursSpent: 45,
          targetHours: 60,
          percentage: 75,
          color: 'bg-blue-500',
        },
        {
          id: '2',
          name: 'Geography',
          nameHi: 'भूगोल',
          hoursSpent: 30,
          targetHours: 50,
          percentage: 60,
          color: 'bg-green-500',
        },
        {
          id: '3',
          name: 'Polity',
          nameHi: 'राजव्यवस्था',
          hoursSpent: 25,
          targetHours: 40,
          percentage: 62.5,
          color: 'bg-purple-500',
        },
      ];

      setSubjects(mockData);
    } catch (error) {
      console.error('Failed to fetch subject balance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded" />
            <div className="h-16 bg-gray-200 rounded" />
            <div className="h-16 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-saffron-100 rounded-lg">
            <BookOpen className="w-5 h-5 text-saffron-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {showHindi ? 'विषय संतुलन' : 'Subject Balance'}
            </h3>
            <p className="text-sm text-gray-600">
              {showHindi ? 'अध्ययन समय वितरण' : 'Study time distribution'}
            </p>
          </div>
        </div>
        <TrendingUp className="w-5 h-5 text-green-600" />
      </div>

      {/* Subject List */}
      <div className="space-y-4">
        {subjects.map((subject) => (
          <div key={subject.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {showHindi ? subject.nameHi : subject.name}
              </span>
              <span className="text-sm text-gray-600">
                {subject.hoursSpent}/{subject.targetHours}{' '}
                {showHindi ? 'घंटे' : 'hrs'}
              </span>
            </div>
            <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 ${subject.color} rounded-full transition-all duration-300`}
                style={{ width: `${subject.percentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{subject.percentage.toFixed(0)}% {showHindi ? 'पूर्ण' : 'complete'}</span>
              <span>
                {subject.targetHours - subject.hoursSpent}{' '}
                {showHindi ? 'घंटे शेष' : 'hrs remaining'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {showHindi ? 'कुल अध्ययन समय' : 'Total study time'}
          </span>
          <span className="font-semibold text-gray-900">
            {subjects.reduce((acc, s) => acc + s.hoursSpent, 0)}{' '}
            {showHindi ? 'घंटे' : 'hours'}
          </span>
        </div>
      </div>
    </div>
  );
}
