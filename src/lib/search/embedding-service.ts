/**
 * BMAD Phase 4: Feature 18 - RAG Search Engine
 * Embedding Service: Generate vector embeddings for semantic search
 * 
 * Uses AI providers (9Router primary, Groq/Ollama fallback) to generate
 * 1536-dimensional embeddings for search content.
 */

import { aiRouter } from '@/lib/ai/ai-router';

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface EmbeddingServiceConfig {
  model?: string;
  dimensions?: number;
  maxRetries?: number;
}

class EmbeddingService {
  private config: EmbeddingServiceConfig;

  constructor(config: EmbeddingServiceConfig = {}) {
    this.config = {
      model: 'text-embedding-ada-002',
      dimensions: 1536,
      maxRetries: 3,
      ...config
    };
  }

  /**
   * Generate embedding for a single text
   * @param text - The text to generate embedding for
   * @returns Promise<EmbeddingResponse>
   */
  async generate(text: string): Promise<number[]> {
    // Truncate text if too long (max 8191 tokens for ada-002)
    const truncatedText = this.truncateText(text, 8000);

    let lastError: Error | null = null;

    // Retry logic with exponential backoff
    for (let attempt = 1; attempt <= this.config.maxRetries!; attempt++) {
      try {
        const response = await this.callEmbeddingAPI(truncatedText);
        return response.embedding;
      } catch (error) {
        lastError = error as Error;
        console.error(`Embedding generation attempt ${attempt} failed:`, error);
        
        if (attempt < this.config.maxRetries!) {
          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Failed to generate embedding after ${this.config.maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Generate embeddings for multiple texts (batch)
   * @param texts - Array of texts to generate embeddings for
   * @returns Promise<number[][]>
   */
  async generateBatch(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    // Process in batches of 10 to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchEmbeddings = await Promise.all(
        batch.map(text => this.generate(text))
      );
      embeddings.push(...batchEmbeddings);
    }

    return embeddings;
  }

  /**
   * Call the embedding API using AI router
   */
  private async callEmbeddingAPI(text: string): Promise<EmbeddingResponse> {
    // Use 9Router as primary (configured in .env.production)
    const provider = process.env.PRIMARY_AI_PROVIDER || '9router';
    
    // For embeddings, we'll use Ollama as it supports embedding models
    // or fall back to a dedicated embedding endpoint
    const embeddingModel = process.env.EMBEDDING_MODEL || 'nomic-embed-text';

    try {
      // Try using Ollama for embeddings (cost-effective)
      const response = await fetch(`${process.env.OLLAMA_BASE_URL}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OLLAMA_API_KEY}`
        },
        body: JSON.stringify({
          model: embeddingModel,
          prompt: text
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        embedding: data.embedding,
        model: embeddingModel,
        usage: {
          prompt_tokens: Math.ceil(text.length / 4),
          total_tokens: Math.ceil(text.length / 4)
        }
      };
    } catch (error) {
      console.error('Ollama embedding failed, falling back to 9Router:', error);
      
      // Fallback: Use 9Router with a text embedding model
      const fallbackResponse = await fetch(`${process.env.NINE_ROUTER_BASE_URL}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NINE_ROUTER_API_KEY}`
        },
        body: JSON.stringify({
          model: 'text-embedding-ada-002',
          input: text
        })
      });

      if (!fallbackResponse.ok) {
        throw new Error(`9Router embedding error: ${fallbackResponse.status}`);
      }

      const data = await fallbackResponse.json();
      
      return {
        embedding: data.data[0].embedding,
        model: 'text-embedding-ada-002',
        usage: data.usage
      };
    }
  }

  /**
   * Truncate text to fit within token limit
   */
  private truncateText(text: string, maxTokens: number): string {
    // Rough estimation: 1 token ≈ 4 characters for English
    const maxChars = maxTokens * 4;
    
    if (text.length <= maxChars) {
      return text;
    }

    // Truncate and add ellipsis
    return text.substring(0, maxChars - 3) + '...';
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same dimension');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    
    if (denominator === 0) {
      return 0;
    }

    return dotProduct / denominator;
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService();

// Export class for custom instances
export { EmbeddingService };
