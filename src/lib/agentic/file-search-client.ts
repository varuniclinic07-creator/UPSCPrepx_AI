/**
 * BMAD Phase 4: Feature 10 - Agentic File Search Client
 * Connects to agentic-file-search service for dynamic document navigation
 * Human-like file exploration without pre-computed embeddings
 */

export interface FileSearchQuery {
  query: string;
  subject?: string;
  category?: string;
  maxResults?: number;
  userId?: string;
}

export interface FileSearchResult {
  fileName: string;
  fileUrl: string;
  filePath: string;
  content: string;
  excerpt: string;
  relevanceScore: number;
  sourceType: 'ncert' | 'standard_book' | 'government' | 'coaching' | 'report';
  fileSize?: number;
  lastModified?: string;
}

export interface FileSearchResponse {
  results: FileSearchResult[];
  totalResults: number;
  searchTimeMs: number;
  query: string;
  reasoningPath?: string[];
}

export class FileSearchClient {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    // Connect to agentic-file-search service on VPS
    this.baseUrl = process.env.AGENTIC_FILE_SEARCH_URL || 'http://89.117.60.144:8032';
    this.timeout = 30000; // 30 seconds for file navigation
  }

  /**
   * Search files dynamically (no pre-computed embeddings)
   */
  async search(query: FileSearchQuery): Promise<FileSearchResponse> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.query,
          subject: query.subject,
          category: query.category,
          max_results: query.maxResults || 5,
          user_id: query.userId,
        }),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`File search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        results: data.results.map((r: any) => ({
          fileName: r.file_name,
          fileUrl: r.file_url,
          filePath: r.file_path,
          content: r.content,
          excerpt: r.excerpt,
          relevanceScore: r.relevance_score,
          sourceType: r.source_type || 'standard_book',
          fileSize: r.file_size,
          lastModified: r.last_modified,
        })),
        totalResults: data.total_results || 0,
        searchTimeMs: Date.now() - startTime,
        query: query.query,
        reasoningPath: data.reasoning_path,
      };
    } catch (error) {
      console.error('File search error:', error);
      
      // Fallback: Return empty results
      return {
        results: [],
        totalResults: 0,
        searchTimeMs: Date.now() - startTime,
        query: query.query,
      };
    }
  }

  /**
   * Search specifically in NCERT materials
   */
  async searchNCERTs(topic: string, className?: string): Promise<FileSearchResponse> {
    return this.search({
      query: topic,
      category: className || 'all',
      maxResults: 10,
    });
  }

  /**
   * Search in standard books (Laxmikanth, Spectrum, etc.)
   */
  async searchStandardBooks(topic: string, bookName?: string): Promise<FileSearchResponse> {
    return this.search({
      query: topic,
      category: bookName,
      maxResults: 5,
    });
  }

  /**
   * Get list of available materials by subject
   */
  async getMaterialsBySubject(subject: string): Promise<Array<{ name: string; url: string; type: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/materials/${subject}`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.materials || [];
    } catch (error) {
      console.error('Get materials error:', error);
      return [];
    }
  }
}

// Singleton instance
let fileSearchInstance: FileSearchClient | null = null;

export function getFileSearchClient(): FileSearchClient {
  if (!fileSearchInstance) {
    fileSearchInstance = new FileSearchClient();
  }
  return fileSearchInstance;
}

/**
 * Check if the file search service URL is configured
 */
export function isFileSearchAvailable(): boolean {
  return !!process.env.AGENTIC_FILE_SEARCH_URL;
}

/**
 * Search files using the file search service
 */
export async function searchFiles(
  query: string,
  limit?: number
): Promise<FileSearchResult[]> {
  const client = getFileSearchClient();
  const result = await client.search({ query, maxResults: limit || 10 });
  return result.results;
}
