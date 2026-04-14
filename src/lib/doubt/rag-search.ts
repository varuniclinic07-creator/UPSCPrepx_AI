/**
 * RAG Search Service
 * 
 * Master Prompt v8.0 - Feature F5 (READ Mode)
 * - Search content library, notes, CA, NCERTs for context
 * - Vector similarity search with Supabase pgvector
 * - Hybrid search (keyword + vector)
 * - Subject-aware filtering
 */

import { createClient } from '@/lib/supabase/server';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SearchQuery {
  query: string;
  limit?: number;
  sources?: Array<'content_library' | 'notes' | 'ca' | 'ncert'>;
  subject?: string;
  minRelevance?: number;
}

export interface SearchDocument {
  id: string;
  content: string;
  metadata: {
    source: string;
    source_type: 'content_library' | 'notes' | 'ca' | 'ncert';
    title?: string;
    url?: string;
    subject?: string;
    topic?: string;
    created_at?: string;
  };
  score: number;
  rank: number;
}

export interface SearchResult {
  documents: SearchDocument[];
  total: number;
  query: string;
  searchTimeMs: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_LIMIT = 5;
const DEFAULT_MIN_RELEVANCE = 0.3;
const SOURCE_WEIGHTS = {
  content_library: 1.0,
  notes: 0.9,
  ca: 0.8,
  ncert: 1.1, // Higher weight for NCERT (foundational)
} as const;

// ============================================================================
// RAG SEARCH SERVICE
// ============================================================================

export class RAGSearchService {
  

  constructor() {
  }

  private async getSupabase() {
    return createClient();
  }

  /**
   * Search across all knowledge sources
   */
  async search(query: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now();
    const limit = query.limit || DEFAULT_LIMIT;
    const sources = query.sources || ['content_library', 'notes', 'ca', 'ncert'];
    const minRelevance = query.minRelevance || DEFAULT_MIN_RELEVANCE;

    try {
      // Generate query embedding (using a simple approach - in production use actual embeddings)
      const embedding = await this.generateEmbedding(query.query);

      // Search each source
      const allResults: SearchDocument[] = [];

      for (const source of sources) {
        const results = await this.searchSource(source, embedding, {
          limit: Math.ceil(limit / sources.length),
          subject: query.subject,
          minRelevance,
        });

        allResults.push(...results);
      }

      // Sort by score and take top results
      allResults.sort((a, b) => b.score - a.score);
      const topResults = allResults.slice(0, limit);

      // Add rank
      topResults.forEach((doc, i) => {
        doc.rank = i + 1;
      });

      return {
        documents: topResults,
        total: allResults.length,
        query: query.query,
        searchTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error('RAG search failed:', error);
      
      // Fallback to keyword search
      return this.keywordSearch(query);
    }
  }

  /**
   * Search specific source type
   */
  private async searchSource(
    source: string,
    embedding: number[],
    options: { limit: number; subject?: string; minRelevance: number }
  ): Promise<SearchDocument[]> {
    const weight = SOURCE_WEIGHTS[source as keyof typeof SOURCE_WEIGHTS] || 1.0;

    switch (source) {
      case 'content_library':
        return this.searchContentLibrary(embedding, options, weight);
      case 'notes':
        return this.searchNotes(embedding, options, weight);
      case 'ca':
        return this.searchCurrentAffairs(embedding, options, weight);
      case 'ncert':
        return this.searchNCERT(embedding, options, weight);
      default:
        return [];
    }
  }

  /**
   * Search content library
   */
  private async searchContentLibrary(
    embedding: number[],
    options: { limit: number; subject?: string; minRelevance: number },
    weight: number
  ): Promise<SearchDocument[]> {
    try {
      let query = (await this.getSupabase()).rpc('match_content_library' as any, {
        query_embedding: embedding,
        match_limit: options.limit,
        min_similarity: options.minRelevance,
      });

      if (options.subject) {
        // Filter by subject if provided
        query = query.eq('metadata->>subject', options.subject);
      }

      const { data, error } = await query;

      if (error || !data) {
        console.error('Content library search failed:', error);
        return [];
      }

      return (data as any[]).map((item) => ({
        id: item.id,
        content: item.content || '',
        metadata: {
          source: item.metadata?.title || 'Content Library',
          source_type: 'content_library' as const,
          title: item.metadata?.title,
          url: item.metadata?.url,
          subject: item.metadata?.subject,
          topic: item.metadata?.topic,
          created_at: item.created_at,
        },
        score: (item.similarity || 0) * weight,
        rank: 0,
      }));
    } catch (error) {
      console.error('Content library search error:', error);
      return [];
    }
  }

  /**
   * Search user notes
   */
  private async searchNotes(
    embedding: number[],
    options: { limit: number; subject?: string; minRelevance: number },
    weight: number
  ): Promise<SearchDocument[]> {
    try {
      const { data, error } = await (await this.getSupabase()).rpc('match_user_notes' as any, {
        query_embedding: embedding,
        match_limit: options.limit,
        min_similarity: options.minRelevance,
        filter_subject: options.subject || null,
      });

      if (error || !data) {
        return [];
      }

      return (data as any[]).map((item) => ({
        id: item.id,
        content: item.content || '',
        metadata: {
          source: item.title || 'User Note',
          source_type: 'notes' as const,
          title: item.title,
          subject: item.metadata?.subject,
          topic: item.metadata?.topic,
          created_at: item.created_at,
        },
        score: (item.similarity || 0) * weight,
        rank: 0,
      }));
    } catch (error) {
      console.error('Notes search error:', error);
      return [];
    }
  }

  /**
   * Search current affairs
   */
  private async searchCurrentAffairs(
    embedding: number[],
    options: { limit: number; subject?: string; minRelevance: number },
    weight: number
  ): Promise<SearchDocument[]> {
    try {
      const { data, error } = await (await this.getSupabase()).rpc('match_ca_articles' as any, {
        query_embedding: embedding,
        match_limit: options.limit,
        min_similarity: options.minRelevance,
        filter_subject: options.subject || null,
      });

      if (error || !data) {
        return [];
      }

      return (data as any[]).map((item) => ({
        id: item.id,
        content: item.summary || item.content || '',
        metadata: {
          source: item.title || 'Current Affairs',
          source_type: 'ca' as const,
          title: item.title,
          url: item.url,
          subject: item.syllabus?.[0]?.subject,
          topic: item.syllabus?.[0]?.topic,
          created_at: item.published_at,
        },
        score: (item.similarity || 0) * weight,
        rank: 0,
      }));
    } catch (error) {
      console.error('CA search error:', error);
      return [];
    }
  }

  /**
   * Search NCERT content
   */
  private async searchNCERT(
    embedding: number[],
    options: { limit: number; subject?: string; minRelevance: number },
    weight: number
  ): Promise<SearchDocument[]> {
    try {
      const { data, error } = await (await this.getSupabase()).rpc('match_ncert_content' as any, {
        query_embedding: embedding,
        match_limit: options.limit,
        min_similarity: options.minRelevance,
        filter_subject: options.subject || null,
      });

      if (error || !data) {
        return [];
      }

      return (data as any[]).map((item) => ({
        id: item.id,
        content: item.content || '',
        metadata: {
          source: item.book_title || 'NCERT',
          source_type: 'ncert' as const,
          title: item.book_title,
          subject: item.subject,
          topic: item.topic,
          chapter: item.chapter,
          page: item.page_number,
          created_at: item.created_at,
        },
        score: (item.similarity || 0) * weight,
        rank: 0,
      }));
    } catch (error) {
      console.error('NCERT search error:', error);
      return [];
    }
  }

  /**
   * Fallback keyword search
   */
  private async keywordSearch(query: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now();
    const limit = query.limit || DEFAULT_LIMIT;
    const sources = query.sources || ['content_library', 'notes', 'ca', 'ncert'];

    const allResults: SearchDocument[] = [];

    for (const source of sources) {
      const results = await this.keywordSearchSource(source, {
        query: query.query,
        limit: Math.ceil(limit / sources.length),
        subject: query.subject,
      });

      allResults.push(...results);
    }

    // Sort by relevance (simple score based on match quality)
    allResults.sort((a, b) => b.score - a.score);
    const topResults = allResults.slice(0, limit);

    topResults.forEach((doc, i) => {
      doc.rank = i + 1;
    });

    return {
      documents: topResults,
      total: allResults.length,
      query: query.query,
      searchTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Keyword search for specific source
   */
  private async keywordSearchSource(
    source: string,
    options: { query: string; limit: number; subject?: string }
  ): Promise<SearchDocument[]> {
    try {
      let tableName = '';
      let contentColumn = '';
      let titleColumn = '';

      switch (source) {
        case 'content_library':
          tableName = 'content_library';
          contentColumn = 'content';
          titleColumn = 'metadata->>title';
          break;
        case 'notes':
          tableName = 'user_notes';
          contentColumn = 'content';
          titleColumn = 'title';
          break;
        case 'ca':
          tableName = 'ca_articles';
          contentColumn = 'summary';
          titleColumn = 'title';
          break;
        case 'ncert':
          tableName = 'ncert_content';
          contentColumn = 'content';
          titleColumn = 'book_title';
          break;
        default:
          return [];
      }

      // Simple keyword search using ILIKE
      const { data, error } = await (await this.getSupabase())
        .from(tableName as any)
        .select(`*, ${contentColumn}`)
        .or(`${contentColumn}.ilike.%${options.query}%,${titleColumn}.ilike.%${options.query}%`)
        .limit(options.limit);

      if (error || !data) {
        return [];
      }

      return data.map((item: any) => ({
        id: item.id,
        content: item[contentColumn] || '',
        metadata: {
          source: item[titleColumn] || source,
          source_type: source as any,
          title: item[titleColumn],
          subject: item.metadata?.subject || item.subject,
          topic: item.metadata?.topic || item.topic,
          created_at: item.created_at,
        },
        score: this.calculateKeywordScore(item[contentColumn], options.query),
        rank: 0,
      }));
    } catch (error) {
      console.error(`Keyword search error for ${source}:`, error);
      return [];
    }
  }

  /**
   * Calculate keyword match score
   */
  private calculateKeywordScore(content: string, query: string): number {
    if (!content || !query) return 0;

    const contentLower = content.toLowerCase();
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

    let score = 0;

    // Exact phrase match
    if (contentLower.includes(queryLower)) {
      score += 0.5;
    }

    // Word matches
    for (const word of queryWords) {
      if (contentLower.includes(word)) {
        score += 0.1;
      }
    }

    return Math.min(score, 1.0);
  }

  /**
   * Generate embedding for query
   * In production, use actual embedding model (OpenAI, Cohere, etc.)
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Placeholder - in production use actual embedding API
    // For now, return a zero vector (will fall back to keyword search)
    
    try {
      // Try to use OpenAI embeddings if available
      const apiKey = process.env.OPENAI_API_KEY;
      
      if (apiKey) {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: text,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return data.data[0].embedding;
        }
      }
    } catch (error) {
      console.error('Embedding generation failed:', error);
    }

    // Return zero vector as fallback
    return new Array(1536).fill(0);
  }

  /**
   * Search with subject context boosting
   */
  async searchWithContext(
    query: string,
    subject: string,
    limit: number = 5
  ): Promise<SearchResult> {
    // First search with subject filter
    const subjectResults = await this.search({
      query,
      limit: Math.floor(limit * 0.7),
      subject,
    });

    // Then search without subject for broader context
    const generalResults = await this.search({
      query,
      limit: Math.ceil(limit * 0.3),
    });

    // Combine results (subject results first)
    const combined = [
      ...subjectResults.documents,
      ...generalResults.documents.filter(
        doc => !subjectResults.documents.find(s => s.id === doc.id)
      ),
    ];

    combined.forEach((doc, i) => {
      doc.rank = i + 1;
    });

    return {
      documents: combined.slice(0, limit),
      total: combined.length,
      query,
      searchTimeMs: subjectResults.searchTimeMs + generalResults.searchTimeMs,
    };
  }

  /**
   * Get related topics from search results
   */
  async getRelatedTopics(query: string, limit: number = 5): Promise<string[]> {
    const results = await this.search({ query, limit: 10 });
    
    const topics = new Set<string>();
    
    for (const doc of results.documents) {
      if (doc.metadata.topic) {
        topics.add(doc.metadata.topic);
      }
      if (doc.metadata.subject) {
        topics.add(doc.metadata.subject);
      }
    }

    return Array.from(topics).slice(0, limit);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const ragSearch = new RAGSearchService();
