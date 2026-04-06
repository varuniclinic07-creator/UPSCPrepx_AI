/**
 * Target Year Step - F1 Smart Onboarding Step 1
 * 
 * User selects their target UPSC exam year.
 * Mobile-responsive, bilingual (EN+HI).
 * 
 * Master Prompt v8.0 - Rule 3: SIMPLIFIED_LANGUAGE_PROMPT
 */

'use client';

import React from 'react';

interface TargetYearStepProps {
  selectedYear: number | null;
  onSelectYear: (year: number) => void;
  onNext: () => void;
  canProceed: boolean;
}

const currentYear = new Date().getFullYear();
const targetYears = [currentYear, currentYear + 1, currentYear + 2, currentYear + 3];

export function TargetYearStep({ selectedYear, onSelectYear, onNext, canProceed }: TargetYearStepProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🎯 When do you plan to take UPSC?
        </h2>
        <p className="text-gray-600 text-sm">
          यह जानकारी हमें आपकी अध्ययन योजना बनाने में मदद करेगी
        </p>
        <p className="text-gray-500 text-xs mt-1">
          (This helps us create your study plan)
        </p>
      </div>

      {/* Year Selection Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {targetYears.map((year) => {
          const isSelected = selectedYear === year;
          const isCurrentYear = year === currentYear;
          const yearsFromNow = year - currentYear;

          return (
            <button
              key={year}
              onClick={() => onSelectYear(year)}
              className={`relative p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
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

              {/* Year */}
              <div className="text-center">
                <p className={`text-3xl font-bold ${isSelected ? 'text-saffron-600' : 'text-gray-800'}`}>
                  {year}
                </p>
                
                {/* Description */}
                <p className={`text-xs mt-2 ${isSelected ? 'text-saffron-600 font-medium' : 'text-gray-500'}`}>
                  {isCurrentYear ? (
                    <>
                      <span className="block">This Year</span>
                      <span className="block text-gray-400">इस वर्ष</span>
                    </>
                  ) : (
                    <>
                      <span className="block">In {yearsFromNow} year{yearsFromNow > 1 ? 's' : ''}</span>
                      <span className="block text-gray-400">{yearsFromNow} वर्ष में</span>
                    </>
                  )}
                </p>

                {/* Intensity Badge */}
                <div className={`mt-3 px-2 py-1 rounded-full text-xs font-medium ${
                  isCurrentYear
                    ? 'bg-red-100 text-red-600'
                    : yearsFromNow === 1
                    ? 'bg-orange-100 text-orange-600'
                    : 'bg-green-100 text-green-600'
                }`}>
                  {isCurrentYear ? (
                    <>
                      <span>Intensive</span>
                      <span className="block text-gray-400">तीव्र</span>
                    </>
                  ) : yearsFromNow === 1 ? (
                    <>
                      <span>Balanced</span>
                      <span className="block text-gray-400">संतुलित</span>
                    </>
                  ) : (
                    <>
                      <span>Relaxed</span>
                      <span className="block text-gray-400">आरामदायक</span>
                    </>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800 font-medium mb-1">
          💡 Tip: Be realistic about your preparation time
        </p>
        <p className="text-xs text-blue-600">
          सलाह: अपनी तैयारी के समय के बारे में वास्तविक रहें
        </p>
        <ul className="text-xs text-blue-600 mt-2 space-y-1">
          <li>• 2026: Need 8-10 hours/day, already familiar with syllabus</li>
          <li>• 2027: Ideal for most aspirants (balanced approach)</li>
          <li>• 2028+: Good for working professionals or beginners</li>
        </ul>
      </div>

      {/* Next Button */}
      <button
        onClick={onNext}
        disabled={!canProceed}
        className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
          canProceed
            ? 'bg-gradient-to-r from-saffron-500 to-orange-600 text-white hover:shadow-lg hover:shadow-saffron-500/50 transform hover:-translate-y-1'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        Continue →
        <span className="block text-sm font-normal mt-1">आगे बढ़ें</span>
      </button>
    </div>
  );
}
