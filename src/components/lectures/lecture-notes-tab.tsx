'use client';

import { useState, useCallback } from 'react';
import { Save, Plus, Clock } from 'lucide-react';

interface Note {
  id: string;
  text: string;
  timestamp: number;
  createdAt: string;
}

interface Props {
  lectureId: string;
  currentTime: number;
  onSeek: (time: number) => void;
}

export function LectureNotesTab({ lectureId, currentTime, onSeek }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const addNote = useCallback(async () => {
    if (!draft.trim()) return;
    setSaving(true);

    const note: Note = {
      id: Date.now().toString(),
      text: draft,
      timestamp: Math.floor(currentTime),
      createdAt: new Date().toISOString(),
    };

    setNotes(prev => [note, ...prev]);
    setDraft('');
    setSaving(false);
  }, [draft, currentTime]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Take a note at this timestamp..."
          rows={2}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-saffron-500 focus:border-transparent"
          onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) addNote(); }}
        />
        <button
          onClick={addNote}
          disabled={saving || !draft.trim()}
          className="px-3 py-2 bg-saffron-600 text-white rounded-lg hover:bg-saffron-700 disabled:opacity-50 transition self-end"
        >
          {saving ? <Save className="w-4 h-4 animate-pulse" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      <p className="text-xs text-gray-400">Ctrl+Enter to save. Timestamp: {formatTime(currentTime)}</p>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {notes.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">No notes yet. Start taking notes while watching!</p>
        )}
        {notes.map((note) => (
          <div key={note.id} className="bg-gray-50 rounded-lg p-3 space-y-1">
            <button
              onClick={() => onSeek(note.timestamp)}
              className="flex items-center gap-1 text-xs text-saffron-600 hover:text-saffron-700 font-medium"
            >
              <Clock className="w-3 h-3" /> {formatTime(note.timestamp)}
            </button>
            <p className="text-sm text-gray-700">{note.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
