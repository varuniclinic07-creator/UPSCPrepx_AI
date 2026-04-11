/**
 * Write Answer Page - User Content Studio (Feature F4)
 * 
 * Answer writing interface with timer
 * Master Prompt v8.0 - READ Mode
 * 
 * Features:
 * - TipTap rich text editor
 * - Countdown timer
 * - Word limit tracking
 * - Question display
 * - Auto-submit on timeout
 * - Bilingual support (EN+HI)
 * 
 * AI Provider: 9Router → Groq → Ollama
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Clock,
  Save,
  Send,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  Pause,
  Play,
  RotateCcw,
  Flag,
} from 'lucide-react';
import { TiptapEditor } from '@/components/studio/tiptap-editor';
import { EnhancedWordCounter } from '@/components/studio/word-counter';

// ============================================================================
// TYPES
// ============================================================================

interface Question {
  id: string;
  title_en: string;
  title_hi: string;
  subject: string;
  word_limit: number;
  time_limit: number;
  marks: number;
  year?: number;
  isPYQ: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function WriteAnswerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const questionId = searchParams.get('questionId');

  // State
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHindi, setShowHindi] = useState(false);
  const [content, setContent] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: showHindi
          ? 'अपना उत्तर यहाँ लिखें...'
          : 'Write your answer here...',
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      setContentHtml(html);
      setContent(text);
    },
    immediatelyRender: false,
  });

  // Fetch question
  const fetchQuestion = useCallback(async () => {
    if (!questionId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/eval/mains/${questionId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch question');
      }

      const q = data.data;
      setQuestion(q);
      setTimeRemaining(q.time_limit * 60); // Convert minutes to seconds
    } catch (err) {
      console.error('Failed to fetch question:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [questionId]);

  // Initial fetch
  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  // Timer effect
  useEffect(() => {
    if (isTimerRunning && timeRemaining > 0 && !isSubmitted) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Time's up - auto submit
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, timeRemaining, isSubmitted]);

  // Start timer
  const handleStartTimer = () => {
    setHasStarted(true);
    setIsTimerRunning(true);
  };

  // Pause timer
  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  // Resume timer
  const handleResumeTimer = () => {
    setIsTimerRunning(true);
  };

  // Reset timer
  const handleResetTimer = () => {
    if (!question) return;
    setIsTimerRunning(false);
    setHasStarted(false);
    setTimeRemaining(question.time_limit * 60);
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get timer color
  const getTimerColor = () => {
    if (!question || !timeRemaining) return 'text-gray-600';
    
    const percentage = (timeRemaining / (question.time_limit * 60)) * 100;
    
    if (percentage <= 10) return 'text-red-600 bg-red-50';
    if (percentage <= 25) return 'text-amber-600 bg-amber-50';
    return 'text-saffron-600 bg-saffron-50';
  };

  // Submit answer
  const handleSubmit = async () => {
    if (!question || !editor) return;

    setIsSaving(true);

    try {
      const html = editor.getHTML();
      const text = editor.getText();
      const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
      const timeSpent = (question.time_limit * 60) - timeRemaining;

      const response = await fetch('/api/studio/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          title: {
            en: `Answer to ${question.title_en}`,
            hi: question.title_hi ? `उत्तर: ${question.title_hi}` : `Answer to ${question.title_en}`,
          },
          content: text,
          contentHtml: html,
          subject: question.subject,
          wordLimit: question.word_limit,
          timeLimit: question.time_limit,
          timeSpent,
          metadata: {
            isPractice: true,
            linkedMainsQuestion: question.id,
          },
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to submit answer');
      }

      setIsSubmitted(true);
      setIsTimerRunning(false);

      // Redirect to evaluation or results
      setTimeout(() => {
        router.push(`/answer-practice/${data.data.id}/result`);
      }, 2000);
    } catch (err) {
      console.error('Failed to submit answer:', err);
      alert('Failed to submit answer. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Auto submit on timeout
  const handleAutoSubmit = async () => {
    if (!question || !editor) return;

    setIsTimerRunning(false);
    setIsSubmitted(true);

    try {
      const html = editor.getHTML();
      const text = editor.getText();
      const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
      const timeSpent = question.time_limit * 60;

      await fetch('/api/studio/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          title: {
            en: `Answer to ${question.title_en} (Time Up)`,
            hi: question.title_hi ? `उत्तर: ${question.title_hi} (समय समाप्त)` : `Answer to ${question.title_en} (Time Up)`,
          },
          content: text,
          contentHtml: html,
          subject: question.subject,
          wordLimit: question.word_limit,
          timeLimit: question.time_limit,
          timeSpent,
          metadata: {
            isPractice: true,
            linkedMainsQuestion: question.id,
            submittedOnTimeout: true,
          },
        }),
      });

      // Show timeout notification
      alert(showHindi ? 'समय समाप्त! आपका उत्तर सहेजा गया।' : 'Time\'s up! Your answer has been saved.');

      // Redirect
      setTimeout(() => {
        router.push('/dashboard/answer-practice');
      }, 2000);
    } catch (err) {
      console.error('Failed to auto-submit:', err);
    }
  };

  // Translations
  const t = {
    back: showHindi ? 'वापस' : 'Back',
    writeAnswer: showHindi ? 'उत्तर लिखें' : 'Write Answer',
    question: showHindi ? 'प्रश्न' : 'Question',
    timeLimit: showHindi ? 'समय सीमा' : 'Time Limit',
    wordLimit: showHindi ? 'शब्द सीमा' : 'Word Limit',
    marks: showHindi ? 'अंक' : 'Marks',
    start: showHindi ? 'शुरू करें' : 'Start',
    pause: showHindi ? 'रोकें' : 'Pause',
    resume: showHindi ? 'पुनः शुरू करें' : 'Resume',
    reset: showHindi ? 'रीसेट' : 'Reset',
    submit: showHindi ? 'जमा करें' : 'Submit',
    submitting: showHindi ? 'जमा किया जा रहा है...' : 'Submitting...',
    submitted: showHindi ? 'जमा किया गया!' : 'Submitted!',
    timeUp: showHindi ? 'समय समाप्त!' : 'Time\'s Up!',
    confirmSubmit: showHindi ? 'क्या आप सुनिश्चित हैं कि आप अपना उत्तर जमा करना चाहते हैं?' : 'Are you sure you want to submit your answer?',
    minutes: showHindi ? 'मिनट' : 'minutes',
    words: showHindi ? 'शब्द' : 'words',
  };

  // ============================================================================
  // RENDER
  // ============================================================================

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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {showHindi ? 'त्रुटि' : 'Error'}
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard/answer-practice')}
            className="px-4 py-2 bg-saffron-600 text-white rounded-lg hover:bg-saffron-700"
          >
            {showHindi ? 'वापस जाएं' : 'Go Back'}
          </button>
        </div>
      </div>
    );
  }

  const wordCount = editor ? editor.getText().split(/\s+/).filter(w => w.length > 0).length : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            {/* Back + Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard/answer-practice')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-500" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">{t.writeAnswer}</h1>
            </div>

            {/* Language Toggle */}
            <button
              onClick={() => setShowHindi(!showHindi)}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {showHindi ? 'English' : 'हिंदी'}
            </button>
          </div>

          {/* Timer + Actions */}
          <div className="flex items-center justify-between">
            {/* Timer */}
            {question && (
              <div className={`flex items-center gap-3 px-4 py-2 rounded-lg ${getTimerColor()}`}>
                <Clock className="w-6 h-6" />
                <span className="text-2xl font-mono font-bold">
                  {formatTime(timeRemaining)}
                </span>
                
                {/* Timer Controls */}
                {!isTimerRunning && !isSubmitted && hasStarted && (
                  <button
                    onClick={handleResumeTimer}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                  >
                    <Play className="w-5 h-5" />
                  </button>
                )}
                
                {isTimerRunning && (
                  <button
                    onClick={handlePauseTimer}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                  >
                    <Pause className="w-5 h-5" />
                  </button>
                )}
                
                {!hasStarted && (
                  <button
                    onClick={handleStartTimer}
                    className="px-4 py-2 bg-saffron-600 text-white rounded-lg hover:bg-saffron-700 transition-colors font-medium"
                  >
                    {t.start}
                  </button>
                )}
                
                {hasStarted && !isSubmitted && (
                  <button
                    onClick={handleResetTimer}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                    title={t.reset}
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Submit Button */}
            {hasStarted && !isSubmitted && (
              <button
                onClick={handleSubmit}
                disabled={isSaving || wordCount === 0}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-saffron-600 hover:bg-saffron-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>{t.submitting}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{t.submit}</span>
                  </>
                )}
              </button>
            )}

            {/* Submitted State */}
            {isSubmitted && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">{t.submitted}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Question Card */}
        {question && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-saffron-100 text-saffron-700 text-xs font-semibold rounded">
                    {question.subject}
                  </span>
                  {question.isPYQ && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                      PYQ {question.year}
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                    {question.marks} {t.marks}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {showHindi && question.title_hi ? question.title_hi : question.title_en}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{t.timeLimit}: {question.time_limit} {t.minutes}</span>
              </div>
              <div className="flex items-center gap-1">
                <Flag className="w-4 h-4" />
                <span>{t.wordLimit}: {question.word_limit} {t.words}</span>
              </div>
            </div>
          </div>
        )}

        {/* Word Counter */}
        <div>
          <EnhancedWordCounter
            wordCount={wordCount}
            characterCount={content.length}
            wordLimit={question?.word_limit}
            showHindi={showHindi}
            showReadTime={false}
            showWriteTime
          />
        </div>

        {/* Editor */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden min-h-[500px]">
          <TiptapEditor
            editor={editor}
            showHindi={showHindi}
            readOnly={isSubmitted}
          />
        </div>
      </main>

      {/* Warning on close if unsaved */}
      {hasStarted && !isSubmitted && content.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 shadow-lg">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">
              {showHindi ? 'उत्तर जमा करना न भूलें!' : 'Don\'t forget to submit your answer!'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
