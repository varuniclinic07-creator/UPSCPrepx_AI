/**
 * Study Planner Main Page
 * 
 * Master Prompt v8.0 - Feature F8 (READ Mode)
 * - Main dashboard combining all planner components
 * - Bilingual support
 * - Mobile-first responsive design
 */

'use client';

import React, { useState, useEffect } from 'react';
import { DailyTasks } from '@/components/planner/daily-tasks';
import { MilestoneTracker } from '@/components/planner/milestone-tracker';
import { SubjectBalance } from '@/components/planner/subject-balance';
import { GoalProgress } from '@/components/planner/goal-progress';
import { CalendarDays, BookOpen, Settings, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function StudyPlannerPage() {
  const [showHindi, setShowHindi] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivePlan();
  }, []);

  const fetchActivePlan = async () => {
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

  const handleTaskComplete = async (taskId: string, timeSpent: number) => {
    // Refresh data after task completion
    fetchActivePlan();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-16 bg-gray-200 rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded-xl" />
            <div className="h-96 bg-gray-200 rounded-xl" />
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
                <CalendarDays className="w-6 h-6 text-saffron-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {showHindi ? 'अध्ययन योजना' : 'Study Planner'}
                </h1>
                <p className="text-sm text-gray-600">
                  {showHindi
                    ? 'अपनी UPSC तैयारी की योजना बनाएं और ट्रैक करें'
                    : 'Plan and track your UPSC preparation'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Language Toggle */}
              <button
                onClick={() => setShowHindi(!showHindi)}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {showHindi ? 'English' : 'हिंदी'}
              </button>

              {/* Calendar Link */}
              <Link
                href="/study-planner/calendar"
                className="px-4 py-2 text-sm font-medium bg-saffron-600 text-white rounded-lg hover:bg-saffron-700 transition-colors flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                {showHindi ? 'कैलेंडर देखें' : 'View Calendar'}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* No Plan State */}
        {!planId ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <CalendarDays className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {showHindi ? 'अध्ययन योजना शुरू करें' : 'Start Your Study Plan'}
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {showHindi
                ? 'एक व्यक्तिगत अध्ययन योजना बनाएं जो आपकी तैयारी को ट्रैक करे और आपको परीक्षा के लिए तैयार करे।'
                : 'Create a personalized study plan that tracks your preparation and gets you exam-ready.'}
            </p>
            <button
              onClick={fetchActivePlan}
              className="px-6 py-3 bg-gradient-to-r from-saffron-500 to-orange-500 text-white font-medium rounded-lg hover:from-saffron-600 hover:to-orange-600 transition-colors"
            >
              {showHindi ? 'योजना बनाएं' : 'Create Plan'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Row: Goals + Daily Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Goal Progress */}
              <GoalProgress showHindi={showHindi} planId={planId || undefined} />

              {/* Daily Tasks */}
              <DailyTasks
                showHindi={showHindi}
                onTaskComplete={handleTaskComplete}
              />
            </div>

            {/* Middle Row: Milestones + Subject Balance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Milestone Tracker */}
              <MilestoneTracker
                showHindi={showHindi}
                planId={planId || undefined}
              />

              {/* Subject Balance */}
              <SubjectBalance
                showHindi={showHindi}
                planId={planId || undefined}
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                {showHindi ? 'त्वरित क्रियाएं' : 'Quick Actions'}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link
                  href="/study-planner/calendar"
                  className="p-3 rounded-lg border border-gray-200 hover:border-saffron-300 hover:bg-saffron-50 transition-colors text-center"
                >
                  <CalendarDays className="w-6 h-6 text-saffron-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-gray-700">
                    {showHindi ? 'कैलेंडर' : 'Calendar'}
                  </span>
                </Link>
                <Link
                  href="/study-planner/adjustments"
                  className="p-3 rounded-lg border border-gray-200 hover:border-saffron-300 hover:bg-saffron-50 transition-colors text-center"
                >
                  <Settings className="w-6 h-6 text-saffron-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-gray-700">
                    {showHindi ? 'समायोजन' : 'Adjustments'}
                  </span>
                </Link>
                <Link
                  href="/mcq-practice"
                  className="p-3 rounded-lg border border-gray-200 hover:border-saffron-300 hover:bg-saffron-50 transition-colors text-center"
                >
                  <BookOpen className="w-6 h-6 text-saffron-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-gray-700">
                    {showHindi ? 'मॉक टेस्ट' : 'Mock Tests'}
                  </span>
                </Link>
                <Link
                  href="/doubt-solver"
                  className="p-3 rounded-lg border border-gray-200 hover:border-saffron-300 hover:bg-saffron-50 transition-colors text-center"
                >
                  <CalendarDays className="w-6 h-6 text-saffron-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-gray-700">
                    {showHindi ? 'डाउट सॉल्वर' : 'Doubt Solver'}
                  </span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
