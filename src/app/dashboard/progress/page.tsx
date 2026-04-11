/**
 * Progress Dashboard Main Page
 * 
 * Master Prompt v8.0 - Feature F9 (READ Mode)
 * - Analytics dashboard with charts
 * - Readiness score
 * - Study trends and comparisons
 * - Bilingual support
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, BarChart3, PieChart, Award, CalendarDays, Target } from 'lucide-react';
import { ReadinessScoreCard } from '@/components/analytics/readiness-score-card';
import { StudyTrendChart } from '@/components/analytics/study-trend-chart';
import { SubjectPerformanceChart } from '@/components/analytics/subject-performance-chart';
import { TimeDistributionChart } from '@/components/analytics/time-distribution-chart';
import { WeeklyComparisonCard } from '@/components/analytics/weekly-comparison-card';
import { ConsistencyHeatmap } from '@/components/analytics/consistency-heatmap';

export default function ProgressDashboardPage() {
  const [showHindi, setShowHindi] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlan();
  }, []);

  const fetchPlan = async () => {
    try {
      const response = await fetch('/api/planner/schedule');
      const data = await response.json();
      if (data.success && data.data?.plan?.id) {
        setPlanId(data.data.plan.id);
      }
    } catch (error) {
      console.error('Failed to fetch plan:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-16 bg-gray-200 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-xl" />
            ))}
          </div>
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
                <BarChart3 className="w-6 h-6 text-saffron-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {showHindi ? 'प्रगति डैशबोर्ड' : 'Progress Dashboard'}
                </h1>
                <p className="text-sm text-gray-600">
                  {showHindi
                    ? 'अपनी UPSC तैयारी का विश्लेषण ट्रैक करें'
                    : 'Track and analyze your UPSC preparation'}
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!planId ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {showHindi ? 'डेटा देखने के लिए योजना शुरू करें' : 'Start a Plan to View Analytics'}
            </h2>
            <p className="text-gray-600 mb-6">
              {showHindi
                ? 'एक अध्ययन योजना बनाने के बाद, आप अपनी प्रगति यहाँ देख पाएंगे।'
                : 'After creating a study plan, you\'ll be able to view your progress here.'}
            </p>
            <a
              href="/dashboard/study-planner"
              className="inline-block px-6 py-3 bg-gradient-to-r from-saffron-500 to-orange-500 text-white font-medium rounded-lg hover:from-saffron-600 hover:to-orange-600 transition-colors"
            >
              {showHindi ? 'योजना बनाएं' : 'Create Study Plan'}
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Row: Readiness Score + Weekly Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Readiness Score */}
              <div className="lg:col-span-1">
                <ReadinessScoreCard showHindi={showHindi} planId={planId} />
              </div>

              {/* Weekly Comparison */}
              <div className="lg:col-span-2">
                <WeeklyComparisonCard showHindi={showHindi} />
              </div>
            </div>

            {/* Study Trend Chart */}
            <StudyTrendChart showHindi={showHindi} />

            {/* Subject Performance + Time Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SubjectPerformanceChart showHindi={showHindi} />
              <TimeDistributionChart showHindi={showHindi} />
            </div>

            {/* Consistency Heatmap */}
            <ConsistencyHeatmap showHindi={showHindi} />
          </div>
        )}
      </main>
    </div>
  );
}