/**
 * Professional Step - F1 Smart Onboarding Step 3
 * 
 * User indicates if they're a working professional and selects daily study hours.
 * Mobile-responsive, bilingual (EN+HI).
 * 
 * Master Prompt v8.0 - Rule 3: SIMPLIFIED_LANGUAGE_PROMPT
 */

'use client';

import React, { useState } from 'react';

interface ProfessionalStepProps {
  isWorkingProfessional: boolean | null;
  studyHoursPerDay: number;
  onToggleProfessional: (value: boolean) => void;
  onStudyHoursChange: (hours: number) => void;
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
}

const studyHourOptions = [
  { hours: 2, label: '2 hours', label_hi: '2 घंटे', intensity: 'Low', intensity_hi: 'कम', color: 'green' },
  { hours: 4, label: '4 hours', label_hi: '4 घंटे', intensity: 'Medium', intensity_hi: 'मध्यम', color: 'yellow' },
  { hours: 6, label: '6 hours', label_hi: '6 घंटे', intensity: 'Good', intensity_hi: 'अच्छा', color: 'orange' },
  { hours: 8, label: '8 hours', label_hi: '8 घंटे', intensity: 'Excellent', intensity_hi: 'उत्कृष्ट', color: 'saffron' },
  { hours: 10, label: '10 hours', label_hi: '10 घंटे', intensity: 'Intensive', intensity_hi: 'तीव्र', color: 'red' },
  { hours: 12, label: '12 hours', label_hi: '12 घंटे', intensity: 'Extreme', intensity_hi: 'चरम', color: 'purple' },
];

export function ProfessionalStep({
  isWorkingProfessional,
  studyHoursPerDay,
  onToggleProfessional,
  onStudyHoursChange,
  onNext,
  onBack,
  canProceed,
}: ProfessionalStepProps) {
  const maxHours = isWorkingProfessional ? 6 : 12;
  const recommendedHours = isWorkingProfessional ? 4 : 8;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          👤 Are you a working professional?
        </h2>
        <p className="text-gray-600 text-sm">
          यह जानकारी हमें आपकी दैनिक योजना बनाने में मदद करेगी
        </p>
        <p className="text-gray-500 text-xs mt-1">
          (This helps us create your daily schedule)
        </p>
      </div>

      {/* Working Professional Toggle */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">💼</div>
            <div>
              <p className="font-semibold text-gray-800">Working Professional</p>
              <p className="text-sm text-gray-500">नौकरीपेशा</p>
            </div>
          </div>
          <button
            onClick={() => onToggleProfessional(!isWorkingProfessional)}
            className={`relative w-16 h-8 rounded-full transition-colors duration-300 ${
              isWorkingProfessional ? 'bg-saffron-500' : 'bg-gray-300'
            }`}
          >
            <div
              className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                isWorkingProfessional ? 'translate-x-9' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        
        {isWorkingProfessional && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">
              💡 Tip: Many IAS toppers were working professionals! Study smart, not just hard.
            </p>
            <p className="text-xs text-blue-600 mt-1">
              सलाह: कई IAS टॉपर्स नौकरीपेशा थे! कड़ी मेहनत के साथ-साथ स्मार्ट स्टडी करें।
            </p>
          </div>
        )}
      </div>

      {/* Study Hours Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
          📚 How many hours can you study daily?
        </h3>
        <p className="text-sm text-gray-500 text-center mb-4">
          रोजाना कितने घंटे अध्ययन कर सकते हैं?
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {studyHourOptions
            .filter(opt => opt.hours <= maxHours)
            .map((option) => {
              const isSelected = studyHoursPerDay === option.hours;
              const isRecommended = option.hours === recommendedHours;

              return (
                <button
                  key={option.hours}
                  onClick={() => onStudyHoursChange(option.hours)}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                    isSelected
                      ? `border-${option.color}-500 bg-${option.color}-50 shadow-lg`
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {isRecommended && !isSelected && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full font-medium">
                      Recommended
                    </div>
                  )}
                  
                  <p className={`text-2xl font-bold ${isSelected ? `text-${option.color}-600` : 'text-gray-800'}`}>
                    {option.hours}
                  </p>
                  <p className={`text-sm ${isSelected ? `text-${option.color}-600` : 'text-gray-500'}`}>
                    {option.label_hi}
                  </p>
                  <p className={`text-xs mt-2 ${isSelected ? `text-${option.color}-500` : 'text-gray-400'}`}>
                    {option.intensity}
                  </p>
                  <p className={`text-xs ${isSelected ? `text-${option.color}-400` : 'text-gray-300'}`}>
                    {option.intensity_hi}
                  </p>
                </button>
              );
            })}
        </div>

        {/* Study Hours Info */}
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>Recommended:</strong> {isWorkingProfessional ? '4-6 hours on weekdays, 8-10 hours on weekends' : '8-10 hours daily for serious preparation'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {isWorkingProfessional ? 'सप्ताह के दिनों में 4-6 घंटे, सप्ताहांत में 8-10 घंटे' : 'गंभीर तैयारी के लिए रोज 8-10 घंटे'}
          </p>
        </div>
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
