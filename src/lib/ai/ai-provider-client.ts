/**
 * BMAD Phase 4: Feature 10 - AI Provider Client
 * AI Provider Routing: Ollama → Groq (fallback)
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
  private geminiKeys: string[];
  private currentGeminiKeyIndex: number = 0;
  private kiloKeys: string[];
  private currentKiloKeyIndex: number = 0;
  private kiloModels: string[];
  private currentKiloModelIndex: number = 0;
  private opencodeModels: string[];

  /** Reject placeholder/dummy keys that look real but aren't */
  private static isRealKey(key: string | undefined): key is string {
    if (!key) return false;
    const lower = key.toLowerCase();
    return !(
      lower === 'placeholder' ||
      lower.startsWith('replace_with') ||
      lower.startsWith('your_') ||
      lower.startsWith('placeholder') ||
      lower === '' ||
      lower === 'test' ||
      lower === 'dummy'
    );
  }

  constructor() {
    // AI Provider Priority: Groq (7 real keys) → Kilo (4 JWT keys) → Ollama Cloud → OpenCode
    this.providers = [
      {
        name: 'groq',
        baseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
        apiKey: '', // Will use rotation from groqKeys
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        priority: 1, // Primary — 7 free keys, fastest
        rateLimitRPM: 30,
        rateLimitConcurrent: 10,
        isActive: true,
      },
      {
        name: 'kilo',
        baseUrl: process.env.KILO_API_BASE_URL || 'https://api.kilo.ai/api/gateway',
        apiKey: '', // Resolved via key rotation at call time
        model: process.env.KILO_MODEL || 'bytedance-seed/dola-seed-2.0-pro:free',
        priority: 2, // 4 JWT keys, 5 model fallback
        rateLimitRPM: 30,
        rateLimitConcurrent: 10,
        isActive: Boolean(
          AIProviderClient.isRealKey(process.env.KILO_API_KEY_1) ||
          AIProviderClient.isRealKey(process.env.KILO_API_KEY_2) ||
          AIProviderClient.isRealKey(process.env.KILO_API_KEY_3) ||
          AIProviderClient.isRealKey(process.env.KILO_API_KEY_4)
        ),
      },
      {
        name: 'ollama',
        baseUrl: process.env.OLLAMA_BASE_URL || 'https://ollama.com/v1',
        apiKey: process.env.OLLAMA_API_KEY || '',
        model: process.env.OLLAMA_MODEL || 'qwen3.5:397b-cloud',
        priority: 3, // Paid cloud — fallback
        rateLimitRPM: 20,
        rateLimitConcurrent: 5,
        isActive: AIProviderClient.isRealKey(process.env.OLLAMA_API_KEY),
      },
      {
        name: 'opencode',
        baseUrl: process.env.OPENCODE_API_BASE_URL || 'http://localhost:3100',
        apiKey: process.env.OPENCODE_API_KEY || '',
        model: process.env.OPENCODE_MODEL || 'opencode zen/Big Pickle',
        priority: 4, // Self-hosted — only works when local server running
        rateLimitRPM: 60,
        rateLimitConcurrent: 10,
        isActive: AIProviderClient.isRealKey(process.env.OPENCODE_API_KEY),
      },
      {
        name: 'nvidia',
        baseUrl: 'https://integrate.api.nvidia.com/v1',
        apiKey: process.env.NVIDIA_API_KEY || '',
        model: process.env.NVIDIA_MODEL || 'nvidia/llama-3.1-nemotron-70b-instruct',
        priority: 5,
        rateLimitRPM: 10,
        rateLimitConcurrent: 3,
        isActive: AIProviderClient.isRealKey(process.env.NVIDIA_API_KEY),
      },
      {
        name: 'gemini',
        baseUrl: 'gemini-adapter', // Uses GeminiAdapter, not direct fetch
        apiKey: '', // Resolved via key rotation at call time
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
        priority: 6,
        rateLimitRPM: 15,
        rateLimitConcurrent: 5,
        isActive: false, // Disabled until real keys are provided
      },
    ];

    // Groq multi-key rotation: GROQ_API_KEY_1 through _7, fallback to single GROQ_API_KEY
    this.groqKeys = [
      process.env.GROQ_API_KEY_1,
      process.env.GROQ_API_KEY_2,
      process.env.GROQ_API_KEY_3,
      process.env.GROQ_API_KEY_4,
      process.env.GROQ_API_KEY_5,
      process.env.GROQ_API_KEY_6,
      process.env.GROQ_API_KEY_7,
    ].filter(AIProviderClient.isRealKey);
    if (this.groqKeys.length === 0) {
      const singleKey = process.env.GROQ_API_KEY || '';
      if (AIProviderClient.isRealKey(singleKey)) this.groqKeys = [singleKey];
    }
    // Disable Groq if no real keys
    if (this.groqKeys.length === 0) {
      const groq = this.providers.find(p => p.name === 'groq');
      if (groq) groq.isActive = false;
    }

    // Gemini multi-key rotation: GEMINI_API_KEY_1 through _4
    this.geminiKeys = [
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
      process.env.GEMINI_API_KEY_4,
    ].filter(AIProviderClient.isRealKey);
    // Enable Gemini only if real keys exist
    if (this.geminiKeys.length > 0) {
      const gemini = this.providers.find(p => p.name === 'gemini');
      if (gemini) gemini.isActive = true;
    }

    // Kilo multi-key rotation: KILO_API_KEY_1 through _4
    this.kiloKeys = [
      process.env.KILO_API_KEY_1,
      process.env.KILO_API_KEY_2,
      process.env.KILO_API_KEY_3,
      process.env.KILO_API_KEY_4,
    ].filter(AIProviderClient.isRealKey);

    // Kilo model fallback order (5 models, cycled on failure)
    this.kiloModels = [
      'bytedance-seed/dola-seed-2.0-pro:free',
      'nvidia/nemotron-3-super-120b-a12b:free',
      'x-ai/grok-code-fast-1:optimized:free',
      'kilo-auto/free',
      'openrouter/free',
    ];

    // OpenCode model fallback order (16 models, cycled on failure)
    this.opencodeModels = [
      'opencode zen/Big Pickle',
      'go/MiniMax M2.7',
      'Nemotron 3 Super Free',
      'MiniMax M2.5 Free',
      'Nvidia/Kimi K2.5',
      'Nvidia/Qwen3.5-397B-A17B',
      'Nvidia/Llama 3.3 Nemotron Super 49b V1.5',
      'Nvidia/Mistral Large 3 675B Instruct 2512',
      'Nvidia/NeMo Retriever OCR v1',
      'Nvidia/Llama 4 Maverick 17b 128e Instruct',
      'Nvidia/MiniMax-M2.5',
      'Nvidia/Devstral-2-123B-Instruct-2512',
      'Nvidia/GLM-4.7',
      'Nvidia/GLM5',
      'Nvidia/DeepSeek V3.1 Terminus',
      'Nvidia/GPT-OSS-120B',
      'Nvidia/Step 3.5 Flash',
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
   * Get current Gemini key (rotation)
   */
  getGeminiKey(): string {
    if (this.geminiKeys.length === 0) return '';
    return this.geminiKeys[this.currentGeminiKeyIndex];
  }

  /**
   * Rotate to next Gemini key
   */
  private rotateGeminiKey(): void {
    if (this.geminiKeys.length > 0) {
      this.currentGeminiKeyIndex = (this.currentGeminiKeyIndex + 1) % this.geminiKeys.length;
    }
  }

  /**
   * Get current Kilo key (rotation)
   */
  getKiloKey(): string {
    if (this.kiloKeys.length === 0) return '';
    return this.kiloKeys[this.currentKiloKeyIndex];
  }

  /**
   * Rotate to next Kilo key
   */
  private rotateKiloKey(): void {
    if (this.kiloKeys.length > 0) {
      this.currentKiloKeyIndex = (this.currentKiloKeyIndex + 1) % this.kiloKeys.length;
    }
  }

  /**
   * Get current Kilo model (fallback rotation)
   */
  getKiloModel(): string {
    return this.kiloModels[this.currentKiloModelIndex];
  }

  /**
   * Cycle to next Kilo model on failure
   */
  cycleKiloModel(): void {
    this.currentKiloModelIndex = (this.currentKiloModelIndex + 1) % this.kiloModels.length;
  }

  /**
   * Get OpenCode models list for fallback iteration
   */
  getOpencodeModels(): string[] {
    return this.opencodeModels;
  }

  /** Returns provider names in priority order */
  getProviderNames(): string[] {
    return [...this.providers]
      .sort((a, b) => a.priority - b.priority)
      .map(p => p.name);
  }

  /** Returns the resolved API key for a named provider */
  getProviderKey(name: string): string {
    if (name === 'groq') return this.getGroqKey();
    if (name === 'gemini') return this.getGeminiKey();
    if (name === 'kilo') return this.getKiloKey();
    return this.providers.find(p => p.name === name)?.apiKey ?? '';
  }

  /**
   * Get max tokens for brevity level
   */
  private getMaxTokensForBrevity(level: string): number {
    const tokenMap: Record<string, number> = {
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

// ============================================================================
// callAI() — Universal AI call function with 3-provider fallback
// Supports two call signatures:
//   callAI(prompt, { temperature?, maxTokens? })
//   callAI({ prompt?, messages?, temperature?, maxTokens? })
// ============================================================================
// callAIStream() — True streaming support for real-time AI responses
// ============================================================================

export type AIProvider = 'ollama' | 'groq' | 'kilo' | 'opencode' | 'nvidia' | 'gemini' | 'a4f';

// ============================================================================
// Vision Model Configuration — multi-modal image + text support
// ============================================================================

export interface VisionModelConfig {
  name: string;
  model: string;
  provider: AIProvider;
  supportsImages: boolean;
}

export const VISION_MODELS: VisionModelConfig[] = [
  { name: 'gemma4-vision', model: 'gemma4:31b-cloud', provider: 'ollama', supportsImages: true },
  { name: 'qwen3-vl', model: 'qwen3-vl:235b-instruct-cloud', provider: 'ollama', supportsImages: true },
];

interface CallAIOptions {
  prompt?: string;
  /** Alias for `prompt` — used by Hermes agents */
  userPrompt?: string;
  messages?: Array<{ role: string; content: string }>;
  system?: string;
  /** Alias for `system` — used by Hermes agents */
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  /** Set true to skip SIMPLIFIED_LANGUAGE_PROMPT (for non-user-facing calls like JSON parsing) */
  skipSimplifiedLanguage?: boolean;
  /** Per-agent provider preference order (spec Section 3). Overrides default priority sort. */
  providerPreferences?: AIProvider[];
}

interface CallAIStreamOptions extends CallAIOptions {
  /** Called for each chunk of streamed response */
  onChunk: (chunk: string) => void;
  /** Called when streaming is complete */
  onComplete?: () => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

// v8 Spec Rule 3: Prepend to EVERY AI call generating user-facing content
const SIMPLIFIED_LANGUAGE_PROMPT = `
CRITICAL LANGUAGE RULES — FOLLOW STRICTLY:
1. Write for a 10th-class student. One reading = full understanding.
2. No jargon without explanation. Technical terms get parenthetical definitions.
3. Real-life Indian examples for every concept.
4. Analogies.
5. Max 15 words per sentence.
6. Mnemonics.
7. Exam tips.
8. If Hindi: use simple Hindi (Hinglish acceptable).
`.trim();

export async function callAI(
  promptOrOptions: string | CallAIOptions,
  options?: { temperature?: number; maxTokens?: number; system?: string; skipSimplifiedLanguage?: boolean }
): Promise<string> {
  const client = getAIProviderClient();

  // Normalize both call signatures
  let messages: Array<{ role: string; content: string }>;
  let temperature: number;
  let maxTokens: number;
  let skipSimplified = false;

  if (typeof promptOrOptions === 'string') {
    // Signature 1: callAI(prompt, opts?)
    skipSimplified = options?.skipSimplifiedLanguage ?? false;
    const baseSystem = options?.system || 'You are an expert UPSC CSE educator.';
    messages = [
      {
        role: 'system',
        content: skipSimplified ? baseSystem : `${SIMPLIFIED_LANGUAGE_PROMPT}\n\n${baseSystem}`,
      },
      { role: 'user', content: promptOrOptions },
    ];
    temperature = options?.temperature ?? 0.7;
    maxTokens = options?.maxTokens ?? 2000;
  } else {
    // Signature 2: callAI({ prompt?, messages?, temperature?, maxTokens? })
    skipSimplified = promptOrOptions.skipSimplifiedLanguage ?? false;
    if (promptOrOptions.messages) {
      messages = [...promptOrOptions.messages];
      // Prepend SIMPLIFIED_LANGUAGE_PROMPT to existing system message if present
      if (!skipSimplified) {
        const sysIdx = messages.findIndex(m => m.role === 'system');
        if (sysIdx >= 0) {
          messages[sysIdx] = { ...messages[sysIdx], content: `${SIMPLIFIED_LANGUAGE_PROMPT}\n\n${messages[sysIdx].content}` };
        } else {
          messages.unshift({ role: 'system', content: SIMPLIFIED_LANGUAGE_PROMPT });
        }
      }
    } else {
      // Support both `system`/`prompt` and `systemPrompt`/`userPrompt` aliases
      const baseSystem = promptOrOptions.system || promptOrOptions.systemPrompt || 'You are an expert UPSC CSE educator.';
      const userContent = promptOrOptions.prompt || promptOrOptions.userPrompt || '';
      messages = [
        {
          role: 'system',
          content: skipSimplified ? baseSystem : `${SIMPLIFIED_LANGUAGE_PROMPT}\n\n${baseSystem}`,
        },
        { role: 'user', content: userContent },
      ];
    }
    temperature = promptOrOptions.temperature ?? 0.7;
    maxTokens = promptOrOptions.maxTokens ?? 2000;
  }

  // Try providers in priority order — use per-agent preferences if provided (spec Section 3)
  const providers = (client as any).providers as AIProviderConfig[];
  const preferenceOrder = typeof promptOrOptions !== 'string' ? promptOrOptions.providerPreferences : undefined;

  let sortedProviders: AIProviderConfig[];
  if (preferenceOrder && preferenceOrder.length > 0) {
    // Reorder: preferred providers first (in given order), then remaining by default priority
    const preferredSet = new Set(preferenceOrder);
    const preferred = preferenceOrder
      .map(name => providers.find(p => p.name === name))
      .filter((p): p is AIProviderConfig => !!p);
    const rest = providers
      .filter(p => !preferredSet.has(p.name as AIProvider))
      .sort((a, b) => a.priority - b.priority);
    sortedProviders = [...preferred, ...rest];
  } else {
    sortedProviders = [...providers].sort((a, b) => a.priority - b.priority);
  }

  for (const provider of sortedProviders) {
    if (!provider.isActive) continue;

    const health = (client as any).providerHealth as Map<string, boolean>;
    if (health.get(provider.name) === false) continue;

    try {
      // Resolve API key based on provider type
      const apiKey = provider.name === 'groq'
        ? ((client as any).groqKeys as string[])[(client as any).currentGroqKeyIndex as number]
        : provider.name === 'gemini'
        ? client.getGeminiKey()
        : provider.name === 'kilo'
        ? client.getKiloKey()
        : provider.apiKey;

      if (provider.name !== 'ollama' && !apiKey) {
        console.warn(`Skipping provider ${provider.name}: no API key configured`);
        continue;
      }

      // Gemini uses adapter instead of direct fetch
      if (provider.name === 'gemini') {
        const { GeminiAdapter } = await import('./gemini-adapter');
        const adapter = new GeminiAdapter({ apiKey, model: provider.model });
        const response = await adapter.chat(
          messages as Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
          { temperature, maxTokens }
        );
        const content = response.choices[0].message.content;

        const failures = (client as any).providerFailures as Map<string, number>;
        failures.set(provider.name, 0);
        health.set(provider.name, true);
        (client as any).rotateGeminiKey();

        return content;
      }

      // Kilo: try multiple models in fallback order, rotate keys on each attempt
      if (provider.name === 'kilo') {
        const kiloModels = (client as any).kiloModels as string[];
        let lastError: Error | null = null;
        for (let i = 0; i < kiloModels.length; i++) {
          const model = client.getKiloModel();
          try {
            const response = await fetch(`${provider.baseUrl}/chat/completions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
              },
              body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
              signal: AbortSignal.timeout(30000),
            });
            if (!response.ok) {
              client.cycleKiloModel();
              lastError = new Error(`Kilo model ${model} returned ${response.status}`);
              continue;
            }
            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || '';
            const failures = (client as any).providerFailures as Map<string, number>;
            failures.set(provider.name, 0);
            health.set(provider.name, true);
            (client as any).rotateKiloKey();
            return content;
          } catch (e) {
            client.cycleKiloModel();
            lastError = e as Error;
          }
        }
        throw lastError || new Error('All Kilo models failed');
      }

      // OpenCode: try multiple models in fallback order
      if (provider.name === 'opencode') {
        const opencodeModels = client.getOpencodeModels();
        let lastError: Error | null = null;
        for (const model of opencodeModels) {
          try {
            const response = await fetch(`${provider.baseUrl}/chat/completions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
              },
              body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
              signal: AbortSignal.timeout(45000), // Longer timeout for local inference
            });
            if (!response.ok) {
              lastError = new Error(`OpenCode model ${model} returned ${response.status}`);
              continue;
            }
            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || '';
            const failures = (client as any).providerFailures as Map<string, number>;
            failures.set(provider.name, 0);
            health.set(provider.name, true);
            return content;
          } catch (e) {
            lastError = e as Error;
          }
        }
        throw lastError || new Error('All OpenCode models failed');
      }

      // Standard OpenAI-compatible provider (Ollama, Groq, NVIDIA)
      const response = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: provider.model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(`Provider ${provider.name} returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      // Reset failure count on success + rotate keys for round-robin providers
      const failures = (client as any).providerFailures as Map<string, number>;
      failures.set(provider.name, 0);
      health.set(provider.name, true);
      if (provider.name === 'groq') (client as any).rotateGroqKey();

      return content;
    } catch (error) {
      console.error(`callAI: Provider ${provider.name} failed:`, error);

      // Rotate Groq key on failure too — try a different key next time
      if (provider.name === 'groq') (client as any).rotateGroqKey();

      const failures = (client as any).providerFailures as Map<string, number>;
      const count = (failures.get(provider.name) || 0) + 1;
      failures.set(provider.name, count);

      if (count >= 3) {
        health.set(provider.name, false);
        console.warn(`callAI: Provider ${provider.name} marked unhealthy after ${count} failures`);
      }

      continue;
    }
  }

  throw new Error('All AI providers failed — service temporarily unavailable');
}

// ============================================================================
// callAIStream() — True streaming support for real-time AI responses
// ============================================================================

export async function callAIStream(
  promptOrOptions: string | CallAIStreamOptions,
  options?: { temperature?: number; maxTokens?: number; system?: string; skipSimplifiedLanguage?: boolean; onChunk?: (chunk: string) => void; onComplete?: () => void; onError?: (error: Error) => void }
): Promise<void> {
  const client = getAIProviderClient();

  // Normalize both call signatures
  let messages: Array<{ role: string; content: string }>;
  let temperature: number;
  let maxTokens: number;
  let skipSimplified = false;
  let onChunk: (chunk: string) => void;
  let onComplete: (() => void) | undefined;
  let onError: ((error: Error) => void) | undefined;

  if (typeof promptOrOptions === 'string') {
    // Signature 1: callAIStream(prompt, opts?)
    skipSimplified = options?.skipSimplifiedLanguage ?? false;
    onChunk = options?.onChunk ?? (() => {});
    onComplete = options?.onComplete;
    onError = options?.onError;
    const baseSystem = options?.system || 'You are an expert UPSC CSE educator.';
    messages = [
      {
        role: 'system',
        content: skipSimplified ? baseSystem : `${SIMPLIFIED_LANGUAGE_PROMPT}\n\n${baseSystem}`,
      },
      { role: 'user', content: promptOrOptions },
    ];
    temperature = options?.temperature ?? 0.7;
    maxTokens = options?.maxTokens ?? 2000;
  } else {
    // Signature 2: callAIStream({ prompt?, messages?, temperature?, maxTokens?, onChunk?, onComplete?, onError? })
    skipSimplified = promptOrOptions.skipSimplifiedLanguage ?? false;
    onChunk = promptOrOptions.onChunk ?? (() => {});
    onComplete = promptOrOptions.onComplete;
    onError = promptOrOptions.onError;
    if (promptOrOptions.messages) {
      messages = [...promptOrOptions.messages];
      if (!skipSimplified) {
        const sysIdx = messages.findIndex(m => m.role === 'system');
        if (sysIdx >= 0) {
          messages[sysIdx] = { ...messages[sysIdx], content: `${SIMPLIFIED_LANGUAGE_PROMPT}\n\n${messages[sysIdx].content}` };
        } else {
          messages.unshift({ role: 'system', content: SIMPLIFIED_LANGUAGE_PROMPT });
        }
      }
    } else {
      const baseSystem = promptOrOptions.system || 'You are an expert UPSC CSE educator.';
      messages = [
        {
          role: 'system',
          content: skipSimplified ? baseSystem : `${SIMPLIFIED_LANGUAGE_PROMPT}\n\n${baseSystem}`,
        },
        { role: 'user', content: promptOrOptions.prompt || '' },
      ];
    }
    temperature = promptOrOptions.temperature ?? 0.7;
    maxTokens = promptOrOptions.maxTokens ?? 2000;
  }

  // Try providers in priority order (Ollama → Groq)
  const providers = (client as any).providers as AIProviderConfig[];
  const sortedProviders = [...providers].sort((a, b) => a.priority - b.priority);

  for (const provider of sortedProviders) {
    if (!provider.isActive) continue;

    const health = (client as any).providerHealth as Map<string, boolean>;
    if (health.get(provider.name) === false) continue;

    try {
      const apiKey = provider.name === 'groq'
        ? ((client as any).groqKeys as string[])[(client as any).currentGroqKeyIndex as number]
        : provider.name === 'gemini'
        ? client.getGeminiKey()
        : provider.apiKey;

      if (provider.name !== 'ollama' && !apiKey) {
        console.warn(`Skipping provider ${provider.name}: no API key configured`);
        continue;
      }

      // Gemini doesn't support true streaming — call adapter and yield full response
      if (provider.name === 'gemini') {
        const { GeminiAdapter } = await import('./gemini-adapter');
        const adapter = new GeminiAdapter({ apiKey, model: provider.model });
        const geminiResponse = await adapter.chat(
          messages as Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
          { temperature, maxTokens }
        );
        const content = geminiResponse.choices[0].message.content;
        onChunk(content);

        const failures = (client as any).providerFailures as Map<string, number>;
        failures.set(provider.name, 0);
        health.set(provider.name, true);
        (client as any).rotateGeminiKey();

        onComplete?.();
        return;
      }

      const response = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: provider.model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: true,
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) {
        throw new Error(`Provider ${provider.name} returned ${response.status}: ${response.statusText}`);
      }

      // Stream the response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;

          // Parse SSE data
          if (trimmedLine.startsWith('data: ')) {
            const dataStr = trimmedLine.slice(6);
            try {
              const data = JSON.parse(dataStr);
              const content = data.choices?.[0]?.delta?.content || '';
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              console.warn('Failed to parse SSE chunk:', e);
            }
          }
        }
      }

      // Reset failure count on success
      const failures = (client as any).providerFailures as Map<string, number>;
      failures.set(provider.name, 0);
      health.set(provider.name, true);

      onComplete?.();
      return;
    } catch (error) {
      console.error(`callAIStream: Provider ${provider.name} failed:`, error);

      const failures = (client as any).providerFailures as Map<string, number>;
      const count = (failures.get(provider.name) || 0) + 1;
      failures.set(provider.name, count);

      if (count >= 3) {
        health.set(provider.name, false);
        console.warn(`callAIStream: Provider ${provider.name} marked unhealthy after ${count} failures`);
      }

      onError?.(error instanceof Error ? error : new Error(String(error)));
      continue;
    }
  }

  // All providers failed
  const allFailedError = new Error('All AI providers failed — service temporarily unavailable');
  onError?.(allFailedError);
  throw allFailedError;
}

// ============================================================================
// callAIVision() — Multi-modal AI call with image support
// Tries vision-capable models (gemma4 → qwen3-vl) then falls back to callAI()
// ============================================================================

interface CallAIVisionOptions {
  prompt: string;
  imageBase64?: string;
  imageUrl?: string;
  system?: string;
  /** Override which vision model to use (must be a model string from VISION_MODELS) */
  model?: string;
}

export async function callAIVision(options: CallAIVisionOptions): Promise<string> {
  const { prompt, imageBase64, imageUrl, system, model: modelOverride } = options;

  // If no image provided, fall back to regular callAI
  if (!imageBase64 && !imageUrl) {
    return callAI({ prompt, system, skipSimplifiedLanguage: true });
  }

  const client = getAIProviderClient();
  const health = (client as any).providerHealth as Map<string, boolean>;
  const failures = (client as any).providerFailures as Map<string, number>;

  // Determine which vision models to try
  const modelsToTry = modelOverride
    ? VISION_MODELS.filter(vm => vm.model === modelOverride)
    : VISION_MODELS;

  // Build multi-modal user message content parts
  const contentParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];

  // Add image part
  if (imageBase64) {
    contentParts.push({
      type: 'image_url',
      image_url: { url: `data:image/png;base64,${imageBase64}` },
    });
  } else if (imageUrl) {
    contentParts.push({
      type: 'image_url',
      image_url: { url: imageUrl },
    });
  }

  // Add text part
  contentParts.push({ type: 'text', text: prompt });

  const messages = [
    ...(system ? [{ role: 'system', content: system }] : []),
    { role: 'user', content: contentParts },
  ];

  // Try each vision model in order
  for (const visionModel of modelsToTry) {
    // Resolve the provider config for this vision model
    const providers = (client as any).providers as AIProviderConfig[];
    const provider = providers.find(p => p.name === visionModel.provider);
    if (!provider || !provider.isActive) continue;
    if (health.get(provider.name) === false) continue;

    try {
      const apiKey = provider.name === 'groq'
        ? ((client as any).groqKeys as string[])[(client as any).currentGroqKeyIndex as number]
        : provider.name === 'gemini'
        ? client.getGeminiKey()
        : provider.apiKey;

      if (provider.name !== 'ollama' && !apiKey) continue;

      const response = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: visionModel.model,
          messages,
          temperature: 0.7,
          max_tokens: 2000,
        }),
        signal: AbortSignal.timeout(60000), // Vision calls may take longer
      });

      if (!response.ok) {
        throw new Error(`Vision model ${visionModel.name} returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      // Reset failure count on success
      failures.set(provider.name, 0);
      health.set(provider.name, true);

      return content;
    } catch (error) {
      console.error(`callAIVision: Vision model ${visionModel.name} failed:`, error);

      const count = (failures.get(provider.name) || 0) + 1;
      failures.set(provider.name, count);

      if (count >= 3) {
        health.set(provider.name, false);
        console.warn(`callAIVision: Provider ${provider.name} marked unhealthy after ${count} failures`);
      }

      continue;
    }
  }

  // All vision models failed — fall back to text-only callAI
  console.warn('callAIVision: All vision models failed, falling back to text-only callAI');
  return callAI({ prompt, system, skipSimplifiedLanguage: true });
}
