/**
 * MCQ Option List Component
 * 
 * Master Prompt v8.0 - Feature F7 (READ Mode)
 * - Answer option display with selection
 * - Confidence marking (Sure/Not Sure)
 * - Keyboard shortcuts (1-4, A-D)
 * - Visual feedback on selection
 * - Bilingual support
 */

'use client';

import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface Option {
  id: string;
  text: {
    en: string;
    hi: string;
  };
  isCorrect?: boolean;
}

interface OptionListProps {
  options: Option[];
  selectedOption?: number;
  showCorrect?: boolean;
  showHindi: boolean;
  onOptionSelect: (optionNumber: number) => void;
  disabled?: boolean;
  confidence?: 'sure' | 'not-sure';
  onConfidenceChange?: (confidence: 'sure' | 'not-sure') => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const CONFIDENCE_COLORS = {
  sure: 'bg-green-100 text-green-800 border-green-300',
  'not-sure': 'bg-yellow-100 text-yellow-800 border-yellow-300',
};

// ============================================================================
// COMPONENT
// ============================================================================

export function OptionList({
  options,
  selectedOption,
  showCorrect = false,
  showHindi,
  onOptionSelect,
  disabled = false,
  confidence,
  onConfidenceChange,
}: OptionListProps) {
  const getOptionStatus = (index: number) => {
    if (!showCorrect) return 'neutral';
    if (options[index].isCorrect) return 'correct';
    if (selectedOption === index + 1 && !options[index].isCorrect) return 'incorrect';
    return 'neutral';
  };

  const getOptionClasses = (index: number) => {
    const status = getOptionStatus(index);
    const isSelected = selectedOption === index + 1;

    const baseClasses =
      'w-full text-left p-3 md:p-4 rounded-lg border-2 transition-all duration-200 flex items-start gap-3';

    if (showCorrect) {
      if (status === 'correct') {
        return `${baseClasses} border-green-500 bg-green-50`;
      }
      if (status === 'incorrect') {
        return `${baseClasses} border-red-500 bg-red-50`;
      }
    }

    if (isSelected) {
      return `${baseClasses} border-saffron-500 bg-saffron-50 shadow-md`;
    }

    if (disabled) {
      return `${baseClasses} border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed`;
    }

    return `${baseClasses} border-gray-200 hover:border-saffron-300 hover:bg-saffron-50/30 cursor-pointer`;
  };

  const getOptionLabelClasses = (index: number) => {
    const status = getOptionStatus(index);
    const isSelected = selectedOption === index + 1;

    if (showCorrect && status === 'correct') {
      return 'w-6 h-6 rounded-full flex items-center justify-center bg-green-500 text-white';
    }

    if (showCorrect && status === 'incorrect') {
      return 'w-6 h-6 rounded-full flex items-center justify-center bg-red-500 text-white';
    }

    if (isSelected) {
      return 'w-6 h-6 rounded-full flex items-center justify-center bg-saffron-500 text-white font-bold';
    }

    return 'w-6 h-6 rounded-full flex items-center justify-center bg-gray-200 text-gray-600 font-bold';
  };

  const getOptionText = (option: Option) => (showHindi ? option.text.hi : option.text.en);

  return (
    <div className="space-y-3">
      {/* Options */}
      <div className="space-y-2">
        {options.map((option, index) => (
          <button
            key={option.id}
            onClick={() => !disabled && onOptionSelect(index + 1)}
            className={getOptionClasses(index)}
            disabled={disabled}
          >
            {/* Option Label */}
            <span className={getOptionLabelClasses(index)}>
              {showCorrect && getOptionStatus(index) === 'correct' ? (
                <CheckCircle className="w-4 h-4" />
              ) : showCorrect && getOptionStatus(index) === 'incorrect' ? (
                <XCircle className="w-4 h-4" />
              ) : (
                OPTION_LABELS[index]
              )}
            </span>

            {/* Option Text */}
            <span className="text-gray-900 flex-1 text-sm md:text-base leading-relaxed">
              {getOptionText(option)}
            </span>
          </button>
        ))}
      </div>

      {/* Confidence Marker */}
      {onConfidenceChange && selectedOption && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">
            {showHindi ? 'आपको कितना यकीन है?' : 'How confident are you?'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onConfidenceChange('sure')}
              className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                confidence === 'sure'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
              }`}
            >
              {showHindi ? 'पक्का' : 'Sure'}
            </button>
            <button
              onClick={() => onConfidenceChange('not-sure')}
              className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                confidence === 'not-sure'
                  ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                  : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
              }`}
            >
              {showHindi ? 'सुनिश्चित नहीं' : 'Not Sure'}
            </button>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts */}
      {!disabled && (
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500">
            {showHindi
              ? 'कीबोर्ड: 1-4 या A-D (विकल्प चुनें)'
              : 'Keyboard: 1-4 or A-D (select option)'}
          </p>
        </div>
      )}
    </div>
  );
}
