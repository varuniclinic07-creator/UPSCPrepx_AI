import {
  hasConfiguredDocChatServiceUrl,
  resolveDocChatServiceUrl,
} from './service-urls';

/**
 * BMAD Phase 4: Feature 10 - AutoDoc Thinker Client
 * Connects to autodoc-thinker service for document RAG
 * Multi-agent document processing with summarization
 */

export interface AutodocQuery {
  query: string;
  userId?: string;
  documentIds?: string[];
  maxResults?: number;
}

export interface AutodocResult {
  documentName: string;
  documentUrl: string;
  content: string;
  excerpt: string;
  relevanceScore: number;
  pageNumber?: number;
  chapter?: string;
}

export interface AutodocResponse {
  results: AutodocResult[];
  totalResults: number;
  processingTimeMs: number;
  query: string;
}

export class AutodocClient {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = resolveDocChatServiceUrl();
    this.timeout = 30000; // 30 seconds for document processing
  }

  /**
   * Analyze documents for query
   */
  async analyze(query: AutodocQuery): Promise<AutodocResponse> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.query,
          user_id: query.userId,
          document_ids: query.documentIds || [],
          max_results: query.maxResults || 5,
        }),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`AutoDoc analysis failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        results: data.results.map((r: any) => ({
          documentName: r.document_name,
          documentUrl: r.document_url,
          content: r.content,
          excerpt: r.excerpt,
          relevanceScore: r.relevance_score,
          pageNumber: r.page_number,
          chapter: r.chapter,
        })),
        totalResults: data.total_results || 0,
        processingTimeMs: Date.now() - startTime,
        query: query.query,
      };
    } catch (error) {
      console.error('AutoDoc error:', error);
      
      // Fallback: Return empty results
      return {
        results: [],
        totalResults: 0,
        processingTimeMs: Date.now() - startTime,
        query: query.query,
      };
    }
  }

  /**
   * Upload document for processing
   */
  async uploadDocument(file: File, userId: string): Promise<{ documentId: string; status: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId);

    try {
      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(this.timeout * 2), // Longer for uploads
      });

      if (!response.ok) {
        throw new Error(`Document upload failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Document upload error:', error);
      throw error;
    }
  }

  /**
   * Get list of user's processed documents
   */
  async getUserDocuments(userId: string): Promise<Array<{ id: string; name: string; status: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/documents/${userId}`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.documents || [];
    } catch (error) {
      console.error('Get documents error:', error);
      return [];
    }
  }
}

// Singleton instance
let autodocInstance: AutodocClient | null = null;

export function getAutodocClient(): AutodocClient {
  if (!autodocInstance) {
    autodocInstance = new AutodocClient();
  }
  return autodocInstance;
}

/**
 * Check if the autodoc service URL is configured
 */
export function isAutodocAvailable(): boolean {
  return hasConfiguredDocChatServiceUrl();
}

/**
 * Generate an explanation for content using the autodoc service
 */
export async function generateExplanation(
  content: string,
  context?: string
): Promise<string | null> {
  const client = getAutodocClient();
  const result = await client.analyze({
    query: context ? `Explain: ${content}\nContext: ${context}` : `Explain: ${content}`,
    maxResults: 1,
  });
  if (result.results.length > 0) {
    return result.results[0].content;
  }
  return null;
}
