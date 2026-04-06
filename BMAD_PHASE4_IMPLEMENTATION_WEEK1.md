# BMAD Phase 4: Implementation - Week 1 Foundation Fixes

**Version**: 1.0  
**Date**: 2026-04-05  
**Status**: 🟢 IMPLEMENTATION STARTED  
**Goal**: Fix production issues + Implement Feature 18 (RAG Search Engine)

---

## 📋 WEEK 1 CHECKLIST

### Day 1: Production Fixes Verification
- [ ] Verify Coolify deployment working
- [ ] Test signup/login flow
- [ ] Verify no localhost redirects
- [ ] Check Supabase connection
- [ ] Verify environment variables loaded

### Day 2-3: Feature 18 - RAG Search Engine
- [ ] Create Supabase pgvector extension
- [ ] Create search_index table migration
- [ ] Create embedding generation utility
- [ ] Create search API endpoint
- [ ] Create search UI components
- [ ] Test search functionality

### Day 4-5: Feature 10 - Notes Generator
- [ ] Create notes table migration
- [ ] Create notes generation API
- [ ] Create brevity level controller
- [ ] Create PDF generation service
- [ ] Create notes UI components

---

## 🚨 PRODUCTION FIX VERIFICATION

### Step 1: Verify Environment Variables

Run this check to confirm env vars are loaded:

```bash
# Check if NEXTAUTH_URL is set correctly
echo $NEXTAUTH_URL

# Should output: https://upscbyvarunsh.aimasteryedu.in
# NOT: localhost:3000
```

### Step 2: Test Supabase Connection

Create test file to verify database connection:

```typescript
// src/app/api/test/connection/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) throw error;
    
    return NextResponse.json({ 
      status: 'connected', 
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL 
    });
  } catch (error) {
    return NextResponse.json({ 
      status: 'error', 
      error: error.message 
    }, { status: 500 });
  }
}
```

### Step 3: Verify NextAuth Configuration

Check `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
// Ensure NEXTAUTH_URL is used correctly
export const authOptions = {
  providers: [...],
  callbacks: {
    async jwt({ token, user }) {
      // Ensure proper URL handling
      return token;
    }
  },
  // Critical: Use environment variable
  url: process.env.NEXTAUTH_URL
}
```

---

## 🔧 FEATURE 18: RAG SEARCH ENGINE IMPLEMENTATION

### Migration File: `supabase/migrations/018_rag_search_engine.sql`

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Search index table
CREATE TABLE IF NOT EXISTS search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  content_text TEXT NOT NULL,
  embedding vector(1536),
  source VARCHAR(100),
  source_url TEXT,
  book_reference JSONB,
  syllabus_tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Search history (premium feature)
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  filters JSONB,
  results_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved searches (premium feature)
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  query TEXT NOT NULL,
  filters JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS search_index_embedding_idx 
ON search_index USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Index for text search
CREATE INDEX IF NOT EXISTS search_index_content_text_idx 
ON search_index USING GIN (to_tsvector('english', content_text));

-- Index for syllabus tags
CREATE INDEX IF NOT EXISTS search_index_syllabus_tags_idx 
ON search_index USING GIN (syllabus_tags);

-- Row Level Security
ALTER TABLE search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Public read access for search_index (filtered by RLS in API)
CREATE POLICY "search_index_public_read" ON search_index
  FOR SELECT USING (true);

-- Users can read their own search history
CREATE POLICY "search_history_user_read" ON search_history
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own search history
CREATE POLICY "search_history_user_insert" ON search_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can read their own saved searches
CREATE POLICY "saved_searches_user_read" ON saved_searches
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own saved searches
CREATE POLICY "saved_searches_user_insert" ON saved_searches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saved searches
CREATE POLICY "saved_searches_user_delete" ON saved_searches
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_search_index_updated_at
  BEFORE UPDATE ON search_index
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### Library File: `src/lib/search/rag-search-engine.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { embeddingService } from './embedding-service';

export interface SearchFilters {
  sources?: string[];
  content_type?: string[];
  syllabus_area?: string[];
  date_range?: {
    from: string;
    to: string;
  };
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  source: string;
  source_url: string | null;
  book_reference: {
    book: string;
    chapter: string;
    page: number | null;
  } | null;
  syllabus_mapping: string[];
  relevance_score: number;
  content_type: string;
  highlighted_text: string;
  explainability: {
    why_matched: string;
    key_concepts: string[];
  };
}

export interface SearchResponse {
  results: SearchResult[];
  total_results: number;
  search_time_ms: number;
  suggested_answer_snippet: string;
  related_queries: string[];
}

export class RAGSearchEngine {
  private supabase;
  private embeddingService;

  constructor() {
    this.supabase = createClient();
    this.embeddingService = embeddingService;
  }

  async search(
    query: string,
    filters: SearchFilters = {},
    limit: number = 20
  ): Promise<SearchResponse> {
    const startTime = Date.now();

    // Generate embedding for query
    const embedding = await this.embeddingService.generate(query);

    // Build SQL query with filters
    let sqlQuery = `
      SELECT 
        id,
        title,
        content_text,
        source,
        source_url,
        book_reference,
        syllabus_tags,
        content_type,
        1 - (embedding <=> $1) as similarity
      FROM search_index
      WHERE 1=1
    `;

    const params: any[] = [embedding];
    let paramIndex = 2;

    // Add filters
    if (filters.sources && filters.sources.length > 0) {
      sqlQuery += ` AND source = ANY($${paramIndex})`;
      params.push(filters.sources);
      paramIndex++;
    }

    if (filters.content_type && filters.content_type.length > 0) {
      sqlQuery += ` AND content_type = ANY($${paramIndex})`;
      params.push(filters.content_type);
      paramIndex++;
    }

    if (filters.syllabus_area && filters.syllabus_area.length > 0) {
      sqlQuery += ` AND syllabus_tags && $${paramIndex}`;
      params.push(filters.syllabus_area);
      paramIndex++;
    }

    if (filters.date_range) {
      sqlQuery += ` AND created_at >= $${paramIndex} AND created_at <= $${paramIndex + 1}`;
      params.push(filters.date_range.from, filters.date_range.to);
      paramIndex += 2;
    }

    sqlQuery += ` ORDER BY embedding <=> $1 LIMIT $${paramIndex}`;
    params.push(limit);

    // Execute query
    const { data, error } = await this.supabase.rpc('exec_sql', {
      query: sqlQuery,
      params
    });

    if (error) throw error;

    // Format results
    const results: SearchResult[] = data.map((row: any) => ({
      id: row.id,
      title: row.title,
      content: this.highlightMatch(row.content_text, query),
      source: row.source,
      source_url: row.source_url,
      book_reference: row.book_reference,
      syllabus_mapping: row.syllabus_tags || [],
      relevance_score: row.similarity,
      content_type: row.content_type,
      highlighted_text: this.extractRelevantSnippet(row.content_text, query),
      explainability: {
        why_matched: this.generateExplainability(row, query),
        key_concepts: this.extractKeyConcepts(query)
      }
    }));

    const searchTimeMs = Date.now() - startTime;

    // Generate suggested answer snippet
    const suggestedAnswerSnippet = await this.generateAnswerSnippet(query, results);

    // Generate related queries
    const relatedQueries = await this.generateRelatedQueries(query);

    // Save search history (if authenticated)
    await this.saveSearchHistory(query, filters, results.length);

    return {
      results,
      total_results: results.length,
      search_time_ms: searchTimeMs,
      suggested_answer_snippet: suggestedAnswerSnippet,
      related_queries: relatedQueries
    };
  }

  private highlightMatch(text: string, query: string): string {
    // Simple highlight implementation
    const words = query.toLowerCase().split(' ');
    let highlighted = text;
    
    words.forEach(word => {
      if (word.length > 3) {
        const regex = new RegExp(`(${word})`, 'gi');
        highlighted = highlighted.replace(regex, '<mark>$1</mark>');
      }
    });

    return highlighted;
  }

  private extractRelevantSnippet(text: string, query: string, length: number = 200): string {
    const words = query.toLowerCase().split(' ');
    const sentences = text.split('. ');
    
    for (const sentence of sentences) {
      if (words.some(word => sentence.toLowerCase().includes(word))) {
        return sentence.length > length ? sentence.substring(0, length) + '...' : sentence;
      }
    }

    return text.substring(0, length) + '...';
  }

  private generateExplainability(row: any, query: string): string {
    const reasons: string[] = [];
    
    if (row.similarity > 0.8) {
      reasons.push('High semantic similarity to your query');
    }
    
    if (row.syllabus_tags?.some((tag: string) => query.toLowerCase().includes(tag.toLowerCase()))) {
      reasons.push('Matches syllabus topics in your query');
    }
    
    if (row.source) {
      reasons.push(`From trusted source: ${row.source}`);
    }

    return reasons.join('. ') || 'Relevant content match';
  }

  private extractKeyConcepts(query: string): string[] {
    // Simple implementation - extract significant words
    return query
      .toLowerCase()
      .split(' ')
      .filter(word => word.length > 4 && !['about', 'what', 'which', 'their', 'there'].includes(word))
      .slice(0, 5);
  }

  private async generateAnswerSnippet(query: string, results: SearchResult[]): Promise<string> {
    // Use AI to generate a concise answer from search results
    const context = results.slice(0, 3).map(r => r.content).join('\n\n');
    
    // Call AI service (9Router/Groq)
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `Based on this context, provide a concise answer to: ${query}\n\nContext: ${context.substring(0, 1000)}`,
        max_tokens: 150
      })
    });

    const data = await response.json();
    return data.response || '';
  }

  private async generateRelatedQueries(query: string): Promise<string[]> {
    // Generate related search queries using AI
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `Generate 5 related search queries for: "${query}". Return as JSON array.`,
        max_tokens: 100
      })
    });

    const data = await response.json();
    return data.response || [];
  }

  private async saveSearchHistory(query: string, filters: SearchFilters, resultsCount: number) {
    // Only save for authenticated users
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (user) {
      await this.supabase.from('search_history').insert({
        user_id: user.id,
        query,
        filters: JSON.stringify(filters),
        results_count: resultsCount
      });
    }
  }
}

export const ragSearchEngine = new RAGSearchEngine();
```

---

### API Endpoint: `src/app/api/search/query/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ragSearchEngine, SearchFilters } from '@/lib/search/rag-search-engine';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, filters, limit = 20 } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Validate filters
    const searchFilters: SearchFilters = {};
    
    if (filters?.sources) searchFilters.sources = filters.sources;
    if (filters?.content_type) searchFilters.content_type = filters.content_type;
    if (filters?.syllabus_area) searchFilters.syllabus_area = filters.syllabus_area;
    if (filters?.date_range) searchFilters.date_range = filters.date_range;

    // Perform search
    const results = await ragSearchEngine.search(query, searchFilters, limit);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'RAG Search Engine API',
    endpoints: {
      search: 'POST /api/search/query',
      history: 'GET /api/search/history',
      saved: 'GET /api/search/saved'
    }
  });
}
```

---

### UI Component: `src/components/search/search-interface.tsx`

```typescript
'use client';

import { useState } from 'react';
import { SearchFilters } from '@/lib/search/rag-search-engine';
import { SearchFiltersComponent } from './search-filters';
import { SearchResultCard } from './result-card';
import { ExplainabilityBox } from './explainability-box';

export function SearchInterface() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [suggestedAnswer, setSuggestedAnswer] = useState('');
  const [relatedQueries, setRelatedQueries] = useState<string[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/search/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, filters, limit: 20 })
      });

      const data = await response.json();
      
      setResults(data.results);
      setSearchTime(data.search_time_ms);
      setSuggestedAnswer(data.suggested_answer_snippet);
      setRelatedQueries(data.related_queries);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Search Box */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search UPSC syllabus, notes, videos, PYQs..."
            className="w-full px-6 py-4 text-lg border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Filters */}
      <SearchFiltersComponent 
        filters={filters} 
        onChange={setFilters} 
      />

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Searching across UPSC sources...</p>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Found {results.length} results in {searchTime}ms
            </p>
          </div>

          {/* Suggested Answer */}
          {suggestedAnswer && (
            <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-xl">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                📝 Suggested Answer
              </h3>
              <p className="text-gray-700">{suggestedAnswer}</p>
            </div>
          )}

          {/* Results */}
          <div className="space-y-4">
            {results.map((result) => (
              <SearchResultCard key={result.id} result={result} />
            ))}
          </div>

          {/* Related Queries */}
          {relatedQueries.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-3">Related Searches</h3>
              <div className="flex flex-wrap gap-2">
                {relatedQueries.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(q)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {!loading && query && results.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No results found. Try different keywords or filters.</p>
        </div>
      )}
    </div>
  );
}
```

---

## 📁 FILES TO CREATE THIS WEEK

### Day 1: Production Fixes
- [ ] Verify env vars in Coolify
- [ ] Test `/api/test/connection` endpoint
- [ ] Check NextAuth configuration

### Day 2-3: Feature 18 (RAG Search)
- [ ] `supabase/migrations/018_rag_search_engine.sql`
- [ ] `src/lib/search/rag-search-engine.ts`
- [ ] `src/lib/search/embedding-service.ts`
- [ ] `src/app/api/search/query/route.ts`
- [ ] `src/components/search/search-interface.tsx`
- [ ] `src/components/search/search-filters.tsx`
- [ ] `src/components/search/result-card.tsx`
- [ ] `src/components/search/explainability-box.tsx`

### Day 4-5: Feature 10 (Notes Generator)
- [ ] `supabase/migrations/019_notes_generator.sql`
- [ ] `src/lib/notes/notes-generator.ts`
- [ ] `src/app/api/notes/generate/route.ts`
- [ ] `src/components/notes/notes-generator-form.tsx`

---

## ✅ WEEK 1 SUCCESS CRITERIA

- [ ] No localhost redirects after signup
- [ ] Supabase connection working
- [ ] RAG Search returning results in <1s
- [ ] Search UI functional with filters
- [ ] Notes generator API working
- [ ] At least 100 documents indexed for search

---

**Ready to start implementation!**
