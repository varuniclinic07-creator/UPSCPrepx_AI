'use client';

import { useState } from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';

interface Props {
  onGenerated?: () => void;
}

const SUBJECTS = [
  'Indian Polity', 'History', 'Geography', 'Economy', 'Environment',
  'Science & Technology', 'International Relations', 'Ethics',
  'Indian Society', 'Internal Security', 'Disaster Management',
];

export function LectureGenerationDialog({ onGenerated }: Props) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/lectures/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, subject, language: 'en', targetDuration: 180 }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');

      setOpen(false);
      setTopic('');
      onGenerated?.();
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-saffron-600 text-white rounded-lg hover:bg-saffron-700 transition text-sm font-medium"
      >
        <Sparkles className="w-4 h-4" /> Generate Lecture
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
        <button onClick={() => setOpen(false)} className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg">
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <h2 className="text-lg font-bold text-gray-900 mb-1">Generate Animated Lecture</h2>
        <p className="text-sm text-gray-500 mb-4">AI will create a full video lecture with animations and voiceover.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Indian Constitution - Basic Structure Doctrine"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-saffron-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-saffron-500"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-saffron-600 text-white rounded-lg hover:bg-saffron-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Queuing...' : 'Generate Lecture'}
          </button>
        </form>
      </div>
    </div>
  );
}
