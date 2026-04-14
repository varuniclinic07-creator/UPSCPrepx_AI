/**
 * Note Editor Page - User Content Studio (Feature F4)
 * 
 * Full-featured note editor with TipTap
 * Master Prompt v8.0 - READ Mode
 * 
 * Features:
 * - TipTap rich text editor
 * - Auto-save (30s intervals)
 * - Export (PDF/Word/Markdown)
 * - Template insertion
 * - Word counter
 * - Bilingual support (EN+HI)
 * 
 * AI Provider: 9Router → Groq → Ollama
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Save,
  Download,
  FileText,
  Clock,
  Star,
  Archive,
  Trash2,
  ChevronLeft,
  Settings,
  LayoutTemplate as Template,
  Eye,
  Edit3,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { EditorToolbar } from '@/components/studio/editor-toolbar';
import { EnhancedWordCounter } from '@/components/studio/word-counter';
import { ExportMenu } from '@/components/studio/export-menu';
import { TemplateSelector } from '@/components/studio/template-selector';
// Note: useAutoSave from lib expects (noteId, userId, config) but we manage auto-save inline

// ============================================================================
// TYPES
// ============================================================================

interface Note {
  id: string;
  title_en: string;
  title_hi: string;
  content: string;
  content_html: string | null;
  subject: string;
  word_count: number;
  character_count: number;
  word_limit: number | null;
  is_pinned: boolean;
  is_archived: boolean;
  folder_id: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface NoteTemplate {
  id: string;
  title_en: string;
  title_hi: string;
  category: string;
  structure: any;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function NoteEditorPage() {
  const params = useParams();
  const router = useRouter();
  const noteId = params.id as string;

  // State
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHindi, setShowHindi] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState({ en: '', hi: '' });
  const [content, setContent] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [subject, setSubject] = useState('General');
  const [wordLimit, setWordLimit] = useState<number | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

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
          ? 'यहाँ लिखना शुरू करें...'
          : 'Start writing here...',
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      setContentHtml(html);
      setContent(text);
    },
    editable: isEditing,
    immediatelyRender: false,
  });

  // Sync editor editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [editor, isEditing]);

  // Fetch note
  const fetchNote = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/studio/notes/${noteId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch note');
      }

      const fetchedNote = data.data;
      setNote(fetchedNote);
      setTitle({
        en: fetchedNote.title_en,
        hi: fetchedNote.title_hi || fetchedNote.title_en,
      });
      setSubject(fetchedNote.subject);
      setWordLimit(fetchedNote.word_limit);
      setIsPinned(fetchedNote.is_pinned);

      // Load content into editor
      if (editor && fetchedNote.content_html) {
        editor.commands.setContent(fetchedNote.content_html);
      } else if (editor && fetchedNote.content) {
        editor.commands.setContent(fetchedNote.content);
      }

      setIsEditing(false);
    } catch (err) {
      console.error('Failed to fetch note:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [noteId, editor]);

  // Initial fetch
  useEffect(() => {
    if (noteId) {
      fetchNote();
    }
  }, [noteId, fetchNote]);

  // Auto-save effect (30s interval when editing)
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isEditing || !editor) {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
        autoSaveRef.current = null;
      }
      return;
    }

    autoSaveRef.current = setInterval(async () => {
      setIsSaving(true);
      setSaveError(null);

      try {
        const html = editor.getHTML();
        const text = editor.getText();
        const wc = text.split(/\s+/).filter((w: string) => w.length > 0).length;

        const response = await fetch(`/api/studio/notes/${noteId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title_en: title.en,
            title_hi: title.hi,
            content: text,
            content_html: html,
            subject,
            word_count: wc,
            character_count: text.length,
            word_limit: wordLimit,
            is_pinned: isPinned,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to save');
        }

        setLastSaved(new Date());
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Save failed');
      } finally {
        setIsSaving(false);
      }
    }, 30000);

    return () => {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
        autoSaveRef.current = null;
      }
    };
  }, [isEditing, editor, noteId, title, subject, wordLimit, isPinned]);

  // Manual save
  const handleSave = async () => {
    if (!editor) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const html = editor.getHTML();
      const text = editor.getText();
      const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

      const response = await fetch(`/api/studio/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title_en: title.en,
          title_hi: title.hi,
          content: text,
          content_html: html,
          subject,
          word_count: wordCount,
          character_count: text.length,
          word_limit: wordLimit,
          is_pinned: isPinned,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save');
      }

      setNote(data.data);
      setLastSaved(new Date());
      setIsEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  // Insert template
  const handleInsertTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/studio/templates/${templateId}`);
      const data = await response.json();

      if (data.success) {
        const template = data.data;
        
        // Insert template structure into editor
        if (editor) {
          const html = template.structure_html || '';
          editor.commands.insertContent(html);
        }

        setShowTemplates(false);
      }
    } catch (err) {
      console.error('Failed to insert template:', err);
    }
  };

  // Delete note
  const handleDelete = async () => {
    if (!confirm(showHindi ? 'क्या आप इस नोट को हटाना चाहते हैं?' : 'Are you sure you want to delete this note?')) {
      return;
    }

    try {
      const response = await fetch(`/api/studio/notes/${noteId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        router.push('/dashboard/my-notes');
      } else {
        alert(data.error || 'Failed to delete note');
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
      alert('Failed to delete note');
    }
  };

  // Toggle pin
  const handleTogglePin = async () => {
    try {
      const response = await fetch(`/api/studio/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: !isPinned }),
      });

      const data = await response.json();

      if (data.success) {
        setIsPinned(!isPinned);
      }
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  // Toggle archive
  const handleToggleArchive = async () => {
    try {
      const response = await fetch(`/api/studio/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_archived: !note?.is_archived }),
      });

      const data = await response.json();

      if (data.success) {
        setNote(data.data);
      }
    } catch (err) {
      console.error('Failed to toggle archive:', err);
    }
  };

  // Get word count from editor
  const getWordCount = () => {
    if (!editor) return { words: 0, characters: 0 };
    const text = editor.getText();
    return {
      words: text.split(/\s+/).filter(w => w.length > 0).length,
      characters: text.length,
    };
  };

  // Translations
  const t = {
    back: showHindi ? 'वापस' : 'Back',
    edit: showHindi ? 'संपादित करें' : 'Edit',
    save: showHindi ? 'सहेजें' : 'Save',
    saved: showHindi ? 'सहेजा गया' : 'Saved',
    saving: showHindi ? 'सहेजा जा रहा है...' : 'Saving...',
    export: showHindi ? 'निर्यात' : 'Export',
    templates: showHindi ? 'टेम्पलेट्स' : 'Templates',
    delete: showHindi ? 'हटाएं' : 'Delete',
    pin: showHindi ? 'पिन' : 'Pin',
    archive: showHindi ? 'आर्काइव' : 'Archive',
    untitled: showHindi ? 'अनटाइटल्ड' : 'Untitled',
    lastSaved: showHindi ? 'अंतिम सहेजा गया' : 'Last saved',
    autoSave: showHindi ? 'ऑटो-सेव' : 'Auto-save',
    unsavedChanges: showHindi ? 'सहेजे नहीं गए परिवर्तन' : 'Unsaved changes',
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
            onClick={() => router.push('/dashboard/my-notes')}
            className="px-4 py-2 bg-saffron-600 text-white rounded-lg hover:bg-saffron-700"
          >
            {showHindi ? 'वापस जाएं' : 'Go Back'}
          </button>
        </div>
      </div>
    );
  }

  const wordCount = getWordCount();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between mb-3">
            {/* Back + Title */}
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={() => router.push('/dashboard/my-notes')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-500" />
              </button>

              {isEditing ? (
                <input
                  type="text"
                  value={showHindi && title.hi ? title.hi : title.en}
                  onChange={(e) =>
                    setTitle({ ...title, en: e.target.value, hi: e.target.value })
                  }
                  placeholder={t.untitled}
                  className="flex-1 text-lg font-semibold border-b-2 border-saffron-500 focus:outline-none bg-transparent"
                />
              ) : (
                <h1 className="text-lg font-semibold text-gray-900 flex-1">
                  {showHindi && title.hi ? title.hi : title.en}
                </h1>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Language Toggle */}
              <button
                onClick={() => setShowHindi(!showHindi)}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {showHindi ? 'English' : 'हिंदी'}
              </button>

              {/* Pin */}
              <button
                onClick={handleTogglePin}
                className={`p-2 rounded-lg transition-colors ${
                  isPinned ? 'bg-amber-100 text-amber-600' : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <Star className={`w-5 h-5 ${isPinned ? 'fill-amber-500' : ''}`} />
              </button>

              {/* Archive */}
              <button
                onClick={handleToggleArchive}
                className={`p-2 rounded-lg transition-colors ${
                  note?.is_archived ? 'bg-gray-200 text-gray-600' : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <Archive className="w-5 h-5" />
              </button>

              {/* Delete */}
              <button
                onClick={handleDelete}
                className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Toolbar Row */}
          <div className="flex items-center justify-between">
            {/* Subject + Word Limit */}
            {isEditing && (
              <div className="flex items-center gap-3">
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-saffron-500"
                >
                  <option value="GS1">GS1</option>
                  <option value="GS2">GS2</option>
                  <option value="GS3">GS3</option>
                  <option value="GS4">GS4</option>
                  <option value="Essay">Essay</option>
                  <option value="Optional">Optional</option>
                  <option value="General">General</option>
                </select>

                <input
                  type="number"
                  value={wordLimit || ''}
                  onChange={(e) => setWordLimit(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Word limit"
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 w-24 focus:outline-none focus:ring-2 focus:ring-saffron-500"
                />
              </div>
            )}

            {/* Save Status + Actions */}
            <div className="flex items-center gap-2">
              {/* Save Status */}
              {isSaving ? (
                <div className="flex items-center gap-2 text-sm text-saffron-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-saffron-600" />
                  <span>{t.saving}</span>
                </div>
              ) : lastSaved ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>{t.saved} {t.lastSaved.toLowerCase()} {lastSaved.toLocaleTimeString()}</span>
                </div>
              ) : saveError ? (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <AlertCircle className="w-4 h-4" />
                  <span>{saveError}</span>
                </div>
              ) : null}

              {/* Edit/Save Button */}
              {isEditing ? (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-saffron-600 hover:bg-saffron-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {t.save}
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-saffron-600 bg-saffron-50 hover:bg-saffron-100 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  {t.edit}
                </button>
              )}

              {/* Templates */}
              <button
                onClick={() => setShowTemplates(true)}
                className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Template className="w-4 h-4" />
                <span className="hidden sm:inline">{t.templates}</span>
              </button>

              {/* Export */}
              <button
                onClick={() => setShowExport(true)}
                className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-saffron-600 bg-saffron-50 hover:bg-saffron-100 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">{t.export}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-6">
        {/* Word Counter */}
        <div className="mb-4">
          <EnhancedWordCounter
            wordCount={wordCount.words}
            characterCount={wordCount.characters}
            wordLimit={wordLimit || undefined}
            showHindi={showHindi}
            showReadTime
            showWriteTime
          />
        </div>

        {/* Editor */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {isEditing && editor && (
            <EditorToolbar editor={editor} showHindi={showHindi} />
          )}
          <div className="p-4">
            <EditorContent editor={editor} />
          </div>
        </div>
      </main>

      {/* Export Modal */}
      {showExport && note && (
        <ExportMenu
          noteId={note.id}
          noteTitle={{ en: title.en, hi: title.hi }}
          isOpen={showExport}
          onClose={() => setShowExport(false)}
          showHindi={showHindi}
        />
      )}

      {/* Template Selector */}
      {showTemplates && (
        <TemplateSelector
          templates={[]}
          isOpen={showTemplates}
          onClose={() => setShowTemplates(false)}
          onSelect={handleInsertTemplate}
          showHindi={showHindi}
        />
      )}
    </div>
  );
}
