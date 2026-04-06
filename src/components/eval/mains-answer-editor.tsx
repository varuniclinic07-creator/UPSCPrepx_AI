/**
 * Mains Answer Editor Component
 * 
 * TipTap-based rich text editor for UPSC Mains answer writing.
 * Features: Word counter, timer, auto-save, formatting toolbar.
 * 
 * Master Prompt v8.0 - Rule 3: SIMPLIFIED_LANGUAGE_PROMPT
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';

interface MainsAnswerEditorProps {
  questionId: string;
  wordLimit: number;
  timeLimitMin: number;
  onSubmit: (answerText: string, wordCount: number, timeTakenSec: number) => void;
  isSubmitting: boolean;
}

export function MainsAnswerEditor({
  questionId,
  wordLimit,
  timeLimitMin,
  onSubmit,
  isSubmitting,
}: MainsAnswerEditorProps) {
  const [wordCount, setWordCount] = useState(0);
  const [timeTakenSec, setTimeTakenSec] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      const words = text.split(/\s+/).filter(w => w.length > 0);
      setWordCount(words.length);
      setHasChanges(true);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none min-h-[400px] p-4 focus:outline-none',
      },
    },
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimeTakenSec(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Auto-save every 30 seconds
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (hasChanges && editor) {
      interval = setInterval(() => {
        const content = editor.getHTML();
        localStorage.setItem(`draft_${questionId}`, content);
        setLastSaved(new Date());
        setHasChanges(false);
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [hasChanges, editor, questionId]);

  // Load draft on mount
  useEffect(() => {
    if (editor) {
      const draft = localStorage.getItem(`draft_${questionId}`);
      if (draft) {
        editor.commands.setContent(draft);
      }
    }
  }, [editor, questionId]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate time remaining
  const timeLimitSec = timeLimitMin * 60;
  const timeRemaining = timeLimitSec - timeTakenSec;
  const isTimeUp = timeRemaining <= 0;
  const isOverWordLimit = wordCount > wordLimit;

  // Handle submit
  const handleSubmit = () => {
    if (!editor) return;
    const text = editor.getText();
    if (text.length < 50) {
      alert('Answer must be at least 50 characters');
      return;
    }
    onSubmit(editor.getHTML(), wordCount, timeTakenSec);
  };

  // Clear draft
  const handleClear = () => {
    if (confirm('Clear your answer? This cannot be undone.')) {
      editor?.commands.clearContent();
      localStorage.removeItem(`draft_${questionId}`);
      setWordCount(0);
      setTimeTakenSec(0);
      setLastSaved(null);
      setHasChanges(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Toolbar */}
      <div className="bg-gray-50 border border-gray-200 rounded-t-xl p-3 flex flex-wrap gap-2 items-center">
        {/* Formatting Buttons */}
        <button
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            editor?.isActive('bold')
              ? 'bg-saffron-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          Bold
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            editor?.isActive('italic')
              ? 'bg-saffron-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          Italic
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            editor?.isActive('underline')
              ? 'bg-saffron-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          Underline
        </button>
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <button
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className="px-3 py-1.5 rounded text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
        >
          • List
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className="px-3 py-1.5 rounded text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
        >
          1. List
        </button>
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <button
          onClick={() => editor?.chain().focus().setTextAlign('left').run()}
          className="px-3 py-1.5 rounded text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
        >
          Left
        </button>
        <button
          onClick={() => editor?.chain().focus().setTextAlign('center').run()}
          className="px-3 py-1.5 rounded text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
        >
          Center
        </button>
      </div>

      {/* Editor */}
      <div className="border-x border-gray-200">
        <EditorContent
          editor={editor}
          className="min-h-[400px] p-4 focus:outline-none"
          placeholder="Start writing your answer here... Start with an introduction that provides context."
        />
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border border-gray-200 rounded-b-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Stats */}
          <div className="flex flex-wrap gap-4 text-sm">
            {/* Word Count */}
            <div className={`px-3 py-1.5 rounded-lg border ${
              isOverWordLimit
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-white border-gray-200 text-gray-700'
            }`}>
              <span className="font-medium">{wordCount}</span> / {wordLimit} words
              {isOverWordLimit && <span className="ml-2">⚠️ Over limit</span>}
            </div>

            {/* Timer */}
            <div className={`px-3 py-1.5 rounded-lg border ${
              isTimeUp
                ? 'bg-red-50 border-red-200 text-red-700'
                : timeRemaining < 60
                ? 'bg-orange-50 border-orange-200 text-orange-700'
                : 'bg-white border-gray-200 text-gray-700'
            }`}>
              <span className="font-mono font-medium">{formatTime(timeTakenSec)}</span>
              <span className="text-gray-400 mx-1">/</span>
              {formatTime(timeLimitSec)}
              {isTimeUp && <span className="ml-2">⏰ Time's up!</span>}
            </div>

            {/* Auto-save */}
            {lastSaved && (
              <div className="text-gray-500 text-xs">
                {hasChanges ? '📝 Unsaved changes' : `✓ Saved ${lastSaved.toLocaleTimeString()}`}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Clear
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || wordCount < 10}
              className={`px-6 py-2 text-sm font-medium text-white rounded-lg transition-all ${
                isSubmitting || wordCount < 10
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-saffron-500 to-orange-600 hover:shadow-lg hover:shadow-saffron-500/50'
              }`}
            >
              {isSubmitting ? 'Submitting...' : `Submit Answer (${formatTime(timeTakenSec)})`}
            </button>
          </div>
        </div>

        {/* Time Warning */}
        {timeRemaining < 60 && timeRemaining > 0 && (
          <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700">
            ⚠️ Less than 1 minute remaining!
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>Keyboard shortcuts: <strong>Ctrl+B</strong> Bold | <strong>Ctrl+I</strong> Italic | <strong>Ctrl+U</strong> Underline</p>
        <p className="mt-1">Your answer is auto-saved every 30 seconds</p>
      </div>
    </div>
  );
}
