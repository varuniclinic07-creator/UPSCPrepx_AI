/**
 * Step Indicator Component - F1 Smart Onboarding
 * 
 * Shows progress through 6-step onboarding wizard.
 * Mobile-responsive, bilingual (EN+HI).
 * 
 * Master Prompt v8.0 - Rule 3: SIMPLIFIED_LANGUAGE_PROMPT
 */

'use client';

import React from 'react';

export type OnboardingStep = 
  | 'target'
  | 'attempts'
  | 'professional'
  | 'subject'
  | 'quiz'
  | 'analysis';

interface StepIndicatorProps {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
}

const steps: { id: OnboardingStep; title: string; title_hi: string; icon: string }[] = [
  { id: 'target', title: 'Target Year', title_hi: 'लक्ष्य वर्ष', icon: '🎯' },
  { id: 'attempts', title: 'Attempts', title_hi: 'प्रयास', icon: '📝' },
  { id: 'professional', title: 'Profile', title_hi: 'प्रोफ़ाइल', icon: '👤' },
  { id: 'subject', title: 'Optional', title_hi: 'वैकल्पिक', icon: '📚' },
  { id: 'quiz', title: 'Quiz', title_hi: 'क्विज़', icon: '❓' },
  { id: 'analysis', title: 'Analysis', title_hi: 'विश्लेषण', icon: '📊' },
];

export function StepIndicator({ currentStep, completedSteps }: StepIndicatorProps) {
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="w-full mb-8">
      {/* Progress Bar */}
      <div className="relative mb-4">
        <div className="absolute top-0 left-0 w-full h-2 bg-gray-200 rounded-full" />
        <div
          className="absolute top-0 left-0 h-2 bg-gradient-to-r from-saffron-500 to-orange-600 rounded-full transition-all duration-500"
          style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Step Icons */}
      <div className="flex justify-between items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isUpcoming = index > currentStepIndex;

          return (
            <div
              key={step.id}
              className={`flex flex-col items-center transition-all duration-300 ${
                isCurrent ? 'scale-110' : 'scale-100'
              }`}
            >
              {/* Icon Circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-saffron-500 text-white shadow-lg shadow-saffron-500/50'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? '✓' : step.icon}
              </div>

              {/* Step Title */}
              <div className="mt-2 text-center">
                <p
                  className={`text-xs font-medium transition-colors duration-300 ${
                    isCurrent
                      ? 'text-saffron-600 font-semibold'
                      : isCompleted
                      ? 'text-green-600'
                      : 'text-gray-400'
                  }`}
                >
                  {step.title}
                </p>
                <p
                  className={`text-xs transition-colors duration-300 ${
                    isCurrent
                      ? 'text-saffron-500 font-medium'
                      : isCompleted
                      ? 'text-green-500'
                      : 'text-gray-300'
                  }`}
                >
                  {step.title_hi}
                </p>
              </div>

              {/* Connector Line (except last) */}
              {index < steps.length - 1 && (
                <div className="hidden sm:block absolute top-5 left-0 w-full h-0.5 bg-gray-200 -z-10" />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Text */}
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-saffron-600">Step {currentStepIndex + 1} of {steps.length}</span>
          <span className="mx-2">•</span>
          <span className="text-gray-500">{Math.round(((currentStepIndex + 1) / steps.length) * 100)}% Complete</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          चरण {currentStepIndex + 1} में से {steps.length}
        </p>
      </div>
    </div>
  );
}
