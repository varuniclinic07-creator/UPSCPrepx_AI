import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface ScheduleCalendarProps {
  showHindi: boolean;
  onDateSelect?: (date: string) => void;
  selectedDate?: string;
  planId?: string;
}

interface DayData {
  date: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasTasks: boolean;
  completedTasks: number;
  totalTasks: number;
  status: 'pending' | 'in-progress' | 'completed' | 'missed' | 'none';
}

const SUBJECT_COLORS: Record<string, string> = {
  GS1: 'bg-blue-500',
  GS2: 'bg-green-500',
  GS3: 'bg-orange-500',
  GS4: 'bg-purple-500',
  CSAT: 'bg-red-500',
  CA: 'bg-yellow-500',
};

export function ScheduleCalendar({ showHindi, onDateSelect, selectedDate, planId }: ScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [days, setDays] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScheduleData();
  }, [currentDate, planId]);

  const fetchScheduleData = async () => {
    setLoading(true);
    try {
      // Fetch schedule data for the current month
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      const startStr = firstDay.toISOString().split('T')[0];
      const endStr = lastDay.toISOString().split('T')[0];

      // Generate calendar days
      const calendarDays: DayData[] = [];
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // Get day of week for first day (0 = Sunday)
      const firstDayOfWeek = firstDay.getDay();
      const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Monday start

      // Previous month days
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (let i = startOffset - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        calendarDays.push({
          date: '',
          dayOfMonth: day,
          isCurrentMonth: false,
          isToday: false,
          hasTasks: false,
          completedTasks: 0,
          totalTasks: 0,
          status: 'none',
        });
      }

      // Current month days
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toISOString().split('T')[0];
        const isToday = dateStr === todayStr;

        calendarDays.push({
          date: dateStr,
          dayOfMonth: day,
          isCurrentMonth: true,
          isToday,
          hasTasks: false,
          completedTasks: 0,
          totalTasks: 0,
          status: 'none',
        });
      }

      // Next month days to fill grid
      const remainingDays = 42 - calendarDays.length; // 6 rows x 7 days
      for (let day = 1; day <= remainingDays; day++) {
        calendarDays.push({
          date: '',
          dayOfMonth: day,
          isCurrentMonth: false,
          isToday: false,
          hasTasks: false,
          completedTasks: 0,
          totalTasks: 0,
          status: 'none',
        });
      }

      setDays(calendarDays);
    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'missed':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'pending':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-green-600" />;
      case 'in-progress':
        return <Clock className="w-3 h-3 text-yellow-600" />;
      case 'missed':
        return <AlertCircle className="w-3 h-3 text-red-600" />;
      default:
        return null;
    }
  };

  const monthNames = showHindi
    ? ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const dayNames = showHindi
    ? ['सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि', 'रवि']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-saffron-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={showHindi ? 'पिछला महीना' : 'Previous month'}
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 text-sm font-medium text-saffron-600 hover:bg-saffron-50 rounded-lg transition-colors"
          >
            {showHindi ? 'आज' : 'Today'}
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={showHindi ? 'अगला महीना' : 'Next month'}
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {dayNames.map((day) => (
          <div key={day} className="px-2 py-2 text-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {loading
          ? Array.from({ length: 42 }).map((_, i) => (
              <div key={i} className="aspect-square p-1 border-b border-r border-gray-100">
                <div className="animate-pulse bg-gray-200 rounded h-full" />
              </div>
            ))
          : days.map((day, index) => (
              <div
                key={index}
                onClick={() => day.isCurrentMonth && day.date && onDateSelect?.(day.date)}
                className={`
                  aspect-square p-1 border-b border-r border-gray-100 cursor-pointer transition-colors
                  ${!day.isCurrentMonth ? 'bg-gray-50' : ''}
                  ${day.isToday ? 'bg-saffron-50 ring-2 ring-inset ring-saffron-300' : ''}
                  ${day.date === selectedDate ? 'bg-saffron-100' : ''}
                  ${day.isCurrentMonth && day.status !== 'none' ? getStatusColor(day.status) : ''}
                  hover:bg-gray-50
                `}
              >
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${day.isToday ? 'text-saffron-700' : 'text-gray-700'}`}>
                      {day.dayOfMonth}
                    </span>
                    {day.isCurrentMonth && day.status !== 'none' && getStatusIcon(day.status)}
                  </div>
                  {day.isCurrentMonth && day.hasTasks && (
                    <div className="mt-1 flex items-center justify-center gap-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span className="text-[10px] text-gray-500">
                        {day.completedTasks}/{day.totalTasks}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
      </div>

      {/* Legend */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-100 border border-green-300" />
            <span className="text-gray-600">{showHindi ? 'पूर्ण' : 'Complete'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300" />
            <span className="text-gray-600">{showHindi ? 'चालू' : 'In Progress'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
            <span className="text-gray-600">{showHindi ? 'छूटा' : 'Missed'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
            <span className="text-gray-600">{showHindi ? 'बाकी' : 'Pending'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
