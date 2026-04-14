/**
 * AI PDF Summarizer Service
 *
 * Master Prompt v8.0 - Feature F12 (READ Mode)
 * - Generates summaries from highlighted text
 * - 9Router -> Groq -> Ollama fallback
 */

import { callAI } from '@/lib/ai/ai-provider-client';

export interface Highlight {
  text_content: string;
  page_index: number;
}

export async function summarizeHighlights(highlights: Highlight[], language: 'en' | 'hi' = 'en') {
  if (highlights.length === 0) return '';

  const text = highlights.map((h) => `- Page ${h.page_index + 1}: ${h.text_content}`).join('\n');

  const prompt = `
You are an expert study assistant. 
Summarize the following highlighted text from a PDF document.

RULES:
1. Language: ${language === 'hi' ? 'Hindi' : 'English'}
2. Use SIMPLIFIED language (10th grade level)
3. Structure: Key Topics, Important Points, Exam Relevance
4. Keep it concise and bulleted

HIGHLIGHTS:
${text}

SUMMARY:`;

  return await callAI({
    prompt,
    providerPreferences: ['a4f'],
    temperature: 0.3,
    maxTokens: 1500,
  });
}

export const pdfSummarizer = { summarizeHighlights };
