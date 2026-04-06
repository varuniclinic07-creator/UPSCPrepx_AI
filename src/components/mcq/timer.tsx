/**
 * MCQ Timer Component
 * 
 * Master Prompt v8.0 - Feature F7 (READ Mode)
 * - Countdown timer display
 * - Color warnings (green >50%, yellow 25-50%, red <25%)
 * - Pause/Resume controls
 * - Auto-submit on timeout
 * - Time elapsed display
 * - Bilingual support
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Pause, Play, AlertTriangle } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface TimerProps {
  totalTimeSec: number;
  isRunning: boolean;
  showHindi: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onTimeout?: () => void;
  onTimeUpdate?: (timeRemaining: number) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const WARNING_THRESHOLD = 0.25; // 25% time remaining
const CAUTION_THRESHOLD = 0.5; // 50% time remaining

// ============================================================================
// COMPONENT
// ============================================================================

export function Timer({
  totalTimeSec,
  isRunning,
  showHindi,
  onPause,
  onResume,
  onTimeout,
  onTimeUpdate,
}: TimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(totalTimeSec);
  const [isPaused, setIsPaused] = useState(!isRunning);

  // Calculate percentage remaining
  const percentageRemaining = timeRemaining / totalTimeSec;

  // Determine color based on time remaining
  const getTimerColor = () => {
    if (percentageRemaining <= WARNING_THRESHOLD) {
      return 'text-red-600 bg-red-50 border-red-300';
    }
    if (percentageRemaining <= CAUTION_THRESHOLD) {
      return 'text-yellow-600 bg-yellow-50 border-yellow-300';
    }
    return 'text-green-600 bg-green-50 border-green-300';
  };

  const getIconColor = () => {
    if (percentageRemaining <= WARNING_THRESHOLD) {
      return 'text-red-600';
    }
    if (percentageRemaining <= CAUTION_THRESHOLD) {
      return 'text-yellow-600';
    }
    return 'text-green-600';
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && !isPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          
          // Notify parent of time update
          if (onTimeUpdate) {
            onTimeUpdate(newTime);
          }

          // Handle timeout
          if (newTime <= 0 && onTimeout) {
            onTimeout();
            return 0;
          }

          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, isPaused, timeRemaining, onTimeUpdate, onTimeout]);

  // Sync with parent isRunning prop
  useEffect(() => {
    setIsPaused(!isRunning);
  }, [isRunning]);

  // Handle pause/resume toggle
  const handleTogglePause = () => {
    if (isPaused) {
      setIsPaused(false);
      if (onResume) {
        onResume();
      }
    } else {
      setIsPaused(true);
      if (onPause) {
        onPause();
      }
    }
  };

  // Calculate elapsed time
  const elapsedTime = totalTimeSec - timeRemaining;
  const elapsedPercentage = (elapsedTime / totalTimeSec) * 100;

  return (
    <div className={`rounded-xl border-2 p-4 transition-colors duration-300 ${getTimerColor()}`}>
      {/* Timer Display */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {percentageRemaining <= WARNING_THRESHOLD && (
            <AlertTriangle className={`w-5 h-5 ${getIconColor()}`} />
          )}
          <Clock className={`w-5 h-5 ${getIconColor()}`} />
          <span className="text-sm font-medium">
            {showHindi ? 'समय शेष' : 'Time Remaining'}
          </span>
        </div>

        {/* Pause/Resume Button */}
        {onPause && onResume && (
          <button
            onClick={handleTogglePause}
            className="p-2 rounded-lg bg-white hover:bg-gray-50 transition-colors shadow-sm"
          >
            {isPaused ? (
              <Play className="w-4 h-4 text-gray-700" />
            ) : (
              <Pause className="w-4 h-4 text-gray-700" />
            )}
          </button>
        )}
      </div>

      {/* Time Display */}
      <div className="text-center mb-3">
        <span className="text-4xl md:text-5xl font-bold font-mono">
          {formatTime(timeRemaining)}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-white rounded-full overflow-hidden mb-2">
        <div
          className={`h-full transition-all duration-1000 ${
            percentageRemaining <= WARNING_THRESHOLD
              ? 'bg-red-500'
              : percentageRemaining <= CAUTION_THRESHOLD
              ? 'bg-yellow-500'
              : 'bg-green-500'
          }`}
          style={{ width: `${percentageRemaining * 100}%` }}
        />
      </div>

      {/* Time Elapsed */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">
          {showHindi ? 'बीता समय' : 'Elapsed'}: {formatTime(elapsedTime)}
        </span>
        <span className="text-gray-600">
          {Math.round(elapsedPercentage)}% / {Math.round(percentageRemaining * 100)}%
        </span>
      </div>

      {/* Warning Message */}
      {percentageRemaining <= WARNING_THRESHOLD && (
        <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded-lg">
          <p className="text-xs text-red-700 font-medium text-center">
            {showHindi
              ? '⚠️ सावधान! समय बहुत कम है'
              : '⚠️ Warning! Very little time left'}
          </p>
        </div>
      )}

      {/* Keyboard Shortcut */}
      {!isPaused && (
        <p className="mt-2 text-xs text-center text-gray-500">
          {showHindi ? 'विराम: Space दबाएं' : 'Pause: Press Space'}
        </p>
      )}
    </div>
  );
}
