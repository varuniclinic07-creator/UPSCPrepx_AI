/**
 * TipTap Editor - User Content Studio (Feature F4)
 *
 * Main rich text editor component for notes and answers
 * Master Prompt v8.0 - READ Mode
 *
 * Features:
 * - Full TipTap editor with extensions
 * - Bilingual support (EN+HI)
 * - Auto-save integration
 * - Word/character counter
 * - Template support
 * - Export integration
 *
 * AI Provider: 9Router → Groq → Ollama
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
// @ts-ignore - BubbleMenu/FloatingMenu may be in a separate package in some @tiptap/react versions
import { BubbleMenu, FloatingMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { AutoSaveIndicator, useAutoSave } from '@/lib/studio/auto-save';
import { EditorToolbar } from './editor-toolbar';
import { WordCounter } from './word-counter';

// ============================================================================
// TYPES
// ============================================================================

export interface TipTapEditorProps {
  noteId?: string;
  userId: string;
  initialContent?: any;
  placeholder?: {
    en: string;
    hi: string;
  };
  showHindi?: boolean;
  readOnly?: boolean;
  wordLimit?: number;
  timeLimit?: number;
  onSave?: (content: any) => void;
  onExport?: (format: 'pdf' | 'docx' | 'md') => void;
  onTemplateSelect?: (template: any) => void;
  className?: string;
}

export interface EditorStats {
  wordCount: number;
  characterCount: number;
  paragraphCount: number;
  headingCount: number;
}

// ============================================================================
// TIP TAP EXTENSIONS
// ============================================================================

const EDITOR_EXTENSIONS = [
  StarterKit.configure({
    bulletList: { keepMarks: true },
    orderedList: { keepMarks: true },
    heading: {
      levels: [1, 2, 3, 4],
    },
  }),
  Underline,
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  Table.configure({
    resizable: true,
  }),
  TableRow,
  TableHeader,
  TableCell,
  Image.configure({
    HTMLAttributes: {
      class: 'rounded-lg max-w-full',
    },
  }),
  Highlight.configure({
    multicolor: true,
  }),
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'text-saffron-600 hover:underline',
    },
  }),
  Placeholder.configure({
    placeholder: 'Start writing your answer...',
  }),
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TipTapEditor({
  noteId,
  userId,
  initialContent,
  placeholder = {
    en: 'Start writing your answer...',
    hi: 'अपना उत्तर लिखना शुरू करें...',
  },
  showHindi = false,
  readOnly = false,
  wordLimit = 1000,
  timeLimit,
  onSave,
  onExport,
  onTemplateSelect,
  className = '',
}: TipTapEditorProps): JSX.Element {
  // State
  const [editorStats, setEditorStats] = useState<EditorStats>({
    wordCount: 0,
    characterCount: 0,
    paragraphCount: 0,
    headingCount: 0,
  });
  const [showBubbleMenu, setShowBubbleMenu] = useState(false);

  // Auto-save hook
  const autoSave = useAutoSave(noteId || 'temp', userId, {
    delayMs: 30000,
    onSaved: () => {
      if (onSave && editor) {
        onSave(editor.getJSON());
      }
    },
  });

  // Initialize editor
  const editor = useEditor({
    extensions: EDITOR_EXTENSIONS,
    content: initialContent || null,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class:
          'prose prose-saffron max-w-none focus:outline-none min-h-[500px] p-4 bg-white rounded-lg border border-gray-200',
      },
    },
    onUpdate: ({ editor }) => {
      // Update stats
      const content = editor.getText();
      const paragraphs = editor.state.doc.content.content.filter(
        (node: any) => node.type.name === 'paragraph'
      );
      const headings = editor.state.doc.content.content.filter((node: any) =>
        ['heading1', 'heading2', 'heading3', 'heading4'].includes(node.type.name)
      );

      setEditorStats({
        wordCount: content.trim() ? content.trim().split(/\s+/).length : 0,
        characterCount: content.length,
        paragraphCount: paragraphs.length,
        headingCount: headings.length,
      });

      // Update auto-save content
      autoSave.setContent(editor.getJSON());
    },
    onCreate: ({ editor }) => {
      if (initialContent) {
        autoSave.setContent(initialContent);
      }
    },
  });

  // Update placeholder when language changes
  useEffect(() => {
    if (editor) {
      editor.extensionManager.extensions
        .find((ext: any) => ext.name === 'placeholder')
        ?.configure({
          placeholder: showHindi ? placeholder.hi : placeholder.en,
        });
    }
  }, [editor, showHindi, placeholder]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        autoSave.forceSave();
      }

      // Ctrl/Cmd + B: Bold
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        editor.chain().focus().toggleBold().run();
      }

      // Ctrl/Cmd + I: Italic
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        editor.chain().focus().toggleItalic().run();
      }

      // Ctrl/Cmd + U: Underline
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        editor.chain().focus().toggleUnderline().run();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, autoSave]);

  // Editor commands
  const addImage = useCallback(() => {
    const url = window.prompt('Enter image URL:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addTable = useCallback(() => {
    if (editor) {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }
  }, [editor]);

  const addTaskList = useCallback(() => {
    if (editor) {
      editor.chain().focus().toggleTaskList().run();
    }
  }, [editor]);

  const clearFormatting = useCallback(() => {
    if (editor) {
      editor.chain().focus().clearNodes().unsetAllMarks().run();
    }
  }, [editor]);

  // Word limit warning
  const isOverLimit = editorStats.wordCount > wordLimit;
  const wordLimitPercentage = (editorStats.wordCount / wordLimit) * 100;

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron-600 mx-auto mb-4" />
          <p className="text-gray-600">
            {showHindi ? 'एडिटर लोड हो रहा है...' : 'Loading editor...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toolbar */}
      <EditorToolbar
        editor={editor}
        showHindi={showHindi}
        onAddImage={addImage}
        onAddTable={addTable}
        onAddTaskList={addTaskList}
        onClearFormatting={clearFormatting}
        onExport={onExport}
      />

      {/* Auto-save indicator */}
      <div className="flex justify-end">
        <AutoSaveIndicator state={autoSave} showHindi={showHindi} />
      </div>

      {/* Editor container */}
      <div className="relative">
        <EditorContent editor={editor} className="prose-max" />

        {/* Bubble Menu */}
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex gap-2"
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('bold') ? 'bg-saffron-100 text-saffron-600' : ''}`}
            title={showHindi ? 'मोटा' : 'Bold'}
          >
            <span className="font-bold">B</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('italic') ? 'bg-saffron-100 text-saffron-600' : ''}`}
            title={showHindi ? 'तिरछा' : 'Italic'}
          >
            <span className="italic">I</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('underline') ? 'bg-saffron-100 text-saffron-600' : ''}`}
            title={showHindi ? 'रेखांकित' : 'Underline'}
          >
            <span className="underline">U</span>
          </button>
        </BubbleMenu>

        {/* Floating Menu */}
        <FloatingMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex gap-2"
        >
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 1 }) ? 'bg-saffron-100 text-saffron-600' : ''}`}
            title="H1"
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 2 }) ? 'bg-saffron-100 text-saffron-600' : ''}`}
            title="H2"
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('bulletList') ? 'bg-saffron-100 text-saffron-600' : ''}`}
            title={showHindi ? 'बुलेट सूची' : 'Bullet List'}
          >
            • List
          </button>
        </FloatingMenu>
      </div>

      {/* Footer with stats and actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        {/* Word counter */}
        <WordCounter
          wordCount={editorStats.wordCount}
          characterCount={editorStats.characterCount}
          wordLimit={wordLimit}
          showHindi={showHindi}
        />

        {/* Time limit (if applicable) */}
        {timeLimit && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">{showHindi ? 'समय सीमा:' : 'Time limit:'}</span>{' '}
            {Math.floor(timeLimit / 60)} {showHindi ? 'मिनट' : 'min'}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => autoSave.forceSave()}
            className="px-4 py-2 text-sm font-medium text-saffron-600 bg-saffron-50 rounded-lg hover:bg-saffron-100 transition-colors"
            disabled={autoSave.isSaving}
          >
            {autoSave.isSaving
              ? showHindi
                ? 'सहेजा जा रहा है...'
                : 'Saving...'
              : showHindi
                ? 'सहेजें'
                : 'Save'}
          </button>
        </div>
      </div>

      {/* Word limit warning */}
      {isOverLimit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm font-medium">
            {showHindi
              ? `शब्द सीमा पार हो गई! वर्तमान: ${editorStats.wordCount}, सीमा: ${wordLimit}`
              : `Word limit exceeded! Current: ${editorStats.wordCount}, Limit: ${wordLimit}`}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EDITOR STYLES (CSS-in-JS for custom TipTap styling)
// ============================================================================

// Alias for consumers importing as TiptapEditor (camelCase vs TipTapEditor)
export { TipTapEditor as TiptapEditor };

export const editorStyles = `
  .ProseMirror {
    min-height: 400px;
    outline: none;
  }

  .ProseMirror p.is-editor-empty:first-child::before {
    color: #9ca3af;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }

  .ProseMirror h1 {
    font-size: 2em;
    font-weight: bold;
    margin: 1em 0 0.5em;
  }

  .ProseMirror h2 {
    font-size: 1.5em;
    font-weight: bold;
    margin: 1em 0 0.5em;
  }

  .ProseMirror h3 {
    font-size: 1.25em;
    font-weight: bold;
    margin: 1em 0 0.5em;
  }

  .ProseMirror table {
    border-collapse: collapse;
    margin: 1em 0;
    width: 100%;
  }

  .ProseMirror td,
  .ProseMirror th {
    border: 1px solid #e5e7eb;
    padding: 8px 12px;
  }

  .ProseMirror th {
    background-color: #f9fafb;
    font-weight: bold;
  }

  .ProseMirror img {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
  }

  .ProseMirror ul[data-type="taskList"] {
    list-style: none;
    padding: 0;
  }

  .ProseMirror ul[data-type="taskList"] li {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .ProseMirror mark {
    background-color: #fef3c7;
    padding: 0.1em 0.2em;
    border-radius: 0.2em;
  }

  .ProseMirror a {
    color: #ea580c;
    text-decoration: underline;
  }

  .ProseMirror blockquote {
    border-left: 4px solid #e5e7eb;
    padding-left: 1rem;
    margin: 1rem 0;
    font-style: italic;
  }

  .ProseMirror code {
    background-color: #f3f4f6;
    padding: 0.2em 0.4em;
    border-radius: 0.25rem;
    font-family: monospace;
  }

  .ProseMirror pre {
    background-color: #1f2937;
    color: #f9fafb;
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
  }

  .ProseMirror pre code {
    background: none;
    padding: 0;
  }
`;
