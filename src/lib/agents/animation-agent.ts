import { BaseAgent } from './base-agent';
import { callAI } from '../ai/ai-provider-client';

export interface AnimationResult {
  manimPrompt: string;
  description: string;
  renderJobId?: string;
  status: 'prompt_ready' | 'rendering' | 'completed' | 'failed';
  estimatedDuration: number; // seconds
}

class AnimationAgent extends BaseAgent {
  constructor() {
    super('animation');
  }

  async execute(params: {
    nodeId?: string;
    topic: string;
    subject?: string;
    animationType?: 'concept' | 'case_study' | 'diagram';
  }): Promise<AnimationResult> {
    const runId = await this.startRun();

    try {
      const systemPrompt =
        'Generate a Manim animation description for a UPSC concept. Return JSON: {manimPrompt: string (Python Manim code description), description: string (what viewer will see), estimatedDuration: number (seconds)}. For case studies: include scenario setup, ethical dilemma visualization, and resolution animation.';

      const animType = params.animationType || 'concept';
      const userPrompt = `Topic: ${params.topic}${params.subject ? `\nSubject: ${params.subject}` : ''}\nAnimation type: ${animType}\n\nGenerate a Manim animation prompt for this UPSC concept.`;

      const raw = await callAI({ systemPrompt, userPrompt });

      let parsed: {
        manimPrompt: string;
        description: string;
        estimatedDuration: number;
      };

      try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON object found in AI response');
        parsed = JSON.parse(jsonMatch[0]);
      } catch (parseErr) {
        this.log('warn', `Failed to parse AI response: ${parseErr}`);
        throw new Error('Animation agent received malformed AI response');
      }

      const manimPrompt = parsed.manimPrompt || '';
      const description = parsed.description || '';
      const estimatedDuration = parsed.estimatedDuration || 30;

      // Try to submit render job to Manim service
      let renderJobId: string | undefined;
      let status: AnimationResult['status'] = 'prompt_ready';

      const manimUrl = process.env.MANIM_URL;
      if (manimUrl) {
        try {
          const resp = await fetch(`${manimUrl}/api/render`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: manimPrompt,
              topic: params.topic,
              type: animType,
            }),
          });

          if (resp.ok) {
            const renderData = await resp.json();
            renderJobId = renderData.jobId || renderData.id;
            status = 'rendering';
          } else {
            this.log('warn', `Manim render failed with status ${resp.status}`);
          }
        } catch (renderErr) {
          this.log('warn', `Manim render request failed: ${renderErr}`);
        }
      }

      // Write to content_queue
      try {
        const { error } = await this.supabase.from('content_queue').insert({
          node_id: params.nodeId || null,
          content_type: 'animation_prompt',
          generated_content: { manimPrompt, description },
          status: 'pending',
        });

        if (error) {
          this.log('warn', `Failed to write to content_queue: ${error.message}`);
        }
      } catch (dbErr) {
        this.log('warn', `Database error writing to content_queue: ${dbErr}`);
      }

      await this.completeRun('completed', { content_generated: 1 });

      return {
        manimPrompt,
        description,
        renderJobId,
        status,
        estimatedDuration,
      };
    } catch (err) {
      await this.completeRun('failed', { errors: [`${err}`] });
      throw err;
    }
  }
}

export const animationAgent = new AnimationAgent();
