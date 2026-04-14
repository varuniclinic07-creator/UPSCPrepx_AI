/**
 * Optional Subject Step - F1 Smart Onboarding Step 4
 * 
 * User selects their UPSC optional subject from 48 UPSC-approved subjects.
 * Mobile-responsive, bilingual (EN+HI), with search functionality.
 * 
 * Master Prompt v8.0 - Rule 3: SIMPLIFIED_LANGUAGE_PROMPT
 */

'use client';

import React, { useState, useMemo } from 'react';

interface OptionalSubjectStepProps {
  selectedSubject: string | null;
  onSelectSubject: (subject: string) => void;
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
}

// All 48 UPSC Optional Subjects (Grouped by category)
const OPTIONAL_SUBJECTS = {
  'Engineering & Science': [
    'Agriculture',
    'Animal Husbandry and Veterinary Science',
    'Botany',
    'Chemistry',
    'Civil Engineering',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Geology',
    'Mathematics',
    'Medical Science',
    'Physics',
    'Statistics',
    'Zoology',
  ],
  'Humanities & Social Sciences': [
    'Anthropology',
    'Economics',
    'Geography',
    'History',
    'Law',
    'Management',
    'Philosophy',
    'Political Science and International Relations',
    'Psychology',
    'Public Administration',
    'Sociology',
  ],
  'Literature (Indian Languages)': [
    'Assamese',
    'Bodo',
    'Dogri',
    'Gujarati',
    'Hindi',
    'Kannada',
    'Kashmiri',
    'Konkani',
    'Maithili',
    'Malayalam',
    'Manipuri',
    'Marathi',
    'Nepali',
    'Odia',
    'Punjabi',
    'Sanskrit',
    'Santhali',
    'Sindhi',
    'Tamil',
    'Telugu',
    'Urdu',
    'English',
  ],
};

const POPULAR_SUBJECTS = [
  { subject: 'Public Administration', reason: 'High success rate, overlapping with GS2', reason_hi: 'उच्च सफलता दर, GS2 के साथ ओवरलैप' },
  { subject: 'Geography', reason: 'Scientific, overlapping with GS1', reason_hi: 'वैज्ञानिक, GS1 के साथ ओवरलैप' },
  { subject: 'Sociology', reason: 'Easy to understand, short syllabus', reason_hi: 'समझने में आसान, छोटा पाठ्यक्रम' },
  { subject: 'Anthropology', reason: 'Scientific, scoring subject', reason_hi: 'वैज्ञानिक, स्कोरिंग विषय' },
  { subject: 'History', reason: 'Interesting, overlapping with GS1', reason_hi: 'दिलचस्प, GS1 के साथ ओवरलैप' },
];

export function OptionalSubjectStep({
  selectedSubject,
  onSelectSubject,
  onNext,
  onBack,
  canProceed,
}: OptionalSubjectStepProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Humanities & Social Sciences');

  // Filter subjects based on search
  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return OPTIONAL_SUBJECTS;
    
    const query = searchQuery.toLowerCase();
    const filtered: Record<string, string[]> = {};

    Object.entries(OPTIONAL_SUBJECTS).forEach(([category, subjects]) => {
      const matching = subjects.filter(s => s.toLowerCase().includes(query));
      if (matching.length > 0) {
        filtered[category] = matching;
      }
    });
    
    return filtered;
  }, [searchQuery]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          📚 What is your optional subject?
        </h2>
        <p className="text-gray-600 text-sm">
          यह जानकारी हमें आपकी विषय-वार योजना बनाने में मदद करेगी
        </p>
        <p className="text-gray-500 text-xs mt-1">
          (This helps us create your subject-wise plan)
        </p>
      </div>

      {/* Popular Subjects (Quick Select) */}
      {!searchQuery && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>⭐</span> Popular Optional Subjects
            <span className="text-gray-400 font-normal">(लोकप्रिय वैकल्पिक विषय)</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {POPULAR_SUBJECTS.map(({ subject, reason, reason_hi }) => (
              <button
                key={subject}
                onClick={() => onSelectSubject(subject)}
                className={`p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                  selectedSubject === subject
                    ? 'border-saffron-500 bg-saffron-50 shadow-lg shadow-saffron-500/30'
                    : 'border-gray-200 bg-white hover:border-saffron-300'
                }`}
              >
                <p className={`font-semibold ${selectedSubject === subject ? 'text-saffron-600' : 'text-gray-800'}`}>
                  {subject}
                </p>
                <p className={`text-xs mt-1 ${selectedSubject === subject ? 'text-saffron-600' : 'text-gray-500'}`}>
                  {reason}
                </p>
                <p className={`text-xs ${selectedSubject === subject ? 'text-saffron-400' : 'text-gray-300'}`}>
                  {reason_hi}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search optional subjects... / वैकल्पिक विषय खोजें..."
            className="w-full px-4 py-3 pl-10 border-2 border-gray-200 rounded-xl focus:border-saffron-500 focus:outline-none transition-colors"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Subject Categories */}
      <div className="mb-8 space-y-4">
        {Object.entries(filteredSubjects).map(([category, subjects]) => {
          const isExpanded = expandedCategory === category;
          const isSelectedInCategory = subjects.includes(selectedSubject || '');

          return (
            <div
              key={category}
              className={`border-2 rounded-xl overflow-hidden transition-all duration-300 ${
                isSelectedInCategory ? 'border-saffron-300' : 'border-gray-200'
              }`}
            >
              {/* Category Header */}
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category)}
                className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <span className="font-semibold text-gray-700">{category}</span>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Subject List */}
              {isExpanded && (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white">
                  {subjects.map((subject) => {
                    const isSelected = selectedSubject === subject;

                    return (
                      <button
                        key={subject}
                        onClick={() => onSelectSubject(subject)}
                        className={`px-4 py-2 rounded-lg text-left text-sm transition-all duration-200 ${
                          isSelected
                            ? 'bg-saffron-500 text-white shadow-md'
                            : 'bg-gray-50 text-gray-700 hover:bg-saffron-50 hover:text-saffron-600'
                        }`}
                      >
                        {isSelected && (
                          <span className="mr-2">✓</span>
                        )}
                        {subject}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Subject Display */}
      {selectedSubject && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-sm text-green-700 font-medium mb-1">
            ✓ Selected Optional Subject
          </p>
          <p className="text-lg font-bold text-green-800">
            {selectedSubject}
          </p>
          <button
            onClick={() => onSelectSubject('')}
            className="text-xs text-green-600 hover:text-green-800 mt-2 underline"
          >
            Change subject / विषय बदलें
          </button>
        </div>
      )}

      {/* Help Text */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700 font-medium mb-2">
          💡 How to choose your optional subject?
        </p>
        <ul className="text-xs text-blue-600 space-y-1">
          <li>• Choose a subject you studied in graduation (if possible)</li>
          <li>• Consider overlap with General Studies papers</li>
          <li>• Check availability of study material</li>
          <li>• Look at past years' success rates</li>
        </ul>
        <p className="text-xs text-blue-500 mt-2">
          सलाह: वह विषय चुनें जो आपने स्नातक में पढ़ा हो, GS के साथ ओवरलैप हो, और अध्ययन सामग्री उपलब्ध हो।
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
