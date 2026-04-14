import { BaseAgent } from './base-agent';
import { callAI } from '../ai/ai-provider-client';

export interface QualityScore {
  score: number; // 0-1
  verdict: 'approved' | 'needs_revision' | 'rejected';
  feedback: string;
  criteria: {
    accuracy: number;
    completeness: number;
    clarity: number;
    examRelevance: number;
  };
}

export interface SweepResult {
  reviewed: number;
  approved: number;
  flagged: number;
}

class QualityAgent extends BaseAgent {
  constructor() {
    super('quality_check');
  }

  /** Generic execute() for orchestrator dispatch */
  async execute(params: Record<string, any>): Promise<any> {
    if (params.contentId && params.content) {
      return this.scoreContent(params as any);
    }
    return this.sweepStale();
  }

  async scoreContent(params: {
    contentId: string;
    content: string;
    contentType: string;
    topic?: string;
  }): Promise<QualityScore> {
    const runId = await this.startRun();

    try {
      const systemPrompt =
        'Score this UPSC content on 4 criteria (accuracy, completeness, clarity, exam-relevance) each 0-1. Return JSON: {accuracy, completeness, clarity, examRelevance, feedback}. Be strict — UPSC requires factual precision.';

      const userPrompt = `Content type: ${params.contentType}${params.topic ? `\nTopic: ${params.topic}` : ''}\n\nContent:\n${params.content}`;

      const raw = await callAI({ systemPrompt, userPrompt, providerPreferences: this.getProviderPreferences() });

      let parsed: {
        accuracy: number;
        completeness: number;
        clarity: number;
        examRelevance: number;
        feedback: string;
      };

      try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON object found in AI response');
        parsed = JSON.parse(jsonMatch[0]);
      } catch (parseErr) {
        this.log('warn', `Failed to parse AI response: ${parseErr}`);
        throw new Error('Quality agent received malformed AI response');
      }

      const score =
        (parsed.accuracy + parsed.completeness + parsed.clarity + parsed.examRelevance) / 4;

      let verdict: QualityScore['verdict'];
      if (score >= 0.7) {
        verdict = 'approved';
      } else if (score >= 0.5) {
        verdict = 'needs_revision';
      } else {
        verdict = 'rejected';
      }

      // Update content_queue row
      try {
        const { error } = await this.supabase
          .from('content_queue')
          .update({ status: verdict, confidence_score: score })
          .eq('id', params.contentId);

        if (error) {
          this.log('warn', `Failed to update content_queue: ${error.message}`);
        }
      } catch (dbErr) {
        this.log('warn', `Database error updating content_queue: ${dbErr}`);
      }

      await this.completeRun('completed', { content_generated: 1 });

      return {
        score,
        verdict,
        feedback: parsed.feedback,
        criteria: {
          accuracy: parsed.accuracy,
          completeness: parsed.completeness,
          clarity: parsed.clarity,
          examRelevance: parsed.examRelevance,
        },
      };
    } catch (err) {
      await this.completeRun('failed', { errors: [`${err}`] });
      throw err;
    }
  }

  async sweepStale(): Promise<SweepResult> {
    const result: SweepResult = { reviewed: 0, approved: 0, flagged: 0 };

    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: staleItems, error } = await this.supabase
        .from('content_queue')
        .select('id, generated_content, content_type, node_id')
        .eq('status', 'approved')
        .lt('created_at', sevenDaysAgo);

      if (error) {
        this.log('warn', `Failed to query stale content: ${error.message}`);
        return result;
      }

      if (!staleItems || staleItems.length === 0) {
        return result;
      }

      for (const item of staleItems) {
        try {
          const content =
            typeof item.generated_content === 'string'
              ? item.generated_content
              : JSON.stringify(item.generated_content);

          const score = await this.scoreContent({
            contentId: item.id,
            content,
            contentType: item.content_type || 'unknown',
          });

          result.reviewed++;

          if (score.verdict === 'approved') {
            result.approved++;
          } else {
            result.flagged++;
          }
        } catch (itemErr) {
          this.log('warn', `Failed to re-score item ${item.id}: ${itemErr}`);
          result.reviewed++;
          result.flagged++;
        }
      }
    } catch (err) {
      this.log('error', `sweepStale failed: ${err}`);
    }

    return result;
  }
}

export const qualityAgent = new QualityAgent();
