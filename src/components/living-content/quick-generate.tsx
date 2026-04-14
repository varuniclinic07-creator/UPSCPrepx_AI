'use client';

import { useState, useCallback } from 'react';
import { Sparkles, Loader2, RefreshCw, BookOpen, Brain, Map, MessageSquare } from 'lucide-react';
import { useLivingContent } from '@/hooks/use-living-content';

type ContentMode = 'notes' | 'quiz' | 'mind_map' | 'doubt_answer';

interface QuickGenerateProps {
  mode: ContentMode;
  onResult?: (data: any) => void;
  className?: string;
}

const MODE_CONFIG: Record<ContentMode, { label: string; placeholder: string; icon: typeof Sparkles }> = {
  notes: { label: 'Generate Notes', placeholder: 'e.g., Fundamental Rights, Indian Economy...', icon: BookOpen },
  quiz: { label: 'Generate Quiz', placeholder: 'e.g., Indian Polity, Modern History...', icon: Brain },
  mind_map: { label: 'Generate Mind Map', placeholder: 'e.g., Mughal Empire, Monsoon System...', icon: Map },
  doubt_answer: { label: 'Ask a Doubt', placeholder: 'e.g., What is the difference between...', icon: MessageSquare },
};

export function QuickGenerate({ mode, onResult, className = '' }: QuickGenerateProps) {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const { data, loading, error, generatedNow, fetch: fetchContent, reset } = useLivingContent();

  const config = MODE_CONFIG[mode];

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) return;
    const result = await fetchContent({
      topic: topic.trim(),
      contentType: mode,
      subject: subject || undefined,
      forceRefresh: false,
    });
    if (result && onResult) {
      onResult(result);
    }
  }, [topic, subject, mode, fetchContent, onResult]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) handleGenerate();
  }, [handleGenerate, loading]);

  const subjects = ['GS1', 'GS2', 'GS3', 'GS4', 'Essay', 'CSAT'];

  return (
    <div className={`rounded-2xl border border-border/50 bg-card/40 p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <config.icon className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Living Content — {config.label}
        </h3>
        {generatedNow && (
          <span className="ml-auto text-xs text-green-500 font-medium">Freshly generated</span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={topic}
          onChange={e => setTopic(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={config.placeholder}
          className="flex-1 h-11 px-4 rounded-xl bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
          disabled={loading}
        />
        <select
          value={subject}
          onChange={e => setSubject(e.target.value)}
          className="h-11 px-3 rounded-xl bg-muted/50 border border-border/50 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
          disabled={loading}
        >
          <option value="">Auto-detect</option>
          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
          className="h-11 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Generating...' : config.label}
        </button>
      </div>

      {error && (
        <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {data && !loading && (
        <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">
              {generatedNow ? 'Just generated' : 'From Knowledge Graph cache'}
            </span>
            <button
              onClick={() => { reset(); setTopic(''); }}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> New query
            </button>
          </div>
          <div className="text-sm text-foreground whitespace-pre-wrap line-clamp-6">
            {typeof data === 'string'
              ? data
              : typeof data === 'object' && data !== null
                ? (data as any).summary || (data as any).content || JSON.stringify(data, null, 2).slice(0, 500)
                : String(data)}
          </div>
        </div>
      )}
    </div>
  );
}
