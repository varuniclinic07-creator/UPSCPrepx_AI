import { BaseAgent } from './base-agent';
import { callAI } from '../ai/ai-provider-client';
import type { ResearchSource } from './research-agent';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NotesResult {
  content: string;
  wordCount: number;
  sources: Array<{ type: string; title: string; url?: string }>;
  confidence: number;
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are an expert UPSC preparation assistant specializing in comprehensive, exam-oriented notes.

Your notes MUST follow this structure:
1. **Heading** — Clear title with topic and subject context
2. **Key Concepts** — Bullet list of essential terms and definitions
3. **Detailed Explanation** — In-depth coverage suitable for Mains answers
4. **Important Examples** — Real-world examples, case studies, and landmark events
5. **Memory Tips** — Mnemonics, analogies, or recall aids
6. **Previous Year Relevance** — How this topic has appeared in past UPSC exams
7. **Sources** — Attributed references

Guidelines:
- Use clear, formal English appropriate for civil services preparation
- Include constitutional articles, acts, and committee reports where relevant
- Highlight interlinkages with other UPSC topics
- Keep content factually accurate and up to date`;

// ---------------------------------------------------------------------------
// Agent
// ---------------------------------------------------------------------------

/**
 * NotesAgent generates structured UPSC-oriented study notes for a given topic,
 * optionally enriched with research sources.
 */
export class NotesAgent extends BaseAgent {
  constructor() {
    super('notes');
  }

  async execute(params: {
    nodeId?: string;
    topic: string;
    subject?: string;
    sources?: ResearchSource[];
    brevityLevel?: string;
  }): Promise<NotesResult> {
    const { nodeId, topic, subject, sources, brevityLevel } = params;
    const runId = await this.startRun({ nodeId, topic, subject, brevityLevel });

    try {
      // ------------------------------------------------------------------
      // 1. Build the user prompt
      // ------------------------------------------------------------------
      const sourcesContext = this.formatSourcesForPrompt(sources);
      const brevityInstruction = brevityLevel
        ? `\nBrevity level: ${brevityLevel}. Adjust detail accordingly.`
        : '';

      const userPrompt = [
        `Generate comprehensive UPSC study notes on the following topic.`,
        subject ? `Subject: ${subject}` : null,
        `Topic: ${topic}`,
        brevityInstruction,
        sourcesContext
          ? `\nUse the following research sources to enrich the notes:\n\n${sourcesContext}`
          : null,
      ]
        .filter(Boolean)
        .join('\n');

      // ------------------------------------------------------------------
      // 2. Call the AI provider
      // ------------------------------------------------------------------
      let content: string;
      try {
        content = await callAI({
          systemPrompt: SYSTEM_PROMPT,
          userPrompt,
          providerPreferences: this.getProviderPreferences(),
        });
      } catch (aiErr: any) {
        this.log('error', `AI provider call failed: ${aiErr.message}`);
        throw new Error(`Notes generation failed: ${aiErr.message}`);
      }

      // ------------------------------------------------------------------
      // 3. Build result
      // ------------------------------------------------------------------
      const wordCount = content.split(/\s+/).filter(Boolean).length;
      const usedSources = (sources ?? []).map((s) => ({
        type: s.type,
        title: s.title,
        url: s.url,
      }));
      const confidence = this.computeConfidence(sources, wordCount);

      const result: NotesResult = {
        content,
        wordCount,
        sources: usedSources,
        confidence,
      };

      // ------------------------------------------------------------------
      // 4. Persist to content queue
      // ------------------------------------------------------------------
      if (nodeId) {
        try {
          const { error: insertError } = await this.supabase
            .from('content_queue')
            .insert({
              node_id: nodeId,
              content_type: 'note',
              generated_content: {
                content,
                sources: usedSources,
                wordCount,
              },
              agent_type: 'notes',
              confidence_score: confidence,
            });

          if (insertError) {
            this.log('warn', `content_queue insert failed: ${insertError.message}`);
          }
        } catch (dbErr: any) {
          this.log('warn', `content_queue write error: ${dbErr.message}`);
        }
      }

      // ------------------------------------------------------------------
      // 5. Complete
      // ------------------------------------------------------------------
      await this.completeRun('completed', { content_generated: 1, nodes_processed: 1 });
      return result;
    } catch (err: any) {
      await this.completeRun('failed', { errors: [err?.message] });
      throw err;
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Format research sources into a text block the LLM can reference.
   */
  private formatSourcesForPrompt(sources?: ResearchSource[]): string {
    if (!sources || sources.length === 0) return '';

    return sources
      .map(
        (s, i) =>
          `Source ${i + 1} [${s.type}] — ${s.title}${s.url ? ` (${s.url})` : ''}\n${s.content}`
      )
      .join('\n\n');
  }

  /**
   * Heuristic confidence score based on available sources and output length.
   */
  private computeConfidence(sources?: ResearchSource[], wordCount = 0): number {
    let score = 0.5; // baseline

    // Boost for having research sources
    if (sources && sources.length > 0) {
      score += Math.min(sources.length * 0.05, 0.2);
    }

    // Boost for substantial content
    if (wordCount > 500) score += 0.1;
    if (wordCount > 1000) score += 0.05;

    return Math.min(parseFloat(score.toFixed(2)), 1.0);
  }
}

/** Singleton notes agent instance. */
export const notesAgent = new NotesAgent();
