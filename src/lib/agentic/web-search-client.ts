/**
 * BMAD Phase 4: Feature 10 - Agentic Web Search Client
 * Connects to agentic-web-search service for live web search
 * Uses DuckDuckGo with UPSC-focused source prioritization
 */

export interface WebSearchQuery {
  query: string;
  maxResults?: number;
  upscFocused?: boolean;
  timeRange?: 'day' | 'week' | 'month' | 'year';
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  relevanceScore: number;
  sourceType: 'government' | 'current_affairs' | 'coaching' | 'report' | 'other';
  publishedDate?: string;
}

export interface WebSearchResponse {
  results: WebSearchResult[];
  totalResults: number;
  searchTimeMs: number;
  query: string;
}

export class WebSearchClient {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    // Connect to agentic-web-search service on VPS
    this.baseUrl = process.env.AGENTIC_WEB_SEARCH_URL || 'http://89.117.60.144:8030';
    this.timeout = 10000; // 10 seconds
  }

  /**
   * Search web for UPSC-relevant content
   */
  async search(query: WebSearchQuery): Promise<WebSearchResponse> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: query.query,
          max_results: query.maxResults || 10,
          upsc_focused: query.upscFocused ?? true,
          time_range: query.timeRange || 'month',
        }),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`Web search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        results: data.results.map((r: any) => ({
          title: r.title,
          url: r.url,
          snippet: r.snippet,
          relevanceScore: r.relevance_score || 0.5,
          sourceType: this.classifySourceType(r.url),
          publishedDate: r.published_date,
        })),
        totalResults: data.total_results || 0,
        searchTimeMs: Date.now() - startTime,
        query: query.query,
      };
    } catch (error) {
      console.error('Web search error:', error);
      
      // Fallback: Return empty results instead of failing
      return {
        results: [],
        totalResults: 0,
        searchTimeMs: Date.now() - startTime,
        query: query.query,
      };
    }
  }

  /**
   * Search specifically for current affairs
   */
  async searchCurrentAffairs(topic: string, daysBack: number = 7): Promise<WebSearchResponse> {
    return this.search({
      query: `${topic} current affairs UPSC`,
      maxResults: 15,
      upscFocused: true,
      timeRange: 'week',
    });
  }

  /**
   * Search for government sources only (PIB, PRS, etc.)
   */
  async searchGovernmentSources(topic: string): Promise<WebSearchResponse> {
    const query = `${topic} site:pib.gov.in OR site:prsindia.org OR site:india.gov.in`;
    
    return this.search({
      query,
      maxResults: 10,
      upscFocused: true,
    });
  }

  /**
   * Classify source type based on URL
   */
  private classifySourceType(url: string): WebSearchResult['sourceType'] {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('pib.gov') || 
        urlLower.includes('prsindia') || 
        urlLower.includes('gov.in') ||
        urlLower.includes('india.gov.in')) {
      return 'government';
    }
    
    if (urlLower.includes('thehindu') || 
        urlLower.includes('indianexpress') || 
        urlLower.includes('livemint') ||
        urlLower.includes('business-standard')) {
      return 'current_affairs';
    }
    
    if (urlLower.includes('visionias') || 
        urlLower.includes('drishtiias') || 
        urlLower.includes('iasbaba') ||
        urlLower.includes('insightsonindia')) {
      return 'coaching';
    }
    
    if (urlLower.includes('report') || 
        urlLower.includes('survey') ||
        urlLower.includes('arc') ||
        urlLower.includes('commission')) {
      return 'report';
    }
    
    return 'other';
  }

  /**
   * Get trending UPSC topics
   */
  async getTrendingTopics(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/trending`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.topics || [];
    } catch (error) {
      console.error('Get trending topics error:', error);
      return [];
    }
  }
}

// Singleton instance
let webSearchInstance: WebSearchClient | null = null;

export function getWebSearchClient(): WebSearchClient {
  if (!webSearchInstance) {
    webSearchInstance = new WebSearchClient();
  }
  return webSearchInstance;
}

/**
 * Check if the web search service URL is configured
 */
export function isWebSearchAvailable(): boolean {
  return !!process.env.AGENTIC_WEB_SEARCH_URL;
}

/**
 * Search web for UPSC content
 */
export async function searchWeb(
  query: string,
  limit?: number
): Promise<WebSearchResult[]> {
  const client = getWebSearchClient();
  const result = await client.search({ query, maxResults: limit || 10 });
  return result.results;
}

/**
 * Search news/current affairs
 */
export async function searchNews(
  query: string,
  limit?: number
): Promise<WebSearchResult[]> {
  const client = getWebSearchClient();
  const result = await client.searchCurrentAffairs(query);
  return result.results.slice(0, limit || 10);
}
