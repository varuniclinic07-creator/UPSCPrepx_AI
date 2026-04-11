'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ArrowLeft, Command } from 'lucide-react';

export default function SearchPage() {
  const [query, setQuery] = useState('');

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-6">Search</h1>

      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search notes, topics, current affairs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border bg-background px-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          autoFocus
        />
      </div>
      <p className="text-xs text-muted-foreground mb-8 flex items-center gap-1">
        Tip: Press <Command className="h-3 w-3" /><span className="font-mono">K</span> anywhere to open search quickly.
      </p>

      <div className="space-y-3">
        {query.trim() ? (
          ['Notes', 'Current Affairs', 'Lectures', 'Library'].map((category) => (
            <div key={category} className="rounded-lg border p-4">
              <h3 className="font-medium text-sm text-muted-foreground mb-2">{category}</h3>
              <p className="text-sm">No results found for &ldquo;{query}&rdquo; in {category}.</p>
            </div>
          ))
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Start typing to search across all your content.</p>
          </div>
        )}
      </div>
    </div>
  );
}
