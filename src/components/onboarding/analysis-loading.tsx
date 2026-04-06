/**
 * Analysis Loading Component - F1 Smart Onboarding Step 6
 * 
 * Shows loading state while AI analyzes quiz and generates study plan.
 * Animated, reassuring, bilingual (EN+HI).
 * 
 * Master Prompt v8.0 - Rule 3: SIMPLIFIED_LANGUAGE_PROMPT
 */

'use client';

import React, { useState, useEffect } from 'react';

interface AnalysisLoadingProps {
  isComplete: boolean;
  onComplete: () => void;
}

const loadingSteps = [
  { id: 1, text: 'Analyzing your responses...', text_hi: 'आपके उत्तरों का विश्लेषण...', icon: '🔍', duration: 1500 },
  { id: 2, text: 'Identifying strengths...', text_hi: 'ताकत की पहचान...', icon: '💪', duration: 1500 },
  { id: 3, text: 'Detecting weak areas...', text_hi: 'कमजोर क्षेत्रों का पता लगाना...', icon: '🎯', duration: 1500 },
  { id: 4, text: 'Creating personalized study plan...', text_hi: 'व्यक्तिगत अध्ययन योजना बनाना...', icon: '📋', duration: 2000 },
  { id: 5, text: 'Seeding syllabus progress...', text_hi: 'पाठ्यक्रम प्रगति सेट करना...', icon: '🌱', duration: 1500 },
  { id: 6, text: 'Activating 3-day trial...', text_hi: '3-दिन का ट्रायल सक्रिय करना...', icon: '🎁', duration: 1000 },
];

export function AnalysisLoading({ isComplete, onComplete }: AnalysisLoadingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isComplete) {
      setProgress(100);
      setTimeout(onComplete, 500);
      return;
    }

    const currentStepData = loadingSteps[currentStep];
    if (!currentStepData) return;

    // Update progress based on current step
    const stepProgress = ((currentStep + 1) / loadingSteps.length) * 100;
    setProgress(stepProgress);

    const timer = setTimeout(() => {
      if (currentStep < loadingSteps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }, currentStepData.duration);

    return () => clearTimeout(timer);
  }, [currentStep, isComplete, onComplete]);

  return (
    <div className="w-full max-w-2xl mx-auto text-center">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🤖 AI is analyzing your quiz...
        </h2>
        <p className="text-gray-600 text-sm">
          कृपया प्रतीक्षा करें, हम आपकी व्यक्तिगत अध्ययन योजना बना रहे हैं
        </p>
        <p className="text-gray-500 text-xs mt-1">
          (This will take about 10 seconds)
        </p>
      </div>

      {/* Animated AI Icon */}
      <div className="mb-8">
        <div className="relative w-32 h-32 mx-auto">
          {/* Outer Ring */}
          <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
          
          {/* Spinning Ring */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-saffron-500 border-r-orange-500 animate-spin" />
          
          {/* Inner Icon */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-saffron-50 to-orange-50 flex items-center justify-center">
            <div className="text-5xl animate-pulse">
              {loadingSteps[currentStep]?.icon}
            </div>
          </div>

          {/* Orbiting Dots */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute w-3 h-3 bg-saffron-500 rounded-full animate-ping"
              style={{
                top: '50%',
                left: '50%',
                animationDelay: `${i * 0.3}s`,
                animationDuration: '1.5s',
              }}
            />
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Processing...</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-saffron-500 via-orange-500 to-yellow-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current Step */}
      <div className="bg-white border-2 border-saffron-200 rounded-xl p-6 mb-6 shadow-lg shadow-saffron-500/20">
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="text-3xl">{loadingSteps[currentStep]?.icon}</span>
          <p className="text-lg font-semibold text-saffron-700">
            {loadingSteps[currentStep]?.text}
          </p>
        </div>
        <p className="text-sm text-saffron-500">
          {loadingSteps[currentStep]?.text_hi}
        </p>
      </div>

      {/* All Steps Status */}
      <div className="space-y-2 mb-8">
        {loadingSteps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                isCurrent ? 'bg-saffron-50 scale-105' : ''
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                isCompleted
                  ? 'bg-green-500 text-white'
                  : isCurrent
                  ? 'bg-saffron-500 text-white animate-pulse'
                  : 'bg-gray-200 text-gray-400'
              }`}>
                {isCompleted ? '✓' : step.icon}
              </div>
              <div className="flex-1 text-left">
                <p className={`text-sm ${
                  isCurrent ? 'text-saffron-700 font-medium' : isCompleted ? 'text-green-700' : 'text-gray-400'
                }`}>
                  {step.text}
                </p>
                <p className={`text-xs ${
                  isCurrent ? 'text-saffron-500' : isCompleted ? 'text-green-500' : 'text-gray-300'
                }`}>
                  {step.text_hi}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Encouragement Message */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800 font-medium">
          💡 Your personalized study plan will be ready soon!
        </p>
        <p className="text-xs text-blue-600 mt-1">
          आपकी व्यक्तिगत अध्ययन योजना जल्द ही तैयार हो जाएगी!
        </p>
      </div>
    </div>
  );
}
