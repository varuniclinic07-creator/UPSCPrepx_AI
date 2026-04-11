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

  // Sample questions (in production, fetch from API)
  useEffect(() => {
    const sampleQuestions: Question[] = [
      {
        id: '1',
        question_text: 'The Indian Constitution embodies the principle of \'Basic Structure\'. Discuss the evolution of this doctrine through landmark Supreme Court judgments.',
        question_text_hindi: 'भारतीय संविधान \'मूल संरचना\' के सिद्धांत को समाहित करता है। landmark सुप्रीम कोर्ट के फैसलों के माध्यम से इस सिद्धांत के विकास पर चर्चा करें।',
        subject: 'GS2',
        topic: 'Constitution',
        word_limit: 250,
        time_limit_min: 15,
        marks: 10,
        is_pyo: true,
        year: 2023,
      },
      {
        id: '2',
        question_text: 'Explain the impact of climate change on water resources in India. Suggest adaptive strategies for sustainable water management.',
        question_text_hindi: 'भारत में जल संसाधनों पर जलवायु परिवर्तन के प्रभाव की व्याख्या करें। सतत जल प्रबंधन के लिए अनुकूलन रणनीतियों का सुझाव दें।',
        subject: 'GS3',
        topic: 'Environment',
        word_limit: 250,
        time_limit_min: 15,
        marks: 10,
        is_pyo: false,
      },
      {
        id: '3',
        question_text: 'What are the challenges in India\'s agricultural marketing system? How can e-NAM transform the sector?',
        question_text_hindi: 'भारत की कृषि विपणन प्रणाली में क्या चुनौतियां हैं? e-NAM क्षेत्र को कैसे बदल सकता है?',
        subject: 'GS3',
        topic: 'Agriculture',
        word_limit: 250,
        time_limit_min: 15,
        marks: 10,
        is_pyo: true,
        year: 2022,
      },
      {
        id: '4',
        question_text: 'Ethical concerns in the use of Artificial Intelligence: Discuss with relevant examples.',
        question_text_hindi: 'कृत्रिम बुद्धिमत्ता के उपयोग में नैतिक चिंताएं: प्रासंगिक उदाहरणों के साथ चर्चा करें।',
        subject: 'GS4',
        topic: 'Ethics',
        word_limit: 250,
        time_limit_min: 15,
        marks: 10,
        is_pyo: false,
      },
      {
        id: '5',
        question_text: 'Trace the evolution of the Indian freedom struggle from 1857 to 1905.',
        question_text_hindi: '1857 से 1905 तक भारतीय स्वतंत्रता संग्राम के विकास का पता लगाएं।',
        subject: 'GS1',
        topic: 'History',
        word_limit: 250,
        time_limit_min: 15,
        marks: 10,
        is_pyo: true,
        year: 2021,
      },
    ];

    setQuestions(sampleQuestions);
    setIsLoading(false);
  }, []);

  // Sample evaluations (in production, fetch from API)
  useEffect(() => {
    const sampleEvaluations: Evaluation[] = [
      {
        id: 'eval-1',
        question_text: 'The Indian Constitution embodies the principle of Basic Structure...',
        subject: 'GS2',
        topic: 'Constitution',
        overall_percentage: 72,
        grade: 'Good',
        word_count: 245,
        time_taken_sec: 890,
        created_at: '2024-01-15T10:30:00Z',
        is_pyo: true,
        year: 2023,
      },
      {
        id: 'eval-2',
        question_text: 'Explain the impact of climate change on water resources...',
        subject: 'GS3',
        topic: 'Environment',
        overall_percentage: 58,
        grade: 'Average',
        word_count: 230,
        time_taken_sec: 920,
        created_at: '2024-01-14T14:20:00Z',
        is_pyo: false,
      },
    ];

    setEvaluations(sampleEvaluations);
  }, []);

  const handleStartWriting = (question: Question) => {
    setSelectedQuestion(question);
    setView('write');
  };

  const handleSubmitAnswer = async (answerHtml: string, wordCount: number, timeTaken: number) => {
    // In production: POST to /api/eval/mains/submit
    console.log('Submitting answer...', { answerHtml, wordCount, timeTaken });
    // After submission, show loading then result
    setView('result');
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
