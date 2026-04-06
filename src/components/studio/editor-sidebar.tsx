/**
 * Editor Sidebar - User Content Studio (Feature F4)
 * 
 * Sidebar navigation for notes, folders, and templates
 * Master Prompt v8.0 - READ Mode
 * 
 * Features:
 * - Folder navigation
 * - Notes list with search
 * - Template browser
 * - Recent files
 * - Quick actions
 * - Bilingual support (EN+HI)
 * 
 * AI Provider: 9Router → Groq → Ollama
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  Search,
  Plus,
  Star,
  Clock,
  Archive,
  Tag,
  MoreVertical,
  ChevronRight,
  ChevronDown,
  Filter,
  Grid,
  List,
  Settings,
  Trash2,
  Edit3,
  Copy,
  Download,
  Share2,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface NoteItem {
  id: string;
  title: { en: string; hi: string };
  subject: string;
  wordCount: number;
  updatedAt: string;
  isPinned: boolean;
  isArchived: boolean;
  folderId?: string;
  tags?: string[];
}

export interface FolderItem {
  id: string;
  name: string;
  color: string;
  icon: string;
  noteCount: number;
  parentId?: string;
}

export interface TemplateItem {
  id: string;
  title: { en: string; hi: string };
  category: string;
  usageCount: number;
  rating: number;
  isSystem: boolean;
}

export interface EditorSidebarProps {
  notes: NoteItem[];
  folders: FolderItem[];
  templates: TemplateItem[];
  selectedNoteId?: string;
  selectedFolderId?: string;
  showHindi?: boolean;
  onNoteSelect?: (noteId: string) => void;
  onFolderSelect?: (folderId: string | null) => void;
  onTemplateSelect?: (templateId: string) => void;
  onNoteCreate?: () => void;
  onFolderCreate?: () => void;
  onNoteDelete?: (noteId: string) => void;
  onNotePin?: (noteId: string) => void;
  onNoteArchive?: (noteId: string) => void;
  onViewChange?: (view: 'list' | 'grid') => void;
  view?: 'list' | 'grid';
}

// ============================================================================
// SIDEBAR SECTION COMPONENT
// ============================================================================

interface SidebarSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  onToggle?: () => void;
}

function SidebarSection({
  title,
  icon,
  children,
  defaultOpen = true,
  onToggle,
}: SidebarSectionProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          onToggle?.();
        }}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          {icon}
          <span>{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {isOpen && <div className="pb-2">{children}</div>}
    </div>
  );
}

// ============================================================================
// NOTE ITEM COMPONENT
// ============================================================================

interface NoteItemComponentProps {
  note: NoteItem;
  isSelected: boolean;
  showHindi?: boolean;
  onSelect?: () => void;
  onPin?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

function NoteItemComponent({
  note,
  isSelected,
  showHindi = false,
  onSelect,
  onPin,
  onArchive,
  onDelete,
}: NoteItemComponentProps): JSX.Element {
  const [showMenu, setShowMenu] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return showHindi ? 'आज' : 'Today';
    } else if (diffDays === 1) {
      return showHindi ? 'कल' : 'Yesterday';
    } else if (diffDays < 7) {
      return showHindi ? `${diffDays} दिन पहले` : `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div
      className={`
        group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer
        ${isSelected ? 'bg-saffron-50 border-l-2 border-saffron-600' : 'hover:bg-gray-50 border-l-2 border-transparent'}
      `}
      onClick={onSelect}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        {note.isPinned ? (
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
        ) : note.isArchived ? (
          <Archive className="w-4 h-4 text-gray-400" />
        ) : (
          <FileText className="w-4 h-4 text-gray-400" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {showHindi && note.title.hi ? note.title.hi : note.title.en}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="px-1.5 py-0.5 bg-gray-100 rounded">
            {note.subject}
          </span>
          <span>{note.wordCount} {showHindi ? 'शब्द' : 'words'}</span>
          <span>•</span>
          <span>{formatDate(note.updatedAt)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="w-4 h-4 text-gray-500" />
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[150px]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPin?.();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
              >
                <Star className="w-4 h-4" />
                {note.isPinned ? (showHindi ? 'अनपिन करें' : 'Unpin') : (showHindi ? 'पिन करें' : 'Pin')}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive?.();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
              >
                <Archive className="w-4 h-4" />
                {showHindi ? 'आर्काइव करें' : 'Archive'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 text-red-600"
              >
                <Trash2 className="w-4 h-4" />
                {showHindi ? 'हटाएं' : 'Delete'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// FOLDER ITEM COMPONENT
// ============================================================================

interface FolderItemComponentProps {
  folder: FolderItem;
  isSelected: boolean;
  isExpanded: boolean;
  showHindi?: boolean;
  onSelect?: () => void;
  onToggle?: () => void;
}

function FolderItemComponent({
  folder,
  isSelected,
  isExpanded,
  showHindi = false,
  onSelect,
  onToggle,
}: FolderItemComponentProps): JSX.Element {
  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer
        ${isSelected ? 'bg-saffron-50 border-l-2 border-saffron-600' : 'hover:bg-gray-50 border-l-2 border-transparent'}
      `}
      onClick={onSelect}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle?.();
        }}
        className="p-0.5 hover:bg-gray-200 rounded"
      >
        {isExpanded ? (
          <ChevronDown className="w-3 h-3 text-gray-500" />
        ) : (
          <ChevronRight className="w-3 h-3 text-gray-500" />
        )}
      </button>

      {isExpanded ? (
        <FolderOpen className="w-4 h-4" style={{ color: folder.color }} />
      ) : (
        <Folder className="w-4 h-4" style={{ color: folder.color }} />
      )}

      <span className="flex-1 text-sm font-medium text-gray-700">
        {folder.name}
      </span>

      <span className="text-xs text-gray-500">
        {folder.noteCount} {showHindi ? 'नोट्स' : 'notes'}
      </span>
    </div>
  );
}

// ============================================================================
// TEMPLATE ITEM COMPONENT
// ============================================================================

interface TemplateItemComponentProps {
  template: TemplateItem;
  showHindi?: boolean;
  onSelect?: () => void;
}

function TemplateItemComponent({
  template,
  showHindi = false,
  onSelect,
}: TemplateItemComponentProps): JSX.Element {
  return (
    <div
      onClick={onSelect}
      className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50"
    >
      <FileText className="w-4 h-4 text-saffron-600" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {showHindi && template.title.hi ? template.title.hi : template.title.en}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="px-1.5 py-0.5 bg-saffron-100 text-saffron-700 rounded">
            {template.category}
          </span>
          <span>{template.usageCount} {showHindi ? 'उपयोग' : 'uses'}</span>
          <span>★ {template.rating.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EditorSidebar({
  notes,
  folders,
  templates,
  selectedNoteId,
  selectedFolderId,
  showHindi = false,
  onNoteSelect,
  onFolderSelect,
  onTemplateSelect,
  onNoteCreate,
  onFolderCreate,
  onNoteDelete,
  onNotePin,
  onNoteArchive,
  onViewChange,
  view = 'list',
}: EditorSidebarProps): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'notes' | 'templates'>('notes');

  // Filter notes by search
  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes;

    const query = searchQuery.toLowerCase();
    return notes.filter((note) =>
      note.title.en.toLowerCase().includes(query) ||
      note.title.hi?.toLowerCase().includes(query) ||
      note.subject.toLowerCase().includes(query) ||
      note.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [notes, searchQuery]);

  // Filter notes by folder
  const notesInFolder = useMemo(() => {
    if (!selectedFolderId) return filteredNotes;
    return filteredNotes.filter((note) => note.folderId === selectedFolderId);
  }, [filteredNotes, selectedFolderId]);

  // Pinned notes
  const pinnedNotes = useMemo(
    () => notesInFolder.filter((note) => note.isPinned && !note.isArchived),
    [notesInFolder]
  );

  // Regular notes
  const regularNotes = useMemo(
    () => notesInFolder.filter((note) => !note.isPinned && !note.isArchived),
    [notesInFolder]
  );

  // Archived notes
  const archivedNotes = useMemo(
    () => notesInFolder.filter((note) => note.isArchived),
    [notesInFolder]
  );

  // Toggle folder expansion
  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Translations
  const t = {
    notes: showHindi ? 'नोट्स' : 'Notes',
    templates: showHindi ? 'टेम्पलेट्स' : 'Templates',
    search: showHindi ? 'खोजें...' : 'Search...',
    allNotes: showHindi ? 'सभी नोट्स' : 'All Notes',
    pinned: showHindi ? 'पिन किए गए' : 'Pinned',
    recent: showHindi ? 'हालिया' : 'Recent',
    archived: showHindi ? 'आर्काइव्ड' : 'Archived',
    folders: showHindi ? 'फ़ोल्डर्स' : 'Folders',
    newNote: showHindi ? 'नया नोट' : 'New Note',
    newFolder: showHindi ? 'नया फ़ोल्डर' : 'New Folder',
    listView: showHindi ? 'सूची' : 'List',
    gridView: showHindi ? 'ग्रिड' : 'Grid',
    noNotes: showHindi ? 'कोई नोट्स नहीं' : 'No notes',
    noTemplates: showHindi ? 'कोई टेम्पलेट्स नहीं' : 'No templates',
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="w-72 h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        {/* Tabs */}
        <div className="flex gap-1 mb-3">
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'notes'
                ? 'bg-saffron-100 text-saffron-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t.notes}
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'templates'
                ? 'bg-saffron-100 text-saffron-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t.templates}
          </button>
        </div>

        {/* Search */}
        {activeTab === 'notes' && (
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.search}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron-500"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'notes' ? (
          <>
            {/* Quick Actions */}
            <div className="p-2 border-b border-gray-200 flex gap-1">
              <button
                onClick={onNoteCreate}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-saffron-600 bg-saffron-50 rounded-lg hover:bg-saffron-100 transition-colors"
              >
                <Plus className="w-3 h-3" />
                {t.newNote}
              </button>
              <button
                onClick={onFolderCreate}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Folder className="w-3 h-3" />
                {t.newFolder}
              </button>
            </div>

            {/* View Toggle */}
            <div className="p-2 border-b border-gray-200 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {notesInFolder.length} {showHindi ? 'नोट्स' : 'notes'}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => onViewChange?.('list')}
                  className={`p-1 rounded ${view === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                >
                  <List className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onViewChange?.('grid')}
                  className={`p-1 rounded ${view === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                >
                  <Grid className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Folders */}
            {folders.length > 0 && (
              <SidebarSection
                title={t.folders}
                icon={<Folder className="w-4 h-4 text-gray-500" />}
              >
                <div
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${!selectedFolderId ? 'bg-saffron-50 text-saffron-700' : 'text-gray-700'}`}
                  onClick={() => onFolderSelect?.(null)}
                >
                  {t.allNotes}
                </div>
                {folders.map((folder) => (
                  <FolderItemComponent
                    key={folder.id}
                    folder={folder}
                    isSelected={selectedFolderId === folder.id}
                    isExpanded={expandedFolders.has(folder.id)}
                    showHindi={showHindi}
                    onSelect={() => onFolderSelect?.(folder.id)}
                    onToggle={() => toggleFolder(folder.id)}
                  />
                ))}
              </SidebarSection>
            )}

            {/* Pinned Notes */}
            {pinnedNotes.length > 0 && (
              <SidebarSection
                title={t.pinned}
                icon={<Star className="w-4 h-4 text-amber-500" />}
                defaultOpen={true}
              >
                {pinnedNotes.map((note) => (
                  <NoteItemComponent
                    key={note.id}
                    note={note}
                    isSelected={selectedNoteId === note.id}
                    showHindi={showHindi}
                    onSelect={() => onNoteSelect?.(note.id)}
                    onPin={() => onNotePin?.(note.id)}
                    onArchive={() => onNoteArchive?.(note.id)}
                    onDelete={() => onNoteDelete?.(note.id)}
                  />
                ))}
              </SidebarSection>
            )}

            {/* Recent Notes */}
            {regularNotes.length > 0 && (
              <SidebarSection
                title={t.recent}
                icon={<Clock className="w-4 h-4 text-gray-500" />}
                defaultOpen={true}
              >
                {regularNotes.slice(0, 10).map((note) => (
                  <NoteItemComponent
                    key={note.id}
                    note={note}
                    isSelected={selectedNoteId === note.id}
                    showHindi={showHindi}
                    onSelect={() => onNoteSelect?.(note.id)}
                    onPin={() => onNotePin?.(note.id)}
                    onArchive={() => onNoteArchive?.(note.id)}
                    onDelete={() => onNoteDelete?.(note.id)}
                  />
                ))}
              </SidebarSection>
            )}

            {/* Archived Notes */}
            {archivedNotes.length > 0 && (
              <SidebarSection
                title={t.archived}
                icon={<Archive className="w-4 h-4 text-gray-500" />}
                defaultOpen={false}
              >
                {archivedNotes.map((note) => (
                  <NoteItemComponent
                    key={note.id}
                    note={note}
                    isSelected={selectedNoteId === note.id}
                    showHindi={showHindi}
                    onSelect={() => onNoteSelect?.(note.id)}
                    onPin={() => onNotePin?.(note.id)}
                    onArchive={() => onNoteArchive?.(note.id)}
                    onDelete={() => onNoteDelete?.(note.id)}
                  />
                ))}
              </SidebarSection>
            )}

            {/* Empty State */}
            {notesInFolder.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">{t.noNotes}</p>
              </div>
            )}
          </>
        ) : (
          /* Templates Tab */
          <>
            {templates.length > 0 ? (
              <div className="p-2 space-y-1">
                {templates.map((template) => (
                  <TemplateItemComponent
                    key={template.id}
                    template={template}
                    showHindi={showHindi}
                    onSelect={() => onTemplateSelect?.(template.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">{t.noTemplates}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
