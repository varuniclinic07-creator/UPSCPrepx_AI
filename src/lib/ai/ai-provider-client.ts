/**
 * BMAD Phase 4: Feature 10 - AI Provider Client
 * AI Provider Routing: 9Router → Groq → Ollama (NOT A4F)
 * Implements fallback mechanism with 7-key Groq rotation
 */

import { AgenticSource } from '../agentic/agentic-orchestrator';

export interface AIProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  priority: number;
  rateLimitRPM: number;
  rateLimitConcurrent: number;
  isActive: boolean;
}

export interface NotesGenerationRequest {
  topic: string;
  rawContent: string;
  sources: AgenticSource[];
  brevityLevel: '100' | '250' | '500' | '1000' | 'comprehensive';
  subject?: string;
}

export interface NotesGenerationResponse {
  content: string;
  providerUsed: string;
  confidence: number;
  wordCount: number;
}

export interface IntentAnalysis {
  needsCurrentAffairs: boolean;
  needsStaticMaterials: boolean;
  needsDocumentAnalysis: boolean;
  topic: string;
  subject?: string;
}

export class AIProviderClient {
  private providers: AIProviderConfig[];
  private currentProviderIndex: number = 0;
  private providerHealth: Map<string, boolean> = new Map();
  private providerFailures: Map<string, number> = new Map();
  private groqKeys: string[];
  private currentGroqKeyIndex: number = 0;

  constructor() {
    // CRITICAL: AI Provider Priority (NOT A4F - user specified)
    this.providers = [
      {
        name: '9router',
        baseUrl: process.env.NINE_ROUTER_BASE_URL || 'https://r94p885.9router.com/v1',
        apiKey: process.env.NINE_ROUTER_API_KEY || 'sk-da7a2ad945e26f3a-qsxe57-15d6ca9a',
        model: process.env.NINE_ROUTER_MODEL || 'upsc',
        priority: 1, // Primary
        rateLimitRPM: 60,
        rateLimitConcurrent: 20,
        isActive: true,
      },
      {
        name: 'groq',
        baseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
        apiKey: '', // Will use rotation from groqKeys
        model: process.env.GROQ_MODEL || 'groq/llama-3.3-70b-versatile',
        priority: 2, // Fallback 1
        rateLimitRPM: 30,
        rateLimitConcurrent: 10,
        isActive: true,
      },
      {
        name: 'ollama',
        baseUrl: process.env.OLLAMA_BASE_URL || 'https://ollama.com/v1',
        apiKey: process.env.OLLAMA_API_KEY || 'bda967ce912e42a3b775782ddf7a6360.PFAbR3YJIolgYV0JkKMNDocN',
        model: process.env.OLLAMA_MODEL || 'qwen3.5:397b-cloud',
        priority: 3, // Fallback 2
        rateLimitRPM: 20,
        rateLimitConcurrent: 5,
        isActive: true,
      },
    ];

    // Groq 7-key rotation (user provided)
    this.groqKeys = [
      'REPLACE_WITH_YOUR_GROQ_KEY',
      'REPLACE_WITH_YOUR_GROQ_KEY',
      'REPLACE_WITH_YOUR_GROQ_KEY',
      'REPLACE_WITH_YOUR_GROQ_KEY',
      'REPLACE_WITH_YOUR_GROQ_KEY',
      'REPLACE_WITH_YOUR_GROQ_KEY',
      'REPLACE_WITH_YOUR_GROQ_KEY',
    ];

    // Initialize health status
    this.providers.forEach(p => this.providerHealth.set(p.name, true));
    this.providers.forEach(p => this.providerFailures.set(p.name, 0));
  }

  /**
   * Generate notes using AI provider with fallback
   */
  async generateNotes(request: NotesGenerationRequest): Promise<NotesGenerationResponse> {
    const startTime = Date.now();
    
    // Try providers in priority order
    for (const provider of this.providers.sort((a, b) => a.priority - b.priority)) {
      if (!provider.isActive || this.providerHealth.get(provider.name) === false) {
        continue;
      }

      try {
        const apiKey = provider.name === 'groq' ? this.getGroqKey() : provider.apiKey;
        
        const response = await this.callProvider(provider, apiKey, request);
        
        // Mark provider as healthy
        this.providerHealth.set(provider.name, true);
        this.providerFailures.set(provider.name, 0);
        
        if (provider.name === 'groq') {
          this.rotateGroqKey();
        }
        
        return {
          content: response.content,
          providerUsed: provider.name,
          confidence: response.confidence,
          wordCount: response.content.trim().split(/\s+/).length,
        };
      } catch (error) {
        console.error(`Provider ${provider.name} failed:`, error);
        
        // Mark provider as unhealthy after 3 failures
        const failures = (this.providerFailures.get(provider.name) || 0) + 1;
        this.providerFailures.set(provider.name, failures);
        
        if (failures >= 3) {
          this.providerHealth.set(provider.name, false);
          console.warn(`Provider ${provider.name} marked unhealthy after ${failures} failures`);
        }
        
        // Continue to next provider
        continue;
      }
    }
    
    // All providers failed
    throw new Error('All AI providers failed - service temporarily unavailable');
  }

  /**
   * Call individual provider API
   */
  private async callProvider(
    provider: AIProviderConfig,
    apiKey: string,
    request: NotesGenerationRequest
  ): Promise<{ content: string; confidence: number }> {
    const prompt = this.buildNotesPrompt(request);
    
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert UPSC CSE educator. Generate comprehensive, accurate notes for UPSC aspirants. 
            - Use formal, educational tone
            - Include relevant examples and case studies
            - Add memory tips and mnemonics
            - Cite sources where applicable
            - Keep language at 10th standard comprehension level
            - Focus on exam-relevant content`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: this.getMaxTokensForBrevity(request.brevityLevel),
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`Provider ${provider.name} returned ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    return {
      content: this.formatNotes(content, request),
      confidence: 0.9, // High confidence for successful generation
    };
  }

  /**
   * Build prompt for notes generation
   */
  private buildNotesPrompt(request: NotesGenerationRequest): string {
    const brevityInstructions = {
      '100': 'Generate exactly 100 words - ultra-concise key points only',
      '250': 'Generate exactly 250 words - brief overview with key concepts',
      '500': 'Generate exactly 500 words - comprehensive summary',
      '1000': 'Generate exactly 1000 words - detailed notes',
      'comprehensive': 'Generate comprehensive detailed notes (1500-2000 words)',
    };

    let prompt = `Generate UPSC notes on: ${request.topic}\n\n`;
    prompt += `Subject: ${request.subject || 'General'}\n`;
    prompt += `Instruction: ${brevityInstructions[request.brevityLevel]}\n\n`;
    
    if (request.rawContent) {
      prompt += `Source Material:\n${request.rawContent}\n\n`;
    }
    
    if (request.sources.length > 0) {
      prompt += `Sources to cite:\n`;
      request.sources.forEach((source, i) => {
        prompt += `${i + 1}. ${source.sourceName} (${source.sourceType})\n`;
      });
      prompt += '\n';
    }
    
    prompt += `Output Format:\n`;
    prompt += `# ${request.topic}\n\n`;
    prompt += `## Key Concepts\n`;
    prompt += `## Detailed Explanation\n`;
    prompt += `## Examples/Case Studies\n`;
    prompt += `## Memory Tips\n`;
    prompt += `## Sources\n`;
    
    return prompt;
  }

  /**
   * Format generated notes
   */
  private formatNotes(content: string, request: NotesGenerationRequest): string {
    // Ensure proper markdown formatting
    let formatted = content.trim();
    
    // Add topic header if missing
    if (!formatted.startsWith('#')) {
      formatted = `# ${request.topic}\n\n${formatted}`;
    }
    
    // Add sources section if missing
    if (!formatted.includes('## Sources') && request.sources.length > 0) {
      formatted += '\n\n## Sources\n';
      request.sources.forEach((source, i) => {
        formatted += `${i + 1}. ${source.sourceName}`;
        if (source.sourceUrl) {
          formatted += ` - ${source.sourceUrl}`;
        }
        formatted += '\n';
      });
    }
    
    return formatted;
  }

  /**
   * Analyze query intent
   */
  async analyzeIntent(query: string): Promise<IntentAnalysis> {
    const primaryProvider = this.providers.find(p => p.priority === 1 && p.isActive);
    
    if (!primaryProvider) {
      // Fallback to simple keyword matching
      return this.simpleIntentAnalysis(query);
    }

    try {
      const response = await fetch(`${primaryProvider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${primaryProvider.apiKey}`,
        },
        body: JSON.stringify({
          model: primaryProvider.model,
          messages: [
            {
              role: 'system',
              content: `Analyze UPSC query intent. Return JSON with: needsCurrentAffairs (boolean), needsStaticMaterials (boolean), needsDocumentAnalysis (boolean), topic (string), subject (string).`,
            },
            {
              role: 'user',
              content: query,
            },
          ],
          temperature: 0.3,
          max_tokens: 200,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return this.simpleIntentAnalysis(query);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '{}';
      
      return JSON.parse(content);
    } catch (error) {
      console.error('Intent analysis failed:', error);
      return this.simpleIntentAnalysis(query);
    }
  }

  /**
   * Simple keyword-based intent analysis (fallback)
   */
  private simpleIntentAnalysis(query: string): IntentAnalysis {
    const queryLower = query.toLowerCase();
    
    const currentAffairsKeywords = ['current', 'recent', 'latest', 'news', 'today', 'this year'];
    const staticKeywords = ['history', 'geography', 'polity', 'constitution', 'ncert'];
    const documentKeywords = ['document', 'file', 'pdf', 'chapter', 'book'];
    
    return {
      needsCurrentAffairs: currentAffairsKeywords.some(k => queryLower.includes(k)),
      needsStaticMaterials: staticKeywords.some(k => queryLower.includes(k)),
      needsDocumentAnalysis: documentKeywords.some(k => queryLower.includes(k)),
      topic: query,
      subject: this.inferSubject(queryLower),
    };
  }

  /**
   * Infer subject from query
   */
  private inferSubject(query: string): string | undefined {
    if (query.includes('polity') || query.includes('constitution')) return 'GS2';
    if (query.includes('history')) return 'GS1';
    if (query.includes('economy') || query.includes('budget')) return 'GS3';
    if (query.includes('ethics') || query.includes('case study')) return 'GS4';
    if (query.includes('geography')) return 'GS1';
    if (query.includes('environment')) return 'GS3';
    return undefined;
  }

  /**
   * Get current Groq key (rotation)
   */
  private getGroqKey(): string {
    return this.groqKeys[this.currentGroqKeyIndex];
  }

  /**
   * Rotate to next Groq key
   */
  private rotateGroqKey(): void {
    this.currentGroqKeyIndex = (this.currentGroqKeyIndex + 1) % this.groqKeys.length;
  }

  /**
   * Get max tokens for brevity level
   */
  private getMaxTokensForBrevity(level: string): number {
    const tokenMap = {
      '100': 150,
      '250': 350,
      '500': 700,
      '1000': 1400,
      'comprehensive': 3000,
    };
    return tokenMap[level] || 3000;
  }
}

// Singleton instance
let aiProviderInstance: AIProviderClient | null = null;

export function getAIProviderClient(): AIProviderClient {
  if (!aiProviderInstance) {
    aiProviderInstance = new AIProviderClient();
  }
  return aiProviderInstance;
}
