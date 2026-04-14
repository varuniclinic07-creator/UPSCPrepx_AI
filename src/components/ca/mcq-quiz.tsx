/**
 * MCQ Quiz Component
 * 
 * Interactive Multiple Choice Quiz for current affairs articles:
 * - Bilingual questions (EN+HI)
 * - 4 options per question
 * - Instant feedback with explanations
 * - Score tracking
 * - Attempt history
 * - Difficulty badges
 * - Bloom's taxonomy indicators
 * 
 * Master Prompt v8.0 - Feature F2 (READ Mode)
 * Design: Saffron Scholar theme, mobile-first (360px)
 */

'use client';

import React, { useState } from 'react';
import { CheckCircle, XCircle, HelpCircle, BookOpen, Trophy, RotateCcw } from 'lucide-react';

// ============================================================================
// INTERFACES
// ============================================================================

interface MCQOption {
  id: string; // A, B, C, D
  text: {
    en: string;
    hi: string;
  };
}

interface MCQ {
  id: string;
  question: {
    en: string;
    hi: string;
  };
  options: MCQOption[];
  correctAnswer: string; // A, B, C, D
  explanation: {
    en: string;
    hi: string;
  };
  difficulty: 'Easy' | 'Medium' | 'Hard';
  bloomTaxonomy: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
  userAttempt?: {
    selectedAnswer: string;
    isCorrect: boolean;
    attemptedAt: string;
  };
}

interface MCQQuizProps {
  mcqs: MCQ[];
  articleId: string;
  showHindi?: boolean;
  onToggleLanguage?: () => void;
  onSubmit?: (answers: Record<string, string>) => Promise<{ data?: { results: QuizResult[]; score: { correct: number; total: number; percentage: number } } } | void> | void;
}

interface QuizResult {
  mcqId: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: {
    en: string;
    hi: string;
  };
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * Difficulty Badge
 */
function DifficultyBadge({ difficulty }: { difficulty: 'Easy' | 'Medium' | 'Hard' }) {
  const colors = {
    Easy: 'bg-green-100 text-green-800 border-green-300',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Hard: 'bg-red-100 text-red-800 border-red-300',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${colors[difficulty]}`}>
      {difficulty}
    </span>
  );
}

/**
 * Bloom's Taxonomy Badge
 */
function BloomsBadge({ taxonomy }: { taxonomy: string }) {
  return (
    <span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-800 border border-purple-300">
      {taxonomy}
    </span>
  );
}

/**
 * Option Button
 */
interface OptionButtonProps {
  option: MCQOption;
  isSelected: boolean;
  isCorrect: boolean;
  isSubmitted: boolean;
  showHindi?: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

function OptionButton({
  option,
  isSelected,
  isCorrect,
  isSubmitted,
  showHindi = false,
  onSelect,
  disabled = false,
}: OptionButtonProps) {
  const getButtonStyles = () => {
    if (!isSubmitted) {
      if (isSelected) {
        return 'bg-saffron-50 border-saffron-500 ring-2 ring-saffron-200';
      }
      return 'bg-white border-gray-300 hover:bg-gray-50';
    }

    // After submission
    if (isCorrect) {
      return 'bg-green-50 border-green-500 ring-2 ring-green-200';
    }
    if (isSelected && !isCorrect) {
      return 'bg-red-50 border-red-500 ring-2 ring-red-200';
    }
    return 'bg-white border-gray-300 opacity-60';
  };

  const getIcon = () => {
    if (!isSubmitted) return null;
    if (isCorrect) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (isSelected) return <XCircle className="w-5 h-5 text-red-600" />;
    return null;
  };

  return (
    <button
      onClick={onSelect}
      disabled={disabled || isSubmitted}
      className={`
        w-full p-4 text-left rounded-lg border-2 transition-all duration-200
        ${getButtonStyles()}
        ${disabled && !isSubmitted ? 'cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Option Label (A, B, C, D) */}
        <span className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
          ${isSelected || isCorrect ? 'bg-saffron-600 text-white' : 'bg-gray-200 text-gray-700'}
        `}>
          {option.id}
        </span>

        {/* Option Text */}
        <span className="flex-1 text-sm text-gray-900">
          {showHindi && option.text.hi ? option.text.hi : option.text.en}
        </span>

        {/* Icon */}
        {getIcon()}
      </div>
    </button>
  );
}

// ============================================================================
// SINGLE MCQ COMPONENT
// ============================================================================

interface SingleMCQProps {
  mcq: MCQ;
  index: number;
  showHindi?: boolean;
  onSelectAnswer: (mcqId: string, answer: string) => void;
  selectedAnswer?: string;
  isSubmitted: boolean;
  result?: QuizResult;
}

function SingleMCQ({
  mcq,
  index,
  showHindi = false,
  onSelectAnswer,
  selectedAnswer,
  isSubmitted,
  result,
}: SingleMCQProps) {
  const question = showHindi && mcq.question.hi ? mcq.question.hi : mcq.question.en;
  const explanation = showHindi && mcq.explanation.hi ? mcq.explanation.hi : mcq.explanation.en;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 space-y-4">
      {/* Question Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-saffron-600 bg-saffron-50 px-2 py-1 rounded">
            Q{index + 1}
          </span>
          <DifficultyBadge difficulty={mcq.difficulty} />
          <BloomsBadge taxonomy={mcq.bloomTaxonomy} />
        </div>

        <h3 className="text-base md:text-lg font-semibold text-gray-900">
          {question}
        </h3>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {mcq.options.map((option) => (
          <OptionButton
            key={option.id}
            option={option}
            isSelected={selectedAnswer === option.id}
            isCorrect={result?.correctAnswer === option.id}
            isSubmitted={isSubmitted}
            showHindi={showHindi}
            onSelect={() => onSelectAnswer(mcq.id, option.id)}
            disabled={isSubmitted}
          />
        ))}
      </div>

      {/* Explanation (after submission) */}
      {isSubmitted && result && (
        <div className={`
          p-4 rounded-lg border-2
          ${result.isCorrect ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}
        `}>
          <div className="flex items-start gap-2 mb-2">
            {result.isCorrect ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <HelpCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                {result.isCorrect ? 'Correct!' : 'Explanation'}
              </p>
              <p className="text-sm text-gray-700">
                {explanation}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SCORE CARD COMPONENT
// ============================================================================

interface ScoreCardProps {
  correct: number;
  total: number;
  percentage: number;
  onRetry: () => void;
  showHindi?: boolean;
}

function ScoreCard({ correct, total, percentage, onRetry, showHindi = false }: ScoreCardProps) {
  const getScoreMessage = (percentage: number) => {
    if (percentage >= 80) return { text: 'Excellent!', emoji: '🎉', color: 'text-green-600' };
    if (percentage >= 60) return { text: 'Good Job!', emoji: '👍', color: 'text-blue-600' };
    if (percentage >= 40) return { text: 'Keep Practicing', emoji: '📚', color: 'text-yellow-600' };
    return { text: 'Need Improvement', emoji: '💪', color: 'text-red-600' };
  };

  const message = getScoreMessage(percentage);

  return (
    <div className="bg-gradient-to-r from-saffron-500 to-orange-500 rounded-xl p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8" />
          <h3 className="text-xl font-bold">
            {showHindi ? 'आपका स्कोर' : 'Your Score'}
          </h3>
        </div>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-sm font-medium">
            {showHindi ? 'पुनः प्रयास' : 'Retry'}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-3xl font-bold">{correct}</p>
          <p className="text-sm opacity-90">
            {showHindi ? 'सही' : 'Correct'}
          </p>
        </div>
        <div>
          <p className="text-3xl font-bold">{total - correct}</p>
          <p className="text-sm opacity-90">
            {showHindi ? 'गलत' : 'Incorrect'}
          </p>
        </div>
        <div>
          <p className={`text-3xl font-bold ${message.color}`}>
            {percentage}%
          </p>
          <p className="text-sm opacity-90">
            {showHindi ? 'प्रतिशत' : 'Percentage'}
          </p>
        </div>
      </div>

      <div className={`mt-4 text-center text-lg font-semibold ${message.color}`}>
        {message.emoji} {message.text}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MCQQuiz({
  mcqs,
  articleId,
  showHindi = false,
  onToggleLanguage,
  onSubmit,
}: MCQQuizProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [score, setScore] = useState<{ correct: number; total: number; percentage: number } | null>(null);

  // Check if user has previous attempts
  const hasPreviousAttempt = mcqs.some(mcq => mcq.userAttempt);

  // Handle answer selection
  const handleSelectAnswer = (mcqId: string, answer: string) => {
    if (isSubmitted) return;

    setAnswers(prev => ({
      ...prev,
      [mcqId]: answer,
    }));
  };

  // Handle submission
  const handleSubmit = async () => {
    if (Object.keys(answers).length !== mcqs.length) {
      alert(showHindi ? 'कृपया सभी प्रश्नों के उत्तर दें' : 'Please answer all questions');
      return;
    }

    if (onSubmit) {
      const response = await onSubmit(answers);

      if (response && typeof response === 'object' && 'data' in response && response.data) {
        setResults(response.data.results);
        setScore(response.data.score);
      }
    }

    setIsSubmitted(true);
  };

  // Handle retry
  const handleRetry = () => {
    setAnswers({});
    setIsSubmitted(false);
    setResults([]);
    setScore(null);
  };

  // Calculate progress
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / mcqs.length) * 100;

  if (mcqs.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          {showHindi ? 'कोई MCQ उपलब्ध नहीं' : 'No MCQs Available'}
        </h3>
        <p className="text-gray-600">
          {showHindi ? 'इस लेख के लिए MCQ अभी तक नहीं बनाए गए हैं' : 'MCQs for this article have not been created yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {showHindi ? 'क्विज़' : 'Quiz'}
          </h2>
          <p className="text-sm text-gray-600">
            {mcqs.length} {showHindi ? 'प्रश्न' : 'questions'}
          </p>
        </div>

        {onToggleLanguage && (
          <button
            onClick={onToggleLanguage}
            className="text-sm px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            {showHindi ? 'English' : 'हिंदी'}
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {!isSubmitted && (
        <div className="bg-gray-200 rounded-full h-2">
          <div
            className="bg-saffron-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Previous Attempt Info */}
      {hasPreviousAttempt && !isSubmitted && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            {showHindi 
              ? 'आपने पहले यह क्विज़ हल किया है। आप फिर से प्रयास कर सकते हैं!' 
              : 'You have attempted this quiz before. You can retry!'}
          </p>
        </div>
      )}

      {/* Score Card (after submission) */}
      {isSubmitted && score && (
        <ScoreCard
          correct={score.correct}
          total={score.total}
          percentage={score.percentage}
          onRetry={handleRetry}
          showHindi={showHindi}
        />
      )}

      {/* MCQs */}
      <div className="space-y-4">
        {mcqs.map((mcq, index) => {
          const result = results.find(r => r.mcqId === mcq.id);
          
          return (
            <SingleMCQ
              key={mcq.id}
              mcq={mcq}
              index={index}
              showHindi={showHindi}
              onSelectAnswer={handleSelectAnswer}
              selectedAnswer={answers[mcq.id]}
              isSubmitted={isSubmitted}
              result={result}
            />
          );
        })}
      </div>

      {/* Submit Button */}
      {!isSubmitted && (
        <button
          onClick={handleSubmit}
          disabled={answeredCount !== mcqs.length}
          className={`
            w-full py-4 rounded-xl font-bold text-lg transition-all duration-200
            ${
              answeredCount === mcqs.length
                ? 'bg-saffron-600 text-white hover:bg-saffron-700 shadow-lg hover:shadow-xl'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {showHindi ? 'उत्तर जमा करें' : 'Submit Answers'}
        </button>
      )}
    </div>
  );
}

export default MCQQuiz;
