/**
 * Quiz Step - F1 Smart Onboarding Step 5
 * 
 * 10-question diagnostic quiz with bilingual support (EN+HI).
 * Mobile-responsive, with timer and progress tracking.
 * 
 * Master Prompt v8.0 - Rule 3: SIMPLIFIED_LANGUAGE_PROMPT
 */

'use client';

import React, { useState, useEffect } from 'react';

export interface QuizQuestion {
  id: string;
  question_text: string;
  question_text_hi: string;
  options: string[];
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface QuizStepProps {
  questions: QuizQuestion[];
  answers: Array<{ question_id: string; selected_option: string; time_spent_sec: number }>;
  onAnswerChange: (answers: Array<{ question_id: string; selected_option: string; time_spent_sec: number }>) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function QuizStep({ questions, answers, onAnswerChange, onSubmit, isLoading }: QuizStepProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [startTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Calculate time spent on current question
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOptionSelect = (option: string) => {
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = {
      question_id: currentQuestion.id,
      selected_option: option,
      time_spent_sec: timeSpent,
    };
    onAnswerChange(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setQuestionStartTime(Date.now());
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setQuestionStartTime(Date.now());
    }
  };

  const handleSubmit = () => {
    onSubmit();
  };

  const canProceed = currentAnswer?.selected_option !== undefined;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // Get subject color
  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      GS1: 'blue',
      GS2: 'green',
      GS3: 'orange',
      GS4: 'purple',
      CSAT: 'red',
    };
    return colors[subject] || 'gray';
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Quiz Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          ❓ Diagnostic Quiz
        </h2>
        <p className="text-gray-600 text-sm">
          Answer all 10 questions to create your personalized study plan
        </p>
        <p className="text-gray-500 text-xs mt-1">
          अपने व्यक्तिगत अध्ययन योजना के लिए सभी 10 प्रश्नों के उत्तर दें
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-saffron-500 to-orange-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
        {/* Subject Badge */}
        <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 bg-${getSubjectColor(currentQuestion.subject)}-100 text-${getSubjectColor(currentQuestion.subject)}-700`}>
          {currentQuestion.subject} • {currentQuestion.topic}
        </div>

        {/* Question Text */}
        <div className="mb-6">
          <p className="text-lg font-semibold text-gray-800 mb-2">
            {currentQuestion.question_text}
          </p>
          <p className="text-base text-gray-600">
            {currentQuestion.question_text_hi}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
            const isSelected = currentAnswer?.selected_option === optionLabel;

            return (
              <button
                key={optionLabel}
                onClick={() => handleOptionSelect(optionLabel)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                  isSelected
                    ? 'border-saffron-500 bg-saffron-50 shadow-lg shadow-saffron-500/30'
                    : 'border-gray-200 bg-gray-50 hover:border-saffron-300 hover:bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    isSelected
                      ? 'bg-saffron-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {optionLabel}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${isSelected ? 'text-saffron-800' : 'text-gray-700'}`}>
                      {option}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Spent */}
      <div className="text-center mb-6">
        <p className="text-xs text-gray-500">
          Time spent on this question: <span className="font-medium text-gray-700">
            {Math.floor((currentTime - questionStartTime) / 1000)}s
          </span>
        </p>
        <p className="text-xs text-gray-400">
          इस प्रश्न पर बिताया समय: <span className="font-medium text-gray-600">
            {Math.floor((currentTime - questionStartTime) / 1000)} सेकंड
          </span>
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className={`flex-1 py-4 rounded-xl font-semibold transition-all duration-300 ${
            currentQuestionIndex > 0
              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              : 'bg-gray-50 text-gray-300 cursor-not-allowed'
          }`}
        >
          ← Previous
          <span className="block text-sm font-normal">पिछला</span>
        </button>
        
        {isLastQuestion ? (
          <button
            onClick={handleSubmit}
            disabled={!canProceed || isLoading}
            className={`flex-1 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
              canProceed && !isLoading
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/50 transform hover:-translate-y-1'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Submitting...' : 'Submit Quiz'}
            <span className="block text-sm font-normal">
              {isLoading ? 'जमा कर रहे हैं...' : 'क्विज़ जमा करें'}
            </span>
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={`flex-1 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
              canProceed
                ? 'bg-gradient-to-r from-saffron-500 to-orange-600 text-white hover:shadow-lg hover:shadow-saffron-500/50 transform hover:-translate-y-1'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Next →
            <span className="block text-sm font-normal">आगे</span>
          </button>
        )}
      </div>

      {/* Question Navigator */}
      <div className="mt-8">
        <p className="text-xs text-gray-500 text-center mb-3">
          Quick navigation / त्वरित नेविगेशन
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {questions.map((_, index) => {
            const isAnswered = answers[index]?.selected_option !== undefined;
            const isCurrent = index === currentQuestionIndex;

            return (
              <button
                key={index}
                onClick={() => {
                  setCurrentQuestionIndex(index);
                  setQuestionStartTime(Date.now());
                }}
                className={`w-8 h-8 rounded-full text-xs font-medium transition-all duration-200 ${
                  isCurrent
                    ? 'bg-saffron-500 text-white scale-110'
                    : isAnswered
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                }`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
