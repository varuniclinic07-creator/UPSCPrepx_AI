'use client';

import { useState, useEffect } from 'react';
import { Bookmark, Plus, Trash2, Clock } from 'lucide-react';

interface BookmarkItem {
  id: string;
  label: string;
  timestamp: number;
  chapter: number;
}

interface Props {
  lectureId: string;
  currentTime: number;
  currentChapter: number;
  onSeek: (time: number) => void;
}

export function LectureBookmarksTab({ lectureId, currentTime, currentChapter, onSeek }: Props) {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [label, setLabel] = useState('');

  useEffect(() => {
    fetchBookmarks();
  }, [lectureId]);

  const fetchBookmarks = async () => {
    try {
      const res = await fetch(`/api/lectures/${lectureId}/bookmarks`);
      if (res.ok) {
        const data = await res.json();
        setBookmarks(data.bookmarks || []);
      }
    } catch { /* ignore */ }
  };

  const addBookmark = async () => {
    const bm: BookmarkItem = {
      id: Date.now().toString(),
      label: label.trim() || `Bookmark at ${formatTime(currentTime)}`,
      timestamp: Math.floor(currentTime),
      chapter: currentChapter,
    };

    setBookmarks(prev => [...prev, bm]);
    setLabel('');

    // Save to API (best-effort)
    try {
      await fetch(`/api/lectures/${lectureId}/bookmarks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bm),
      });
    } catch { /* saved locally */ }
  };

  const removeBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Bookmark label (optional)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-saffron-500 focus:border-transparent"
          onKeyDown={(e) => { if (e.key === 'Enter') addBookmark(); }}
        />
        <button
          onClick={addBookmark}
          className="flex items-center gap-1 px-3 py-2 bg-saffron-600 text-white rounded-lg hover:bg-saffron-700 transition text-sm"
        >
          <Plus className="w-4 h-4" /> Bookmark
        </button>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto">
        {bookmarks.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">No bookmarks yet. Save important moments!</p>
        )}
        {bookmarks
          .sort((a, b) => a.timestamp - b.timestamp)
          .map((bm) => (
          <div key={bm.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 group">
            <Bookmark className="w-4 h-4 text-saffron-500 flex-shrink-0" />
            <button
              onClick={() => onSeek(bm.timestamp)}
              className="flex-1 text-left"
            >
              <p className="text-sm font-medium text-gray-900">{bm.label}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {formatTime(bm.timestamp)} — Ch.{bm.chapter}
              </p>
            </button>
            <button
              onClick={() => removeBookmark(bm.id)}
              className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded transition"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
