/**
 * Study Planner Calendar Page
 * 
 * Master Prompt v8.0 - Feature F8 (READ Mode)
 * - Full-screen calendar view
 * - Date selection with task details
 * - Bilingual support
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ScheduleCalendar } from '@/components/planner/schedule-calendar';
import { DailyTasks } from '@/components/planner/daily-tasks';
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CalendarPage() {
  const router = useRouter();
  const [showHindi, setShowHindi] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDateTasks, setSelectedDateTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDateTasks = async (date: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/planner/daily-tasks?date=${date}`);
      const data = await response.json();
      if (data.success) {
        setSelectedDateTasks(data.data.tasks || []);
      }
    } catch (error) {
      console.error('Failed to fetch date tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDateTasks(selectedDate);
  }, [selectedDate]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(showHindi ? 'hi-IN' : 'en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/study-planner"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div className="p-2 bg-saffron-100 rounded-lg">
                <CalendarDays className="w-6 h-6 text-saffron-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {showHindi ? 'कैलेंडर दृश्य' : 'Calendar View'}
                </h1>
                <p className="text-sm text-gray-600">
                  {showHindi ? 'अपनी अध्ययन अनुसूची देखें' : 'View your study schedule'}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar (2/3 width) */}
          <div className="lg:col-span-2">
            <ScheduleCalendar
              showHindi={showHindi}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </div>

          {/* Selected Date Tasks (1/3 width) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden sticky top-24">
              {/* Date Header */}
              <div className="px-4 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">
                    {showHindi ? 'कार्य' : 'Tasks'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigateDate('prev')}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                      className="text-xs font-medium text-saffron-600 hover:bg-saffron-50 px-2 py-1 rounded"
                    >
                      {showHindi ? 'आज' : 'Today'}
                    </button>
                    <button
                      onClick={() => navigateDate('next')}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-900">{formatDate(selectedDate)}</p>
              </div>

              {/* Tasks */}
              <div className="p-4">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse flex items-center gap-3">
                        <div className="w-5 h-5 bg-gray-200 rounded" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-3/4" />
                          <div className="h-2 bg-gray-200 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : selectedDateTasks.length === 0 ? (
                  <div className="text-center py-6">
                    <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      {showHindi ? 'इस दिन कोई कार्य नहीं' : 'No tasks on this day'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDateTasks.map((task: any) => (
                      <div
                        key={task.id}
                        className={`p-3 rounded-lg border ${
                          task.status === 'completed'
                            ? 'bg-green-50 border-green-200'
                            : task.status === 'missed'
                            ? 'bg-red-50 border-red-200'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            task.subject === 'GS1' ? 'bg-blue-100 text-blue-700' :
                            task.subject === 'GS2' ? 'bg-green-100 text-green-700' :
                            task.subject === 'GS3' ? 'bg-orange-100 text-orange-700' :
                            task.subject === 'GS4' ? 'bg-purple-100 text-purple-700' :
                            task.subject === 'CSAT' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {task.subject}
                          </span>
                          {task.status === 'completed' && (
                            <span className="text-xs text-green-600">{showHindi ? 'पूर्ण' : 'Done'}</span>
                          )}
                          {task.status === 'missed' && (
                            <span className="text-xs text-red-600">{showHindi ? 'छूटा' : 'Missed'}</span>
                          )}
                        </div>
                        <p className={`text-sm font-medium ${
                          task.status === 'completed' ? 'text-green-700 line-through' : 'text-gray-900'
                        }`}>
                          {task.topic}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {task.estimated_minutes} {showHindi ? 'मिनट' : 'min'}
                          {task.subtopic && ` • ${task.subtopic}`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Total */}
                {selectedDateTasks.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{showHindi ? 'कुल कार्य:' : 'Total:'}</span>
                      <span>{selectedDateTasks.length}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{showHindi ? 'अनुमानित समय:' : 'Est. Time:'}</span>
                      <span>
                        {selectedDateTasks.reduce((sum: number, t: any) => sum + (t.estimated_minutes || 0), 0)} {showHindi ? 'मिनट' : 'min'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}