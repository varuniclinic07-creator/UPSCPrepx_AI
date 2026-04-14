/**
 * BMAD Phase 4: Feature 10 - Agentic Orchestrator
 * Routes queries to appropriate agentic system based on intent
 * AI Providers: 9Router → Groq → Ollama (NOT A4F)
 */

import { WebSearchClient } from './web-search-client';
import { AutodocClient } from './autodoc-client';
import { FileSearchClient } from './file-search-client';
import { AIProviderClient } from '../ai/ai-provider-client';

export interface AgenticQuery {
  query: string;
  topic?: string;
  subject?: string;
  brevityLevel?: '100' | '250' | '500' | '1000' | 'comprehensive';
  includeCurrentAffairs?: boolean;
  includeStaticMaterials?: boolean;
  includeDocuments?: boolean;
  userId?: string;
}

export interface AgenticResult {
  content: string;
  sources: AgenticSource[];
  agenticSystemsUsed: string[];
  aiProviderUsed: string;
  wordCount: number;
  confidence: number;
  processingTimeMs: number;
}

export interface AgenticSource {
  system: 'web-search' | 'autodoc' | 'file-search';
  sourceName: string;
  sourceUrl?: string;
  sourceType: 'ncert' | 'standard_book' | 'government' | 'coaching' | 'current_affairs' | 'report';
  relevanceScore: number;
  excerpt?: string;
}

export class AgenticOrchestrator {
  private webSearchClient: WebSearchClient;
  private autodocClient: AutodocClient;
  private fileSearchClient: FileSearchClient;
  private aiProviderClient: AIProviderClient;

  constructor() {
    this.webSearchClient = new WebSearchClient();
    this.autodocClient = new AutodocClient();
    this.fileSearchClient = new FileSearchClient();
    this.aiProviderClient = new AIProviderClient();
  }

  /**
   * Analyze query intent and route to appropriate agentic systems
   */
  async processQuery(query: AgenticQuery): Promise<AgenticResult> {
    const startTime = Date.now();
    const agenticSystemsUsed: string[] = [];
    const allSources: AgenticSource[] = [];
    let rawContent: string[] = [];

    // Step 1: Analyze query intent
    const intent = await this.analyzeQueryIntent(query.query);

    // Step 2: Route to appropriate agentic systems
    // Web Search for current affairs
    if (query.includeCurrentAffairs || intent.needsCurrentAffairs) {
      try {
        const webResults = await this.webSearchClient.search({
          query: query.query,
          maxResults: 10,
          upscFocused: true,
        });
        agenticSystemsUsed.push('web-search');
        rawContent.push(...webResults.results.map(r => r.snippet));
        allSources.push(...webResults.results.map(r => ({
          system: 'web-search' as const,
          sourceName: r.title,
          sourceUrl: r.url,
          sourceType: this.classifySourceType(r.url),
          relevanceScore: r.relevanceScore,
          excerpt: r.snippet,
        })));
      } catch (error) {
        console.error('Web search failed:', error);
      }
    }

    // File Search for static materials (NCERTs, standard books)
    if (query.includeStaticMaterials || intent.needsStaticMaterials) {
      try {
        const fileResults = await this.fileSearchClient.search({
          query: query.query,
          subject: query.subject,
          maxResults: 5,
        });
        agenticSystemsUsed.push('file-search');
        rawContent.push(...fileResults.results.map(r => r.content));
        allSources.push(...fileResults.results.map(r => ({
          system: 'file-search' as const,
          sourceName: r.fileName,
          sourceUrl: r.fileUrl,
          sourceType: r.sourceType,
          relevanceScore: r.relevanceScore,
          excerpt: r.excerpt,
        })));
      } catch (error) {
        console.error('File search failed:', error);
      }
    }

    // AutoDoc for uploaded documents
    if (query.includeDocuments || intent.needsDocumentAnalysis) {
      try {
        const docResults = await this.autodocClient.analyze({
          query: query.query,
          userId: query.userId,
        });
        agenticSystemsUsed.push('autodoc');
        rawContent.push(...docResults.results.map(r => r.content));
        allSources.push(...docResults.results.map(r => ({
          system: 'autodoc' as const,
          sourceName: r.documentName,
          sourceUrl: r.documentUrl,
          sourceType: 'standard_book' as const,
          relevanceScore: r.relevanceScore,
          excerpt: r.excerpt,
        })));
      } catch (error) {
        console.error('AutoDoc failed:', error);
      }
    }

    // Step 3: Generate notes using AI Provider (9Router → Groq → Ollama)
    const generatedContent = await this.aiProviderClient.generateNotes({
      topic: query.topic || query.query,
      rawContent: rawContent.join('\n\n'),
      sources: allSources,
      brevityLevel: query.brevityLevel || 'comprehensive',
      subject: query.subject,
    });

    const processingTimeMs = Date.now() - startTime;

    return {
      content: generatedContent.content,
      sources: allSources,
      agenticSystemsUsed,
      aiProviderUsed: generatedContent.providerUsed,
      wordCount: this.countWords(generatedContent.content),
      confidence: generatedContent.confidence,
      processingTimeMs,
    };
  }

  /**
   * Analyze query to determine intent and routing
   */
  private async analyzeQueryIntent(query: string): Promise<{
    needsCurrentAffairs: boolean;
    needsStaticMaterials: boolean;
    needsDocumentAnalysis: boolean;
    topic: string;
    subject?: string;
  }> {
    // Use AI to analyze intent
    const analysis = await this.aiProviderClient.analyzeIntent(query);
    
    return {
      needsCurrentAffairs: analysis.needsCurrentAffairs,
      needsStaticMaterials: analysis.needsStaticMaterials,
      needsDocumentAnalysis: analysis.needsDocumentAnalysis,
      topic: analysis.topic,
      subject: analysis.subject,
    };
  }

  /**
   * Classify source type based on URL
   */
  private classifySourceType(url: string): AgenticSource['sourceType'] {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('pib.gov') || urlLower.includes('prsindia') || urlLower.includes('gov.in')) {
      return 'government';
    }
    if (urlLower.includes('thehindu') || urlLower.includes('indianexpress') || urlLower.includes('current')) {
      return 'current_affairs';
    }
    if (urlLower.includes('visionias') || urlLower.includes('drishtiias') || urlLower.includes('iasbaba')) {
      return 'coaching';
    }
    if (urlLower.includes('report') || urlLower.includes('survey')) {
      return 'report';
    }
    if (urlLower.includes('ncert')) {
      return 'ncert';
    }
    
    return 'standard_book';
  }

  /**
   * Count words in content
   */
  private countWords(content: string): number {
    return content.trim().split(/\s+/).length;
  }
}

// Singleton instance
let orchestratorInstance: AgenticOrchestrator | null = null;

export function getAgenticOrchestrator(): AgenticOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new AgenticOrchestrator();
  }
  return orchestratorInstance;
}
