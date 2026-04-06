/**
 * Daily Tasks Component
 * 
 * Master Prompt v8.0 - Feature F8 (READ Mode)
 * - Interactive task checklist
 * - Completion tracking
 * - XP rewards display
 * - Bilingual support
 */

import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Circle, Clock, BookOpen, FileText, Brain, Target, Award, ChevronRight, RefreshCw } from 'lucide-react';

interface Task {
  id: string;
  type: 'study' | 'revision' | 'mock_test' | 'analysis' | 'current_affairs';
  subject: string;
  topic: string;
  subtopic?: string;
  estimatedMinutes: number;
  status: 'pending' | 'in-progress' | 'completed' | 'skipped';
  contentLinks?: string[];
}

interface DailyTasksProps {
  showHindi: boolean;
  date?: string;
  onTaskComplete?: (taskId: string, timeSpent: number) => void;
}

const TASK_TYPE_ICONS: Record<string, React.ReactNode> = {
  study: <BookOpen className="w-4 h-4" />,
  revision: <RefreshCw className="w-4 h-4" />,
  mock_test: <FileText className="w-4 h-4" />,
  analysis: <Brain className="w-4 h-4" />,
  current_affairs: <Target className="w-4 h-4" />,
};

const TASK_TYPE_LABELS: Record<string, { en: string; hi: string }> = {
  study: { en: 'Study', hi: 'अध्ययन' },
  revision: { en: 'Revision', hi: 'रिविजन' },
  mock_test: { en: 'Mock Test', hi: 'मॉक टेस्ट' },
  analysis: { en: 'Analysis', hi: 'विश्लेषण' },
  current_affairs: { en: 'Current Affairs', hi: 'करंट अफेयर्स' },
};

const SUBJECT_COLORS: Record<string, string> = {
  GS1: 'bg-blue-100 text-blue-700 border-blue-200',
  GS2: 'bg-green-100 text-green-700 border-green-200',
  GS3: 'bg-orange-100 text-orange-700 border-orange-200',
  GS4: 'bg-purple-100 text-purple-700 border-purple-200',
  CSAT: 'bg-red-100 text-red-700 border-red-200',
  CA: 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

export function DailyTasks({ showHindi, date, onTaskComplete }: DailyTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [timeSpent, setTimeSpent] = useState<number>(30);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const dateParam = date || new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/planner/daily-tasks?date=${dateParam}`);
      const data = await response.json();

      if (data.success) {
        setTasks(data.data.tasks || []);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCompleteTask = async (taskId: string) => {
    setCompleting(taskId);
    try {
      const response = await fetch('/api/planner/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          time_spent_minutes: timeSpent,
          quality_rating: 4,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: 'completed' as const } : t))
        );
        onTaskComplete?.(taskId, timeSpent);
        setSelectedTask(null);
      }
    } catch (error) {
      console.error('Failed to complete task:', error);
    } finally {
      setCompleting(null);
    }
  };

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const totalCount = tasks.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalMinutes = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const completedMinutes = tasks
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + t.estimatedMinutes, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header with Progress */}
      <div className="px-4 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            {showHindi ? 'आज के कार्य' : "Today's Tasks"}
          </h3>
          <button
            onClick={fetchTasks}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={showHindi ? 'रीफ्रेश करें' : 'Refresh'}
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {completedCount}/{totalCount} {showHindi ? 'पूर्ण' : 'completed'}
            </span>
            <span className="font-medium text-saffron-600">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-saffron-500 to-orange-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {completedMinutes}/{totalMinutes} {showHindi ? 'मिनट' : 'minutes'}
            </span>
            {completedCount === totalCount && totalCount > 0 && (
              <span className="flex items-center gap-1 text-green-600 font-medium">
                <Award className="w-3 h-3" />
                {showHindi ? 'सभी कार्य पूर्ण!' : 'All tasks done!'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="divide-y divide-gray-100">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-gray-200 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))
          : tasks.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  {showHindi ? 'आज कोई कार्य निर्धारित नहीं है' : 'No tasks scheduled for today'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {showHindi ? 'आराम करें या रिविजन करें' : 'Take a break or do some revision'}
                </p>
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className={`px-4 py-4 transition-colors ${
                    task.status === 'completed' ? 'bg-green-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => task.status !== 'completed' && handleCompleteTask(task.id)}
                      disabled={completing === task.id || task.status === 'completed'}
                      className="mt-0.5 flex-shrink-0"
                    >
                      {completing === task.id ? (
                        <div className="w-5 h-5 border-2 border-saffron-500 border-t-transparent rounded-full animate-spin" />
                      ) : task.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300 hover:text-saffron-500" />
                      )}
                    </button>

                    {/* Task Info */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => setSelectedTask(selectedTask === task.id ? null : task.id)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${
                          SUBJECT_COLORS[task.subject] || 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}>
                          {task.subject}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          {TASK_TYPE_ICONS[task.type]}
                          {TASK_TYPE_LABELS[task.type]?.[showHindi ? 'hi' : 'en'] || task.type}
                        </span>
                      </div>

                      <h4 className={`text-sm font-medium ${
                        task.status === 'completed' ? 'text-green-700 line-through' : 'text-gray-900'
                      }`}>
                        {task.topic}
                      </h4>
                      {task.subtopic && (
                        <p className="text-xs text-gray-500 mt-0.5">{task.subtopic}</p>
                      )}

                      {/* Expanded Details */}
                      {selectedTask === task.id && task.status !== 'completed' && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {task.estimatedMinutes} {showHindi ? 'मिनट' : 'min'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {showHindi ? 'समय चुनें:' : 'Select time:'}
                            </span>
                          </div>

                          {/* Time Selector */}
                          <div className="flex gap-2">
                            {[15, 30, 45, 60, 90].map((mins) => (
                              <button
                                key={mins}
                                onClick={() => setTimeSpent(mins)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                  timeSpent === mins
                                    ? 'bg-saffron-500 text-white'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                {mins}m
                              </button>
                            ))}
                          </div>

                          {/* Complete Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompleteTask(task.id);
                            }}
                            disabled={completing === task.id}
                            className="w-full py-2 bg-gradient-to-r from-saffron-500 to-orange-500 text-white text-sm font-medium rounded-lg hover:from-saffron-600 hover:to-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {showHindi ? 'कार्य पूर्ण करें' : 'Mark as Complete'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Chevron */}
                    {task.status !== 'completed' && (
                      <ChevronRight
                        className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
                          selectedTask === task.id ? 'rotate-90' : ''
                        }`}
                      />
                    )}
                  </div>
                </div>
              ))
            )}
      </div>

      {/* Footer */}
      {!loading && tasks.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {showHindi ? 'कार्य पर क्लिक करें विवरण देखने के लिए' : 'Click a task to see details'}
            </span>
            <span className="flex items-center gap-1">
              <Award className="w-3 h-3 text-saffron-500" />
              {showHindi ? '+10 XP प्रति कार्य' : '+10 XP per task'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
