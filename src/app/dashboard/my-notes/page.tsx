/**
 * My Notes Library Page - User Content Studio (Feature F4)
 * 
 * Main notes library with sidebar navigation
 * Master Prompt v8.0 - READ Mode
 * 
 * Features:
 * - Notes grid/list view
 * - Folder navigation
 * - Search and filters
 * - Quick create note
 * - Export options
 * - Bilingual support (EN+HI)
 * 
 * AI Provider: 9Router → Groq → Ollama
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Grid,
  List,
  Filter,
  FolderPlus,
  FileText,
  Star,
  Archive,
  Clock,
  Download,
  MoreVertical,
  Edit3,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { EditorSidebar } from '@/components/studio/editor-sidebar';
import { MiniExportButton } from '@/components/studio/export-menu';

// ============================================================================
// TYPES
// ============================================================================

interface Note {
  id: string;
  title_en: string;
  title_hi: string;
  subject: string;
  word_count: number;
  updated_at: string;
  is_pinned: boolean;
  is_archived: boolean;
  folder_id?: string;
  tags?: string[];
}

interface Folder {
  id: string;
  name: string;
  color: string;
  note_count: number;
}

interface Template {
  id: string;
  title_en: string;
  title_hi: string;
  category: string;
  usage_count: number;
  rating: number;
  is_system: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MyNotesPage() {
  const router = useRouter();
  
  // State
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHindi, setShowHindi] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    subject: null as string | null,
    isPinned: false,
    isArchived: false,
  });

  // Fetch notes
  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedFolderId) params.set('folderId', selectedFolderId);
      if (filters.subject) params.set('subject', filters.subject);
      if (filters.isPinned) params.set('isPinned', 'true');
      if (filters.isArchived) params.set('isArchived', 'true');
      if (searchQuery) params.set('search', searchQuery);

      const response = await fetch(`/api/studio/notes?${params}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch notes');
      }

      setNotes(data.data.notes || []);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [selectedFolderId, filters, searchQuery]);

  // Fetch folders
  const fetchFolders = useCallback(async () => {
    try {
      const response = await fetch('/api/studio/folders');
      const data = await response.json();

      if (data.success) {
        setFolders(data.data.folders || []);
      }
    } catch (err) {
      console.warn('Failed to fetch folders:', err);
    }
  }, []);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('includeSystem', 'true');
      params.set('includeCustom', 'true');

      const response = await fetch(`/api/studio/templates?${params}`);
      const data = await response.json();

      if (data.success) {
        setTemplates(data.data.templates || []);
      }
    } catch (err) {
      console.warn('Failed to fetch templates:', err);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotes();
    fetchFolders();
    fetchTemplates();
  }, [fetchNotes, fetchFolders, fetchTemplates]);

  // Create new note
  const handleCreateNote = async () => {
    try {
      const response = await fetch('/api/studio/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: {
            en: 'Untitled Note',
            hi: 'अनटाइटल्ड नोट',
          },
          content: '',
          subject: 'General',
          isPinned: false,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/my-notes/${data.data.id}`);
      } else {
        alert(data.error || 'Failed to create note');
      }
    } catch (err) {
      console.error('Failed to create note:', err);
      alert('Failed to create note');
    }
  };

  // Create new folder
  const handleCreateFolder = async () => {
    const name = prompt(showHindi ? 'फ़ोल्डर का नाम:' : 'Folder name:');
    if (!name) return;

    try {
      const response = await fetch('/api/studio/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          color: '#ea580c',
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchFolders();
      } else {
        alert(data.error || 'Failed to create folder');
      }
    } catch (err) {
      console.error('Failed to create folder:', err);
      alert('Failed to create folder');
    }
  };

  // Delete note
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm(showHindi ? 'क्या आप इस नोट को हटाना चाहते हैं?' : 'Are you sure you want to delete this note?')) {
      return;
    }

    try {
      const response = await fetch(`/api/studio/notes/${noteId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchNotes();
      } else {
        alert(data.error || 'Failed to delete note');
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
      alert('Failed to delete note');
    }
  };

  // Pin note
  const handlePinNote = async (noteId: string) => {
    try {
      const response = await fetch(`/api/studio/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_pinned: !notes.find(n => n.id === noteId)?.is_pinned,
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchNotes();
      }
    } catch (err) {
      console.error('Failed to pin note:', err);
    }
  };

  // Archive note
  const handleArchiveNote = async (noteId: string) => {
    try {
      const response = await fetch(`/api/studio/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_archived: !notes.find(n => n.id === noteId)?.is_archived,
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchNotes();
      }
    } catch (err) {
      console.error('Failed to archive note:', err);
    }
  };

  // Translations
  const t = {
    myNotes: showHindi ? 'मेरे नोट्स' : 'My Notes',
    search: showHindi ? 'खोजें...' : 'Search...',
    newNote: showHindi ? 'नया नोट' : 'New Note',
    newFolder: showHindi ? 'नया फ़ोल्डर' : 'New Folder',
    gridView: showHindi ? 'ग्रिड' : 'Grid',
    listView: showHindi ? 'सूची' : 'List',
    filters: showHindi ? 'फ़िल्टर' : 'Filters',
    noNotes: showHindi ? 'कोई नोट्स नहीं' : 'No notes',
    createFirst: showHindi ? 'पहला नोट बनाएं' : 'Create your first note',
    words: showHindi ? 'शब्द' : 'words',
    pinned: showHindi ? 'पिन किए गए' : 'Pinned',
    archived: showHindi ? 'आर्काइव्ड' : 'Archived',
    allNotes: showHindi ? 'सभी नोट्स' : 'All Notes',
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading && notes.length === 0) {
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <EditorSidebar
        notes={notes.map(n => ({
          id: n.id,
          title: { en: n.title_en, hi: n.title_hi },
          subject: n.subject,
          wordCount: n.word_count,
          updatedAt: n.updated_at,
          isPinned: n.is_pinned,
          isArchived: n.is_archived,
          folderId: n.folder_id,
          tags: n.tags,
        }))}
        folders={folders.map(f => ({
          id: f.id,
          name: f.name,
          color: f.color,
          icon: '📁',
          noteCount: f.note_count,
        }))}
        templates={templates.map(t => ({
          id: t.id,
          title: { en: t.title_en, hi: t.title_hi },
          category: t.category,
          usageCount: t.usage_count,
          rating: t.rating,
          isSystem: t.is_system,
        }))}
        selectedNoteId={selectedNoteId || undefined}
        selectedFolderId={selectedFolderId || undefined}
        showHindi={showHindi}
        onNoteSelect={(noteId) => router.push(`/my-notes/${noteId}`)}
        onFolderSelect={setSelectedFolderId}
        onNoteCreate={handleCreateNote}
        onFolderCreate={handleCreateFolder}
        onNoteDelete={handleDeleteNote}
        onNotePin={handlePinNote}
        onNoteArchive={handleArchiveNote}
        onViewChange={setView}
        view={view}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t.myNotes}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {notes.length} {showHindi ? 'नोट्स' : 'notes'}
                  {selectedFolderId && ` in folder`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Language Toggle */}
                <button
                  onClick={() => setShowHindi(!showHindi)}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  {showHindi ? 'English' : 'हिंदी'}
                </button>

                {/* New Note */}
                <button
                  onClick={handleCreateNote}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-saffron-600 hover:bg-saffron-700 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {t.newNote}
                </button>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.search}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* New Folder */}
                <button
                  onClick={handleCreateFolder}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">{t.newFolder}</span>
                </button>

                {/* View Toggle */}
                <div className="flex gap-1">
                  <button
                    onClick={() => setView('grid')}
                    className={`p-2 rounded-lg ${view === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setView('list')}
                    className={`p-2 rounded-lg ${view === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Filters */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                    showFilters ? 'bg-saffron-100 text-saffron-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">{t.filters}</span>
                </button>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg flex items-center gap-4">
                {/* Subject Filter */}
                <select
                  value={filters.subject || ''}
                  onChange={(e) => setFilters({ ...filters, subject: e.target.value || null })}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-saffron-500"
                >
                  <option value="">{showHindi ? 'सभी विषय' : 'All Subjects'}</option>
                  <option value="GS1">GS1</option>
                  <option value="GS2">GS2</option>
                  <option value="GS3">GS3</option>
                  <option value="GS4">GS4</option>
                  <option value="Essay">Essay</option>
                  <option value="Optional">Optional</option>
                  <option value="General">General</option>
                </select>

                {/* Pinned Filter */}
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.isPinned}
                    onChange={(e) => setFilters({ ...filters, isPinned: e.target.checked })}
                    className="w-4 h-4 text-saffron-600 rounded focus:ring-saffron-500"
                  />
                  <span>{t.pinned}</span>
                </label>

                {/* Archived Filter */}
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.isArchived}
                    onChange={(e) => setFilters({ ...filters, isArchived: e.target.checked })}
                    className="w-4 h-4 text-saffron-600 rounded focus:ring-saffron-500"
                  />
                  <span>{t.archived}</span>
                </label>

                {/* Clear Filters */}
                <button
                  onClick={() => setFilters({ subject: null, isPinned: false, isArchived: false })}
                  className="text-sm text-saffron-600 hover:underline"
                >
                  {showHindi ? 'साफ़ करें' : 'Clear'}
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
              <button
                onClick={fetchNotes}
                className="mt-2 text-sm text-red-600 hover:underline"
              >
                {showHindi ? 'पुनः प्रयास करें' : 'Retry'}
              </button>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t.noNotes}
              </h3>
              <p className="text-gray-500 mb-4">{t.createFirst}</p>
              <button
                onClick={handleCreateNote}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-saffron-600 hover:bg-saffron-700 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t.newNote}
              </button>
            </div>
          ) : (
            <div
              className={
                view === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-3'
              }
            >
              {notes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => router.push(`/my-notes/${note.id}`)}
                  className={`
                    bg-white border border-gray-200 rounded-xl p-4 cursor-pointer
                    hover:shadow-lg hover:border-saffron-300 transition-all
                    ${view === 'list' ? 'flex gap-4' : ''}
                  `}
                >
                  {/* Icon */}
                  <div className={`flex-shrink-0 ${view === 'list' ? '' : 'mb-3'}`}>
                    <div className="w-10 h-10 bg-saffron-100 rounded-lg flex items-center justify-center">
                      {note.is_pinned ? (
                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      ) : note.is_archived ? (
                        <Archive className="w-5 h-5 text-gray-400" />
                      ) : (
                        <FileText className="w-5 h-5 text-saffron-600" />
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`flex-1 min-w-0 ${view === 'list' ? 'flex flex-col justify-center' : ''}`}>
                    <h3 className="font-semibold text-gray-900 truncate mb-1">
                      {showHindi && note.title_hi ? note.title_hi : note.title_en}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                      <span className="px-2 py-0.5 bg-gray-100 rounded">
                        {note.subject}
                      </span>
                      <span>{note.word_count} {t.words}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(note.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {view === 'list' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePinNote(note.id);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Star className={`w-4 h-4 ${note.is_pinned ? 'fill-amber-500 text-amber-500' : 'text-gray-400'}`} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/my-notes/${note.id}`);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
