/**
 * Gemini Adapter — wraps @google/generative-ai to OpenAI-compatible interface
 * Used as Priority 4 fallback in the provider chain: Ollama → Groq → NVIDIA NIM → Gemini
 */
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiAdapterConfig {
  apiKey: string;
  model: string;
}

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIResponse {
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  model: string;
}

export class GeminiAdapter {
  private client: GoogleGenerativeAI;
  private modelName: string;

  constructor(config: GeminiAdapterConfig) {
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.modelName = config.model;
  }

  async chat(
    messages: OpenAIMessage[],
    options: { temperature?: number; maxTokens?: number } = {}
  ): Promise<OpenAIResponse> {
    const genModel = this.client.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 2048,
      },
    });

    // Split system message from conversation
    const systemMessage = messages.find(m => m.role === 'system')?.content ?? '';
    const conversation = messages.filter(m => m.role !== 'system');

    // All but the last message become history
    const history = conversation.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: [{ text: m.content }],
    }));

    const lastMessage = conversation[conversation.length - 1];
    const prompt = systemMessage
      ? `${systemMessage}\n\n${lastMessage.content}`
      : lastMessage.content;

    const chat = genModel.startChat({ history });
    const result = await chat.sendMessage(prompt);
    const text = result.response.text();

    return {
      choices: [{ message: { role: 'assistant', content: text }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      model: this.modelName,
    };
  }
}
