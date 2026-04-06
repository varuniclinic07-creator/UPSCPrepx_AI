/**
 * Attempts Step - F1 Smart Onboarding Step 2
 * 
 * User selects their attempt number (1st, 2nd, 3rd, 4th+).
 * Mobile-responsive, bilingual (EN+HI).
 * 
 * Master Prompt v8.0 - Rule 3: SIMPLIFIED_LANGUAGE_PROMPT
 */

'use client';

import React from 'react';

interface AttemptsStepProps {
  selectedAttempt: number | null;
  onSelectAttempt: (attempt: number) => void;
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
}

const attemptOptions = [
  { value: 1, label: '1st Attempt', label_hi: 'पहला प्रयास', icon: '🌟', description: 'Fresh start', description_hi: 'नई शुरुआत' },
  { value: 2, label: '2nd Attempt', label_hi: 'दूसरा प्रयास', icon: '💪', description: 'Learning from experience', description_hi: 'अनुभव से सीखना' },
  { value: 3, label: '3rd Attempt', label_hi: 'तीसरा प्रयास', icon: '🔥', description: 'Determined comeback', description_hi: 'दृढ़ वापसी' },
  { value: 4, label: '4th+ Attempt', label_hi: 'चौथा+ प्रयास', icon: '🏆', description: 'Never give up', description_hi: 'कभी हार न मानें' },
];

export function AttemptsStep({ selectedAttempt, onSelectAttempt, onNext, onBack, canProceed }: AttemptsStepProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          📝 Is this your first attempt?
        </h2>
        <p className="text-gray-600 text-sm">
          यह जानकारी हमें आपकी रणनीति बनाने में मदद करेगी
        </p>
        <p className="text-gray-500 text-xs mt-1">
          (This helps us create your strategy)
        </p>
      </div>

      {/* Attempt Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {attemptOptions.map((option) => {
          const isSelected = selectedAttempt === option.value;

          return (
            <button
              key={option.value}
              onClick={() => onSelectAttempt(option.value)}
              className={`relative p-6 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 text-left ${
                isSelected
                  ? 'border-saffron-500 bg-saffron-50 shadow-lg shadow-saffron-500/30'
                  : 'border-gray-200 bg-white hover:border-saffron-300 hover:shadow-md'
              }`}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              {/* Icon */}
              <div className="text-4xl mb-3">{option.icon}</div>

              {/* Label */}
              <p className={`text-lg font-bold ${isSelected ? 'text-saffron-600' : 'text-gray-800'}`}>
                {option.label}
              </p>
              <p className={`text-sm ${isSelected ? 'text-saffron-500' : 'text-gray-400'}`}>
                {option.label_hi}
              </p>

              {/* Description */}
              <p className={`text-xs mt-3 ${isSelected ? 'text-saffron-600 font-medium' : 'text-gray-500'}`}>
                {option.description}
              </p>
              <p className={`text-xs ${isSelected ? 'text-saffron-400' : 'text-gray-300'}`}>
                {option.description_hi}
              </p>

              {/* Experience Badge */}
              {option.value >= 2 && (
                <div className={`mt-3 px-2 py-1 rounded-full text-xs font-medium inline-block ${
                  isSelected ? 'bg-saffron-100 text-saffron-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  ✓ Previous experience
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Encouragement Message */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-green-800 font-medium mb-1">
          💪 Every attempt makes you stronger!
        </p>
        <p className="text-xs text-green-600">
          हर प्रयास आपको मजबूत बनाता है!
        </p>
        <p className="text-xs text-green-600 mt-2">
          Many successful IAS officers cleared in 2nd or 3rd attempt. Your journey is unique!
        </p>
        <p className="text-xs text-green-500">
          कई सफल IAS अधिकारियों ने 2 या 3 प्रयास में पास किया। आपकी यात्रा अनोखी है!
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 py-4 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all duration-300"
        >
          ← Back
          <span className="block text-sm font-normal">वापस</span>
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`flex-1 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
            canProceed
              ? 'bg-gradient-to-r from-saffron-500 to-orange-600 text-white hover:shadow-lg hover:shadow-saffron-500/50 transform hover:-translate-y-1'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue →
          <span className="block text-sm font-normal">आगे बढ़ें</span>
        </button>
      </div>
    </div>
  );
}
