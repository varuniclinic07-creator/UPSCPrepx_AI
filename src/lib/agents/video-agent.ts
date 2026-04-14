import { BaseAgent } from './base-agent';
import { callAI } from '../ai/ai-provider-client';

export interface VideoScene {
  sceneNumber: number;
  duration: number; // seconds
  narration: string;
  visualDescription: string;
  onScreenText?: string;
}

export interface VideoResult {
  script: string;
  scenes: VideoScene[];
  totalDuration: number;
  renderJobId?: string;
  status: 'script_ready' | 'rendering' | 'completed' | 'failed';
}

class VideoAgent extends BaseAgent {
  constructor() {
    super('video');
  }

  async execute(params: {
    nodeId?: string;
    topic: string;
    subject?: string;
    style?: string;
  }): Promise<VideoResult> {
    const runId = await this.startRun();

    try {
      const systemPrompt =
        'Generate a 60-second UPSC explainer video script. Return JSON: {script: string, scenes: [{sceneNumber, duration, narration, visualDescription, onScreenText}]}. Each scene 10-15 seconds. Hook should grab attention. Include visual descriptions for each scene.';

      const userPrompt = `Topic: ${params.topic}${params.subject ? `\nSubject: ${params.subject}` : ''}${params.style ? `\nStyle: ${params.style}` : ''}\n\nGenerate a 5-scene video script (hook, concept1, concept2, example, CTA).`;

      const raw = await callAI({ systemPrompt, userPrompt, providerPreferences: this.getProviderPreferences() });

      let parsed: { script: string; scenes: VideoScene[] };

      try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON object found in AI response');
        parsed = JSON.parse(jsonMatch[0]);
      } catch (parseErr) {
        this.log('warn', `Failed to parse AI response: ${parseErr}`);
        throw new Error('Video agent received malformed AI response');
      }

      const scenes: VideoScene[] = (parsed.scenes || []).map((s, i) => ({
        sceneNumber: s.sceneNumber ?? i + 1,
        duration: s.duration ?? 12,
        narration: s.narration ?? '',
        visualDescription: s.visualDescription ?? '',
        onScreenText: s.onScreenText,
      }));

      const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

      // Try to submit render job to Remotion
      let renderJobId: string | undefined;
      let status: VideoResult['status'] = 'script_ready';

      const remotionUrl = process.env.REMOTION_URL;
      if (remotionUrl) {
        try {
          const resp = await fetch(`${remotionUrl}/api/render`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scenes,
              topic: params.topic,
              style: params.style || 'default',
            }),
          });

          if (resp.ok) {
            const renderData = await resp.json();
            renderJobId = renderData.jobId || renderData.id;
            status = 'rendering';
          } else {
            this.log('warn', `Remotion render failed with status ${resp.status}`);
          }
        } catch (renderErr) {
          this.log('warn', `Remotion render request failed: ${renderErr}`);
        }
      }

      // Write to content_queue
      try {
        const { error } = await this.supabase.from('content_queue').insert({
          node_id: params.nodeId || null,
          content_type: 'video_script',
          generated_content: { script: parsed.script, scenes },
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
        script: parsed.script,
        scenes,
        totalDuration,
        renderJobId,
        status,
      };
    } catch (err) {
      await this.completeRun('failed', { errors: [`${err}`] });
      throw err;
    }
  }
}

export const videoAgent = new VideoAgent();
