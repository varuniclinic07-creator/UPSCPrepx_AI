'use client';

import { useState, useCallback, useRef, FormEvent } from 'react';
import Link from 'next/link';
import { Search, ArrowLeft, Command, Loader2, AlertCircle, BookOpen, ExternalLink, Clock, Sparkles } from 'lucide-react';

interface BookReference {
  book: string;
  chapter: string;
  page: number | null;
}

interface SearchResult {
  id: string;
  title: string;
  content: string;
  source: string;
  source_url: string | null;
  book_reference: BookReference | null;
  syllabus_mapping: string[];
  relevance_score: number;
  content_type: string;
  highlighted_text: string;
  explainability: {
    why_matched: string;
    key_concepts: string[];
  };
}

interface SearchResponse {
  results: SearchResult[];
  total_results: number;
  search_time_ms: number;
  suggested_answer_snippet: string;
  related_queries: string[];
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSearch = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const res = await fetch('/api/search/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed, limit: 20 }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.error || `Search failed (${res.status})`);
      }

      const data: SearchResponse = await res.json();
      setResults(data);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleRelatedQueryClick = (relatedQuery: string) => {
    setQuery(relatedQuery);
    handleSearch(relatedQuery);
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-display font-bold mb-6">Search</h1>

      <form onSubmit={handleSubmit}>
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search notes, topics, current affairs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-2xl bg-white/[0.03] border border-white/[0.06] px-10 py-3 text-sm text-foreground placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30"
            autoFocus
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" />
          )}
        </div>
      </form>
      <p className="text-xs text-muted-foreground mb-8 flex items-center gap-1">
        Tip: Press <Command className="h-3 w-3" /><span className="font-mono">K</span> anywhere to open search quickly.
      </p>

      <div className="space-y-3">
        {/* Error state */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-medium text-sm text-red-800 dark:text-red-300">Search failed</h3>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
              <button
                onClick={() => handleSearch(query)}
                className="text-sm text-red-700 dark:text-red-300 underline mt-2 hover:no-underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-16 text-muted-foreground">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin opacity-30" />
            <p>Searching across all content...</p>
          </div>
        )}

        {/* Results */}
        {!isLoading && !error && results && (
          <>
            {/* Search metadata */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
              <Clock className="h-3 w-3" />
              <span>
                {results.total_results} result{results.total_results !== 1 ? 's' : ''} in {results.search_time_ms}ms
              </span>
            </div>

            {/* Suggested answer snippet */}
            {results.suggested_answer_snippet && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="font-medium text-sm text-primary">AI-Generated Answer</h3>
                </div>
                <p className="text-sm leading-relaxed">{results.suggested_answer_snippet}</p>
              </div>
            )}

            {/* Result cards */}
            {results.results.length > 0 ? (
              results.results.map((result) => (
                <div key={result.id} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 hover:border-white/[0.1] transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-medium text-sm">{result.title}</h3>
                    <span className="text-xs bg-white/[0.06] px-2 py-0.5 rounded shrink-0">
                      {Math.round(result.relevance_score * 100)}% match
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span className="capitalize">{result.content_type.replace(/_/g, ' ')}</span>
                    <span>&middot;</span>
                    <span>{result.source}</span>
                    {result.source_url && (
                      <>
                        <span>&middot;</span>
                        <a
                          href={result.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 hover:text-foreground"
                        >
                          <ExternalLink className="h-3 w-3" /> Link
                        </a>
                      </>
                    )}
                  </div>

                  <p
                    className="text-sm text-muted-foreground mb-2 line-clamp-3"
                    dangerouslySetInnerHTML={{ __html: result.highlighted_text }}
                  />

                  {/* Book reference */}
                  {result.book_reference && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                      <BookOpen className="h-3 w-3" />
                      <span>
                        {result.book_reference.book}
                        {result.book_reference.chapter && ` - ${result.book_reference.chapter}`}
                        {result.book_reference.page && `, p.${result.book_reference.page}`}
                      </span>
                    </div>
                  )}

                  {/* Syllabus tags */}
                  {result.syllabus_mapping.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {result.syllabus_mapping.map((tag) => (
                        <span key={tag} className="text-xs bg-white/[0.06] px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Explainability */}
                  {result.explainability.why_matched && (
                    <p className="text-xs text-muted-foreground italic">
                      {result.explainability.why_matched}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No results found for &ldquo;{query}&rdquo;.</p>
                <p className="text-xs mt-2">Try different keywords or broaden your search.</p>
              </div>
            )}

            {/* Related queries */}
            {results.related_queries.length > 0 && (
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 mt-4">
                <h3 className="font-medium text-sm text-muted-foreground mb-2">Related Searches</h3>
                <div className="flex flex-wrap gap-2">
                  {results.related_queries.map((rq) => (
                    <button
                      key={rq}
                      onClick={() => handleRelatedQueryClick(rq)}
                      className="text-sm text-primary hover:underline bg-primary/5 px-3 py-1 rounded-full transition-colors hover:bg-primary/10"
                    >
                      {rq}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Initial empty state (before any search) */}
        {!isLoading && !error && !hasSearched && (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Start typing to search across all your content.</p>
          </div>
        )}
      </div>
    </div>
  );
}
