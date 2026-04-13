'use client';

import { useState, useCallback } from 'react';
import { useMutation } from '@/hooks/use-api';

interface VideoNote {
  id: string;
  timestamp: number;
  text: string;
  createdAt: string;
}

interface VideoNotesPanelProps {
  videoId: string;
  currentTime: number;
  topic?: string;
}

/**
 * Video Notes Panel — timestamp-synced note-taking alongside video player.
 * Notes are tagged with the current video timestamp for easy review.
 */
export function VideoNotesPanel({ videoId, currentTime, topic }: VideoNotesPanelProps) {
  const [notes, setNotes] = useState<VideoNote[]>([]);
  const [noteText, setNoteText] = useState('');

  const { mutate: saveNote, loading: saving } = useMutation<any, any>(
    '/api/video/notes',
    'POST'
  );

  const formatTimestamp = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleAddNote = useCallback(async () => {
    if (!noteText.trim()) return;

    const newNote: VideoNote = {
      id: crypto.randomUUID(),
      timestamp: Math.floor(currentTime),
      text: noteText.trim(),
      createdAt: new Date().toISOString(),
    };

    setNotes(prev => [...prev, newNote].sort((a, b) => a.timestamp - b.timestamp));
    setNoteText('');

    try {
      await saveNote({
        videoId,
        timestamp: newNote.timestamp,
        text: newNote.text,
      });
    } catch {
      // Note already added locally; save failure is non-critical
    }
  }, [noteText, currentTime, videoId, saveNote]);

  const handleExportNotes = useCallback(() => {
    const exportText = notes
      .map(n => `[${formatTimestamp(n.timestamp)}] ${n.text}`)
      .join('\n\n');

    const blob = new Blob([`# Notes: ${topic || 'Video'}\n\n${exportText}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes-${topic || videoId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [notes, formatTimestamp, topic, videoId]);

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-700">
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-white">Notes</h3>
        {notes.length > 0 && (
          <button
            onClick={handleExportNotes}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Export
          </button>
        )}
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {notes.length === 0 ? (
          <p className="text-xs text-gray-500 text-center mt-4">
            Add notes while watching. They&apos;ll be tagged with timestamps.
          </p>
        ) : (
          notes.map(note => (
            <div key={note.id} className="bg-gray-800 rounded-lg p-2">
              <span className="text-xs text-blue-400 font-mono">
                {formatTimestamp(note.timestamp)}
              </span>
              <p className="text-sm text-gray-200 mt-1">{note.text}</p>
            </div>
          ))
        )}
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-gray-700">
        <div className="flex gap-2">
          <span className="text-xs text-blue-400 font-mono mt-2 shrink-0">
            {formatTimestamp(currentTime)}
          </span>
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddNote();
              }
            }}
            placeholder="Type a note..."
            className="flex-1 bg-gray-800 text-sm text-white rounded-lg px-3 py-2 resize-none border border-gray-600 focus:border-blue-500 focus:outline-none"
            rows={2}
            disabled={saving}
          />
        </div>
      </div>
    </div>
  );
}
