'use client';

/**
 * KnowledgeSearchPanel — C1 Phase-1 hero surface.
 *
 * Client-side panel that calls POST /api/agents/knowledge with action='retrieve'
 * and renders the grounded chunks with citation snippets. Kept self-contained
 * so it can be dropped into any page (Notes, Mentor, Dashboard) without
 * touching server-rendered layouts.
 */

import React, { useState } from 'react';
import { Search, Loader2, FileText, ExternalLink } from 'lucide-react';

interface Chunk {
  id: string;
  text: string;
  score?: number;
  meta?: { sourceId?: string; title?: string; topicId?: string; url?: string };
}

export function KnowledgeSearchPanel({
  topicFilter,
  placeholder = 'Ask your notes anything — e.g. "When did the Constitution come into effect?"',
  showHeading = true,
}: {
  topicFilter?: string;
  placeholder?: string;
  showHeading?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [chunks, setChunks] = useState<Chunk[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/agents/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'retrieve',
          query,
          topK: 6,
          filter: topicFilter ? { topicId: topicFilter } : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setChunks(data.chunks ?? []);
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (err: any) {
      setError(err?.message ?? 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.05] p-4 md:p-6">
      {showHeading && (
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-indigo-500/10">
            <FileText className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Ask your notes</h3>
            <p className="text-xs text-white/50">Grounded answers from ingested notes, PYQ, and CA.</p>
          </div>
        </div>
      )}

      <form onSubmit={run} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-400"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
        </button>
      </form>

      {error && (
        <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-300">
          {error}
        </div>
      )}

      {chunks && (
        <div className="mt-4 space-y-2">
          {chunks.length === 0 && (
            <p className="text-xs text-white/40 py-6 text-center">
              No matching chunks yet. Ingest a note first.
            </p>
          )}
          {chunks.map((c, i) => (
            <div
              key={c.id}
              className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:border-indigo-400/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400">
                  [C{i + 1}]
                  {c.meta?.topicId ? <span className="text-white/40 ml-2">{c.meta.topicId}</span> : null}
                </span>
                {typeof c.score === 'number' && (
                  <span className="text-[10px] text-white/30">
                    {(c.score * 100).toFixed(0)}%
                  </span>
                )}
              </div>
              <p className="text-sm text-white/80 leading-relaxed line-clamp-4">{c.text}</p>
              {c.meta?.url && (
                <a
                  href={c.meta.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-[11px] text-indigo-300 hover:text-indigo-200"
                >
                  source <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
