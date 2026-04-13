/**
 * Answer Practice Main Page
 * 
 * UPSC Mains answer writing practice interface.
 * Browse questions by subject, start writing, view evaluations.
 * 
 * Master Prompt v8.0 - READ Mode Feature F6
 */

'use client';

import React, { useState, useEffect } from 'react';
import { MainsQuestionCard } from '@/components/eval/mains-question-card';
import { MainsHistoryList } from '@/components/eval/mains-history-list';

interface Question {
  id: string;
  question_text: string;
  question_text_hindi?: string;
  subject: 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'Essay';
  topic: string;
  word_limit: number;
  time_limit_min: number;
  marks: number;
  year?: number;
  is_pyo: boolean;
}

interface Evaluation {
  id: string;
  question_text: string;
  subject: string;
  topic: string;
  overall_percentage: number;
  grade: string;
  word_count: number;
  time_taken_sec: number;
  created_at: string;
  is_pyo: boolean;
  year?: number;
}

export default function AnswerPracticePage() {
  const [view, setView] = useState<'browse' | 'write' | 'history' | 'result'>('browse');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch questions from API
  useEffect(() => {
    async function fetchQuestions() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/eval/mains/questions');
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Failed to load questions (${res.status})`);
        }
        const data = await res.json();
        const mapped: Question[] = (data.questions || []).map((q: any) => ({
          id: q.id,
          question_text: q.question_text,
          question_text_hindi: q.question_text_hi,
          subject: q.subject,
          topic: q.topic,
          word_limit: q.word_limit || 250,
          time_limit_min: q.time_limit_min || 15,
          marks: q.marks || 10,
          is_pyo: q.is_pyq ?? false,
          year: q.year,
        }));
        setQuestions(mapped);
      } catch (err: any) {
        setError(err.message || 'Failed to load questions');
      } finally {
        setIsLoading(false);
      }
    }
    fetchQuestions();
  }, []);

  // Fetch evaluation history from API
  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch('/api/eval/mains/history?limit=20');
        if (!res.ok) return; // silently skip if not available
        const data = await res.json();
        if (data.success && data.data) {
          const mapped: Evaluation[] = data.data.map((e: any) => ({
            id: e.id,
            question_text: e.mains_questions?.question_text || e.question_text || '',
            subject: e.mains_questions?.subject || e.subject || '',
            topic: e.mains_questions?.topic || e.topic || '',
            overall_percentage: e.overall_percentage ?? 0,
            grade: e.grade || '',
            word_count: e.word_count ?? 0,
            time_taken_sec: e.time_taken_sec ?? 0,
            created_at: e.created_at || '',
            is_pyo: e.mains_questions?.is_pyq ?? false,
            year: e.mains_questions?.year,
          }));
          setEvaluations(mapped);
        }
      } catch {
        // History fetch failure is non-critical
      }
    }
    fetchHistory();
  }, []);

  const handleStartWriting = (question: Question) => {
    setSelectedQuestion(question);
    setView('write');
  };

  const handleSubmitAnswer = async (answerHtml: string, wordCount: number, timeTaken: number) => {
    if (!selectedQuestion) return;
    setView('result');
    try {
      const res = await fetch('/api/eval/mains/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: selectedQuestion.id,
          answer_text: answerHtml,
          word_count: wordCount,
          time_taken_sec: timeTaken,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Evaluation failed');
        return;
      }
      const data = await res.json();
      if (data.success && data.evaluation) {
        setSelectedEvaluation({
          id: data.evaluation.id,
          question_text: selectedQuestion.question_text,
          subject: selectedQuestion.subject,
          topic: selectedQuestion.topic,
          overall_percentage: data.evaluation.overall_percentage ?? 0,
          grade: data.evaluation.grade || '',
          word_count: wordCount,
          time_taken_sec: timeTaken,
          created_at: new Date().toISOString(),
          is_pyo: selectedQuestion.is_pyo,
          year: selectedQuestion.year,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit answer');
    }
  };

  const handleViewEvaluation = (evalId: string) => {
    const eval_ = evaluations.find(e => e.id === evalId);
    if (eval_) {
      setSelectedEvaluation(eval_);
      setView('result');
    }
  };

  const handlePracticeAnother = () => {
    setSelectedQuestion(null);
    setSelectedEvaluation(null);
    setView('browse');
  };

  const handleRetry = () => {
    if (selectedQuestion) {
      setView('write');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-saffron-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📝 Mains Answer Practice</h1>
          <p className="text-gray-600">Practice UPSC Mains answer writing with instant AI evaluation in &lt;60 seconds</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setView('browse')}
              className={`px-6 py-3 font-medium transition-colors ${
                view === 'browse'
                  ? 'text-saffron-700 border-b-2 border-saffron-500'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📚 Browse Questions
            </button>
            <button
              onClick={() => setView('history')}
              className={`px-6 py-3 font-medium transition-colors ${
                view === 'history'
                  ? 'text-saffron-700 border-b-2 border-saffron-500'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Your History
            </button>
          </div>
        </div>

        {/* Browse Questions */}
        {view === 'browse' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Practice Questions</h2>
              <div className="flex gap-2">
                {['All', 'GS1', 'GS2', 'GS3', 'GS4', 'Essay'].map(subject => (
                  <button
                    key={subject}
                    onClick={() => setSubjectFilter(subject === 'All' ? null : subject)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      (subject === 'All' && !subjectFilter) || subjectFilter === subject
                        ? 'bg-saffron-500 text-white'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-6">
              {questions
                .filter(q => !subjectFilter || q.subject === subjectFilter)
                .map(question => (
                  <MainsQuestionCard
                    key={question.id}
                    {...question}
                    onStart={() => handleStartWriting(question)}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Write Answer */}
        {view === 'write' && selectedQuestion && (
          <div className="space-y-6">
            <button
              onClick={() => setView('browse')}
              className="text-saffron-700 hover:text-saffron-900 font-medium"
            >
              ← Back to Questions
            </button>
            <MainsQuestionCard {...selectedQuestion} />
            {/* Answer editor would be rendered here */}
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <p className="text-gray-600 mb-4">Answer editor would be loaded here</p>
              <button
                onClick={() => handleSubmitAnswer('', 0, 0)}
                className="px-8 py-3 bg-saffron-500 text-white rounded-lg font-medium"
              >
                Submit Answer (Demo)
              </button>
            </div>
          </div>
        )}

        {/* History */}
        {view === 'history' && (
          <MainsHistoryList
            evaluations={evaluations}
            pagination={{ page: 1, limit: 20, total: evaluations.length, totalPages: 1 }}
            stats={{
              total_answers: evaluations.length,
              average_score: evaluations.reduce((acc, e) => acc + e.overall_percentage, 0) / evaluations.length,
              best_score: Math.max(...evaluations.map(e => e.overall_percentage)),
              subject_wise_avg: {},
            }}
            onPageChange={() => {}}
            onSubjectFilter={() => {}}
            onViewEvaluation={handleViewEvaluation}
          />
        )}

        {/* Result View */}
        {view === 'result' && selectedEvaluation && (
          <div className="space-y-6">
            <button
              onClick={handlePracticeAnother}
              className="text-saffron-700 hover:text-saffron-900 font-medium"
            >
              ← Back to Practice
            </button>
            {/* Evaluation result would be rendered here */}
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <p className="text-gray-600 mb-4">Evaluation result would be displayed here</p>
              <p className="text-sm text-gray-500">Evaluation ID: {selectedEvaluation.id}</p>
              <p className="text-sm text-gray-500">Score: {selectedEvaluation.overall_percentage}%</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
