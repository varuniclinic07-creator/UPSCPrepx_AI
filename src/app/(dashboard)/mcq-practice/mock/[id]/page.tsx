/**
 * MCQ Mock Test Page
 * 
 * Master Prompt v8.0 - Feature F7 (READ Mode)
 * - Full mock test interface
 * - 100 questions, 2 hours
 * - Section-wise navigation
 * - Question palette
 * - Submit with confirmation
 * - Results display
 * - Bilingual support
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MockTestView } from '@/components/mcq/mock-test-view';
import { PracticeDashboard } from '@/components/mcq/practice-dashboard';
import { ArrowLeft, Trophy, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface QuestionStatus {
  id: string;
  number: number;
  status: 'unanswered' | 'answered' | 'marked-for-review' | 'not-visited';
  section: 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'CSAT';
}

interface MockTest {
  id: string;
  title: string;
  totalQuestions: number;
  durationSec: number;
  sections: Array<{
    name: string;
    questions: number;
    duration: number;
  }>;
}

interface TestResults {
  score: number;
  maxScore: number;
  accuracy: number;
  percentile: number;
  subjectBreakdown: Array<{
    subject: string;
    total: number;
    correct: number;
    accuracy: number;
  }>;
  xpEarned: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function MockTestPage() {
  const params = useParams();
  const router = useRouter();
  const [showHindi, setShowHindi] = useState(false);
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<MockTest | null>(null);
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [questions, setQuestions] = useState<QuestionStatus[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(7200); // 2 hours
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [results, setResults] = useState<TestResults | null>(null);

  // Fetch mock test details
  useEffect(() => {
    fetchMockTest();
  }, [params.id]);

  const fetchMockTest = async () => {
    try {
      const response = await fetch(`/api/mcq/mock/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mockId: params.id }),
      });
      const data = await response.json();

      if (data.success) {
        setTest(data.data.test);
        setQuestions(data.data.questions);
        setTimeRemaining(data.data.test.durationSec);
      }
    } catch (error) {
      console.error('Failed to fetch mock test:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle question selection from palette
  const handleQuestionSelect = useCallback((questionNumber: number) => {
    setCurrentQuestion(questionNumber);
  }, []);

  // Handle answer selection
  const handleAnswerSelect = useCallback((questionNumber: number, option: number) => {
    setAnswers((prev) => ({ ...prev, [questionNumber]: option }));
    setQuestions((prev) =>
      prev.map((q) =>
        q.number === questionNumber
          ? { ...q, status: 'answered' as const }
          : q
      )
    );
  }, []);

  // Handle mark for review
  const handleMarkForReview = useCallback((questionNumber: number) => {
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(questionNumber)) {
        next.delete(questionNumber);
      } else {
        next.add(questionNumber);
      }
      return next;
    });
    setQuestions((prev) =>
      prev.map((q) =>
        q.number === questionNumber
          ? { ...q, status: 'marked-for-review' as const }
          : q
      )
    );
  }, []);

  // Handle timeout
  const handleTimeout = useCallback(() => {
    handleSubmit();
  }, []);

  // Handle submit
  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/mcq/mock/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mockId: params.id,
          answers: Object.entries(answers).map(([q, a]) => ({
            questionNumber: parseInt(q),
            selectedOption: a,
          })),
          timeSpent: 7200 - timeRemaining,
        }),
      });
      const data = await response.json();

      if (data.success) {
        setResults(data.data.results);
        setSubmitted(true);
        setIsTimerRunning(false);
      }
    } catch (error) {
      console.error('Failed to submit mock test:', error);
    }
  };

  // Start test
  const handleStartTest = () => {
    setStarted(true);
    setIsTimerRunning(true);
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

  if (!test) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            {showHindi ? 'टेस्ट नहीं मिला' : 'Test not found'}
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

  // Update questions with current answers and marks
  useEffect(() => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (markedForReview.has(q.number)) {
          return { ...q, status: 'marked-for-review' as const };
        }
        if (answers[q.number]) {
          return { ...q, status: 'answered' as const };
        }
        return q;
      })
    );
  }, [answers, markedForReview]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/mcq-practice"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {showHindi ? 'वापस' : 'Back'}
                </span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-saffron-600" />
                <h1 className="text-lg font-bold text-gray-900">{test.title}</h1>
              </div>
            </div>

            <button
              onClick={() => setShowHindi(!showHindi)}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              {showHindi ? 'English' : 'हिंदी'}
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {!started ? (
          /* Pre-test Instructions */
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <div className="text-center mb-8">
                <Trophy className="w-16 h-16 text-saffron-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {test.title}
                </h2>
                <div className="flex items-center justify-center gap-6 text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span>
                      {Math.floor(test.durationSec / 60)} {showHindi ? 'मिनट' : 'Minutes'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>{test.totalQuestions} {showHindi ? 'प्रश्न' : 'Questions'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <h3 className="font-bold text-blue-900 mb-3">
                  {showHindi ? 'निर्देश' : 'Instructions'}
                </h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• {showHindi ? 'कुल 100 प्रश्न, 5 खंड (GS1-4, CSAT)' : 'Total 100 questions, 5 sections (GS1-4, CSAT)'}</li>
                  <li>• {showHindi ? 'प्रत्येक प्रश्न +2.5 अंक, -0.83 नकारात्मक' : 'Each question +2.5 marks, -0.83 negative'}</li>
                  <li>• {showHindi ? 'समय: 120 मिनट (2 घंटे)' : 'Duration: 120 minutes (2 hours)'}</li>
                  <li>• {showHindi ? 'रिव्यू के लिए चिह्नित कर सकते हैं' : 'You can mark questions for review'}</li>
                  <li>• {showHindi ? 'किसी भी समय टेस्ट सबमिट कर सकते हैं' : 'You can submit test anytime'}</li>
                </ul>
              </div>

              <button
                onClick={handleStartTest}
                className="w-full py-4 bg-saffron-600 text-white rounded-lg hover:bg-saffron-700 text-lg font-bold transition-colors"
              >
                {showHindi ? 'टेस्ट शुरू करें' : 'Start Test'}
              </button>
            </div>
          </div>
        ) : !submitted ? (
          /* Active Test */
          <MockTestView
            questions={questions}
            currentQuestion={currentQuestion}
            timeRemaining={timeRemaining}
            showHindi={showHindi}
            onQuestionSelect={handleQuestionSelect}
            onSubmit={handleSubmit}
          />
        ) : results ? (
          /* Results */
          <div className="max-w-3xl mx-auto">
            <PracticeDashboard
              stats={{
                totalQuestions: results.subjectBreakdown.reduce((sum, s) => sum + s.total, 0),
                correctAnswers: results.subjectBreakdown.reduce((sum, s) => sum + s.correct, 0),
                incorrectAnswers: 0,
                unattempted: 0,
                accuracy: results.accuracy,
                timeSpentSec: 7200 - timeRemaining,
                averageTimePerQuestion: 0,
                xpEarned: results.xpEarned,
                score: results.score,
                maxScore: results.maxScore,
                percentile: results.percentile,
              }}
              subjectBreakdown={results.subjectBreakdown}
              showHindi={showHindi}
              onRetry={() => window.location.reload()}
              onContinue={() => router.push('/mcq-practice')}
              isMockTest={true}
            />
          </div>
        ) : null}
      </main>
    </div>
  );
}
