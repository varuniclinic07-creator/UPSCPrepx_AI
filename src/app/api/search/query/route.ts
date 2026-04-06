/**
 * BMAD Phase 4: Feature 18 - RAG-based Perfect UPSC Search Engine
 * API Endpoint: POST /api/search/query
 * 
 * Implements semantic search across UPSC content with:
 * - Vector similarity search (pgvector)
 * - Source citations
 * - Book/chapter references
 * - Explainability box
 * - Suggested answer snippets
 * - Related queries
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { embeddingService } from '@/lib/search/embedding-service';
import { aiRouter } from '@/lib/ai/ai-router';

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

/**
 * POST /api/search/query
 * Search UPSC content using vector similarity + full-text search
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { query, filters, limit = 20 } = body;

    // Validate query
    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json(
        { error: 'Query is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate limit
    const searchLimit = Math.min(Math.max(1, limit), 100);

    // Generate embedding for query
    const embedding = await embeddingService.generate(query);

    // Initialize Supabase client
    const supabase = createClient();

    // Build filter conditions
    const filterConditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.sources && filters.sources.length > 0) {
      filterConditions.push(`source = ANY($${paramIndex})`);
      params.push(filters.sources);
      paramIndex++;
    }

    if (filters?.content_type && filters.content_type.length > 0) {
      filterConditions.push(`content_type = ANY($${paramIndex})`);
      params.push(filters.content_type);
      paramIndex++;
    }

    if (filters?.syllabus_area && filters.syllabus_area.length > 0) {
      filterConditions.push(`syllabus_tags && $${paramIndex}`);
      params.push(filters.syllabus_area);
      paramIndex++;
    }

    if (filters?.date_range) {
      filterConditions.push(`created_at >= $${paramIndex} AND created_at <= $${paramIndex + 1}`);
      params.push(filters.date_range.from, filters.date_range.to);
      paramIndex += 2;
    }

    // Build WHERE clause
    const whereClause = filterConditions.length > 0 
      ? `WHERE ${filterConditions.join(' AND ')}` 
      : '';

    // Execute vector similarity search using database function
    const { data, error } = await supabase.rpc('search_content', {
      query_embedding: embedding,
      filter_sources: filters?.sources || null,
      filter_content_types: filters?.content_type || null,
      filter_syllabus_tags: filters?.syllabus_area || null,
      limit_results: searchLimit
    });

    if (error) {
      console.error('Search RPC error:', error);
      throw error;
    }

    // Format results
    const results: SearchResult[] = (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      content: highlightMatch(row.content_text, query),
      source: row.source || 'Unknown',
      source_url: row.source_url,
      book_reference: row.book_reference,
      syllabus_mapping: row.syllabus_tags || [],
      relevance_score: Math.round(row.similarity * 1000) / 1000,
      content_type: row.content_type,
      highlighted_text: extractRelevantSnippet(row.content_text, query),
      explainability: generateExplainability(row, query)
    }));

    const searchTimeMs = Date.now() - startTime;

    // Generate suggested answer snippet using AI
    const suggestedAnswerSnippet = await generateAnswerSnippet(query, results);

    // Generate related queries using AI
    const relatedQueries = await generateRelatedQueries(query);

    // Save search analytics (async, don't block response)
    saveSearchAnalytics(supabase, query, filters, results.length, searchTimeMs).catch(console.error);

    const response: SearchResponse = {
      results,
      total_results: results.length,
      search_time_ms: searchTimeMs,
      suggested_answer_snippet: suggestedAnswerSnippet,
      related_queries: relatedQueries
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { 
        error: 'Search failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        search_time_ms: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/search/query
 * Return API documentation
 */
export async function GET() {
  return NextResponse.json({
    name: 'RAG Search Engine API',
    version: '1.0.0',
    feature: 'BMAD Phase 4 - Feature 18',
    description: 'Semantic search across UPSC content with vector embeddings',
    endpoints: {
      search: {
        method: 'POST',
        path: '/api/search/query',
        body: {
          query: 'string (required)',
          filters: {
            sources: 'string[] (optional)',
            content_type: 'string[] (optional)',
            syllabus_area: 'string[] (optional)',
            date_range: '{ from: string, to: string } (optional)'
          },
          limit: 'number (optional, default: 20, max: 100)'
        }
      },
      history: {
        method: 'GET',
        path: '/api/search/history'
      },
      saved: {
        method: 'GET',
        path: '/api/search/saved'
      }
    },
    sources: [
      'pib', 'the_hindu', 'indian_express', 'vision_ias', 
      'drishti_ias', 'insights_ias', 'yojana', 'kurukshetra', 
      'arc_reports', 'ncert', 'standard_books'
    ],
    content_types: [
      'note', 'article', 'video', 'quiz', 
      'current_affairs', 'scheme', 'book_chapter'
    ]
  });
}

// ============ Helper Functions ============

/**
 * Highlight matched words in text
 */
function highlightMatch(text: string, query: string): string {
  if (!text) return '';
  
  const words = query.toLowerCase().split(' ').filter(w => w.length > 3);
  let highlighted = text;
  
  words.forEach(word => {
    const regex = new RegExp(`(${word})`, 'gi');
    highlighted = highlighted.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  });

  return highlighted;
}

/**
 * Extract relevant snippet containing query terms
 */
function extractRelevantSnippet(text: string, query: string, length: number = 200): string {
  if (!text) return '';
  
  const words = query.toLowerCase().split(' ').filter(w => w.length > 3);
  const sentences = text.split('. ');
  
  // Find first sentence containing query terms
  for (const sentence of sentences) {
    if (words.some(word => sentence.toLowerCase().includes(word))) {
      return sentence.length > length 
        ? sentence.substring(0, length) + '...' 
        : sentence;
    }
  }

  // Fallback: return beginning of text
  return text.substring(0, length) + '...';
}

/**
 * Generate explainability information for search result
 */
function generateExplainability(row: any, query: string): {
  why_matched: string;
  key_concepts: string[];
} {
  const reasons: string[] = [];
  
  // Check similarity score
  if (row.similarity > 0.85) {
    reasons.push('Very high semantic similarity to your query');
  } else if (row.similarity > 0.7) {
    reasons.push('High semantic similarity to your query');
  }
  
  // Check syllabus match
  if (row.syllabus_tags?.some((tag: string) => 
    query.toLowerCase().includes(tag.toLowerCase())
  )) {
    reasons.push('Matches syllabus topics in your query');
  }
  
  // Check source credibility
  const trustedSources = ['pib', 'ncert', 'vision_ias', 'drishti_ias'];
  if (row.source && trustedSources.includes(row.source.toLowerCase())) {
    reasons.push(`From trusted source: ${row.source}`);
  }

  // Extract key concepts from query
  const keyConcepts = query
    .toLowerCase()
    .split(' ')
    .filter(word => 
      word.length > 4 && 
      !['about', 'what', 'which', 'their', 'there', 'explain', 'describe'].includes(word)
    )
    .slice(0, 5);

  return {
    why_matched: reasons.join('. ') || 'Relevant content match',
    key_concepts: keyConcepts
  };
}

/**
 * Generate suggested answer snippet using AI
 */
async function generateAnswerSnippet(query: string, results: SearchResult[]): Promise<string> {
  try {
    // Get context from top 3 results
    const context = results.slice(0, 3).map(r => r.content).join('\n\n').replace(/<[^>]*>/g, '');
    
    if (!context.trim()) {
      return '';
    }

    // Use AI router to generate concise answer
    const response = await aiRouter.generate({
      prompt: `Based on this context, provide a concise 2-3 sentence answer to: ${query}\n\nContext: ${context.substring(0, 1500)}`,
      max_tokens: 150,
      temperature: 0.3
    });

    return response.text || '';
  } catch (error) {
    console.error('Failed to generate answer snippet:', error);
    return '';
  }
}

/**
 * Generate related search queries using AI
 */
async function generateRelatedQueries(query: string): Promise<string[]> {
  try {
    const response = await aiRouter.generate({
      prompt: `Generate exactly 5 related search queries for: "${query}". Return ONLY a JSON array of strings, nothing else. Example: ["related query 1", "related query 2"]`,
      max_tokens: 100,
      temperature: 0.7
    });

    // Parse JSON response
    const text = response.text.trim();
    const jsonMatch = text.match(/\[.*\]/s);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
    }
    
    return [];
  } catch (error) {
    console.error('Failed to generate related queries:', error);
    return [];
  }
}

/**
 * Save search analytics (non-blocking)
 */
async function saveSearchAnalytics(
  supabase: any,
  query: string,
  filters: any,
  resultsCount: number,
  searchTimeMs: number
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('search_analytics').insert({
      query,
      results_count: resultsCount,
      search_time_ms: searchTimeMs,
      user_id: user?.id || null,
      created_at: new Date().toISOString()
    });

    // Also save to search history if user is authenticated
    if (user) {
      await supabase.from('search_history').insert({
        user_id: user.id,
        query,
        filters: JSON.stringify(filters),
        results_count: resultsCount,
        search_time_ms: searchTimeMs
      });
    }
  } catch (error) {
    console.error('Failed to save search analytics:', error);
  }
}
