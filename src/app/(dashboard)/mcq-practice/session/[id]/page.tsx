/**
 * MCQ Practice Session Page
 * 
 * Master Prompt v8.0 - Feature F7 (READ Mode)
 * - Active practice session
 * - Question navigation
 * - Timer management
 * - Answer submission
 * - Explanation display
 * - Bilingual support
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QuestionCard } from '@/components/mcq/question-card';
import { OptionList } from '@/components/mcq/option-list';
import { Timer } from '@/components/mcq/timer';
import { ExplanationCard } from '@/components/mcq/explanation-card';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface Question {
  id: string;
  questionNumber: number;
  questionText: { en: string; hi: string };
  options: Array<{ id: string; text: { en: string; hi: string } }>;
  subject: string;
  topic?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeEstimateSec: number;
  marks: number;
  negativeMarks: number;
  isPyy?: boolean;
  year?: number;
}

interface Explanation {
  correctOption: number;
  explanation: { en: string; hi: string };
  keyPoints: Array<{ en: string; hi: string }>;
  relatedConcepts?: string[];
  sources?: Array<{ title: string; url: string }>;
}

interface SessionData {
  sessionId: string;
  mode: 'practice' | 'adaptive' | 'pyq';
  subject?: string;
  totalQuestions: number;
  timeLimitSec: number;
  questions: Question[];
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function PracticeSessionPage() {
  const params = useParams();
  const router = useRouter();
  const [showHindi, setShowHindi] = useState(false);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  const [explanations, setExplanations] = useState<Record<number, Explanation>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Fetch session data
  useEffect(() => {
    fetchSessionData();
  }, [params.id]);

  const fetchSessionData = async () => {
    try {
      const response = await fetch(`/api/mcq/practice/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: params.id }),
      });
      const data = await response.json();
      
      if (data.success) {
        setSession(data.data);
        setTimeRemaining(data.data.timeLimitSec);
        setIsTimerRunning(true);
      }
    } catch (error) {
      console.error('Failed to fetch session:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle option selection
  const handleOptionSelect = useCallback((optionNumber: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optionNumber,
    }));
  }, [currentQuestionIndex]);

  // Handle navigation
  const handleNext = useCallback(() => {
    if (currentQuestionIndex < (session?.totalQuestions || 1) - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  }, [currentQuestionIndex, session?.totalQuestions]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }, [currentQuestionIndex]);

  // Handle mark for review
  const handleMarkForReview = useCallback(() => {
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(currentQuestionIndex)) {
        next.delete(currentQuestionIndex);
      } else {
        next.add(currentQuestionIndex);
      }
      return next;
    });
  }, [currentQuestionIndex]);

  // Handle timeout
  const handleTimeout = useCallback(() => {
    handleSubmit();
  }, []);

  // Handle submit
  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/mcq/practice/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: params.id,
          answers: Object.entries(answers).map(([q, a]) => ({
            questionId: session?.questions[parseInt(q)]?.id,
            selectedOption: a,
          })),
          timeSpent: timeRemaining,
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        setSubmitted(true);
        setExplanations(data.data.explanations);
        setIsTimerRunning(false);
      }
    } catch (error) {
      console.error('Failed to submit:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron-600 mx-auto mb-4" />
          <p className="text-gray-600">
            {showHindi ? 'लोड हो रहा है...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            {showHindi ? 'सत्र नहीं मिला' : 'Session not found'}
          </p>
          <Link
            href="/mcq-practice"
            className="px-4 py-2 bg-saffron-600 text-white rounded-lg hover:bg-saffron-700"
          >
            {showHindi ? 'वापस जाएं' : 'Go Back'}
          </Link>
        </div>
      </div>
    );
  }

  const currentQuestion = session.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === session.totalQuestions - 1;
  const explanation = explanations[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link
              href="/mcq-practice"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">
                {showHindi ? 'वापस' : 'Back'}
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {showHindi ? `प्रश्न ${currentQuestionIndex + 1}/${session.totalQuestions}` : `Question ${currentQuestionIndex + 1}/${session.totalQuestions}`}
              </span>
              <button
                onClick={() => setShowHindi(!showHindi)}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                {showHindi ? 'English' : 'हिंदी'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Timer */}
        {!submitted && (
          <Timer
            totalTimeSec={session.timeLimitSec}
            isRunning={isTimerRunning}
            showHindi={showHindi}
            onPause={() => setIsTimerRunning(false)}
            onResume={() => setIsTimerRunning(true)}
            onTimeout={handleTimeout}
            onTimeUpdate={setTimeRemaining}
          />
        )}

        {/* Question Card */}
        {!submitted ? (
          <QuestionCard
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={session.totalQuestions}
            selectedOption={answers[currentQuestionIndex]}
            timeRemaining={timeRemaining}
            showHindi={showHindi}
            onOptionSelect={handleOptionSelect}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onMarkForReview={handleMarkForReview}
            isMarkedForReview={markedForReview.has(currentQuestionIndex)}
            isLastQuestion={isLastQuestion}
          />
        ) : (
          <div className="space-y-6">
            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-green-900">
                {showHindi ? 'अभ्यास पूरा हुआ!' : 'Practice Complete!'}
              </h2>
              <p className="text-green-700 mt-2">
                {showHindi ? 'आपके उत्तर जमा कर दिए गए हैं' : 'Your answers have been submitted'}
              </p>
            </div>

            {/* Explanation */}
            {explanation && (
              <ExplanationCard
                explanation={explanation}
                showHindi={showHindi}
              />
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-3 bg-saffron-600 text-white rounded-lg hover:bg-saffron-700 font-medium"
              >
                {showHindi ? 'पुनः प्रयास करें' : 'Retry'}
              </button>
              <Link
                href="/mcq-practice"
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center font-medium"
              >
                {showHindi ? 'अभ्यास पेज पर जाएं' : 'Go to Practice'}
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
