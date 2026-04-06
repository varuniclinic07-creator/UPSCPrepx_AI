'use client';

/**
 * BMAD Phase 4: Feature 10 - Notes Library UI
 * Ready-to-use notes browser (like Unacademy)
 * Browse, search, filter, and download UPSC notes
 */

import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Bookmark, Heart, Eye, BookOpen } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  topic: string;
  subject: string;
  brevityLevel: string;
  wordCount: number;
  viewsCount: number;
  downloadsCount: number;
  likesCount: number;
  isPremium: boolean;
  thumbnailUrl?: string;
  createdAt: string;
  tags?: string[];
}

interface NotesLibraryProps {
  userId?: string;
  isPremium?: boolean;
}

export function NotesLibrary({ userId, isPremium }: NotesLibraryProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedBrevity, setSelectedBrevity] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const subjects = ['all', 'GS1', 'GS2', 'GS3', 'GS4', 'CSAT', 'Essay', 'Prelims'];
  const brevityLevels = ['all', '100', '250', '500', '1000', 'comprehensive'];

  // Fetch notes from library
  const fetchNotes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(selectedSubject !== 'all' && { subject: selectedSubject }),
        ...(selectedBrevity !== 'all' && { brevityLevel: selectedBrevity }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/notes/library?${params}`);
      const data = await response.json();

      if (data.success) {
        setNotes(data.notes || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [page, selectedSubject, selectedBrevity]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchNotes();
  };

  // Handle note click
  const handleNoteClick = (noteId: string) => {
    window.location.href = `/notes/${noteId}`;
  };

  // Handle download
  const handleDownload = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/notes/${noteId}/pdf`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `note-${noteId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Handle bookmark
  const handleBookmark = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch('/api/notes/bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId }),
      });
    } catch (error) {
      console.error('Bookmark failed:', error);
    }
  };

  // Handle like
  const handleLike = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch('/api/notes/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId }),
      });
      const data = await response.json();
      if (data.success) {
        setNotes(notes.map(n => 
          n.id === noteId 
            ? { ...n, likesCount: data.isLiked ? n.likesCount + 1 : n.likesCount - 1 }
            : n
        ));
      }
    } catch (error) {
      console.error('Like failed:', error);
    }
  };

  const getBrevityLabel = (level: string) => {
    const labels: Record<string, string> = {
      '100': 'Quick (100 words)',
      '250': 'Short (250 words)',
      '500': 'Medium (500 words)',
      '1000': 'Detailed (1k words)',
      'comprehensive': 'Comprehensive',
    };
    return labels[level] || level;
  };

  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      'GS1': 'bg-blue-100 text-blue-800',
      'GS2': 'bg-green-100 text-green-800',
      'GS3': 'bg-yellow-100 text-yellow-800',
      'GS4': 'bg-purple-100 text-purple-800',
      'CSAT': 'bg-red-100 text-red-800',
      'Essay': 'bg-pink-100 text-pink-800',
      'Prelims': 'bg-orange-100 text-orange-800',
    };
    return colors[subject] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📚 Notes Library
        </h1>
        <p className="text-gray-600">
          Browse {total} ready-to-use UPSC notes • Like Unacademy but AI-powered
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes by topic, subject, or keywords..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </form>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 mr-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          {/* Subject Filter */}
          <div className="flex flex-wrap gap-1">
            {subjects.map((subject) => (
              <button
                key={subject}
                onClick={() => setSelectedSubject(subject)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedSubject === subject
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {subject === 'all' ? 'All Subjects' : subject}
              </button>
            ))}
          </div>

          {/* Brevity Filter */}
          <div className="flex flex-wrap gap-1 ml-4">
            {brevityLevels.map((level) => (
              <button
                key={level}
                onClick={() => setSelectedBrevity(level)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedBrevity === level
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {level === 'all' ? 'All Lengths' : getBrevityLabel(level)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-4"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No notes found</h3>
          <p className="mt-2 text-gray-600">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => handleNoteClick(note.id)}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
            >
              {/* Thumbnail */}
              {note.thumbnailUrl ? (
                <img
                  src={note.thumbnailUrl}
                  alt={note.title}
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-white opacity-50" />
                </div>
              )}

              {/* Content */}
              <div className="p-4">
                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {note.title}
                </h3>

                {/* Topic */}
                <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                  {note.topic}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getSubjectColor(note.subject)}`}>
                    {note.subject}
                  </span>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                    {getBrevityLabel(note.brevityLevel)}
                  </span>
                  {note.isPremium && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      ⭐ Premium
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {note.viewsCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      {note.downloadsCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {note.likesCount}
                    </span>
                  </div>
                  <span className="text-xs">
                    {note.wordCount} words
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => handleDownload(note.id, e)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    PDF
                  </button>
                  <button
                    onClick={(e) => handleBookmark(note.id, e)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Bookmark className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => handleLike(note.id, e)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Heart className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="mt-8 flex justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-600">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <button
            onClick={() => setPage(Math.min(Math.ceil(total / 20), page + 1))}
            disabled={page >= Math.ceil(total / 20)}
            className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
