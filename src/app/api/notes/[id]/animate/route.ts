/**
 * Note Animation API — /api/notes/[id]/animate
 *
 * POST: Trigger Manim animation for a diagram in a note
 * Supports both raw scene_code (legacy) and template-based rendering
 * via the 13 pre-built scene classes in docker/manim/scenes/
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** Scene templates map to docker/manim/scenes/ classes */
const SCENE_TEMPLATES: Record<string, string> = {
  timeline: 'TimelineScene',
  flowchart: 'FlowchartScene',
  map: 'MapScene',
  comparison: 'ComparisonTableScene',
  pie_chart: 'PieChartScene',
  bar_graph: 'BarGraphScene',
  tree: 'TreeDiagramScene',
  venn: 'VennDiagramScene',
  cycle: 'CycleScene',
  math: 'MathSolverScene',
  article: 'ArticleHighlightScene',
  scheme: 'SchemeInfoCardScene',
  mind_map: 'MindMapScene',
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { diagramType, description, title, config } = await request.json();

    if (!description && !config) {
      return NextResponse.json({ error: 'Description or config required' }, { status: 400 });
    }

    const manimUrl = process.env.MANIM_URL;
    if (!manimUrl) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Manim service not configured',
      });
    }

    try {
      let resp: Response;

      // Use template-based rendering when a known diagramType is provided
      const sceneName = SCENE_TEMPLATES[diagramType];
      if (sceneName && config) {
        resp = await fetch(`${manimUrl}/api/render`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: description || title || diagramType,
            topic: title || diagramType,
            type: diagramType,
            config,
          }),
        });
      } else {
        // Fallback: raw scene_code rendering
        const sceneCode = generateManimScene(diagramType, description, title);
        resp = await fetch(`${manimUrl}/render`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scene_code: sceneCode,
            scene_name: 'DiagramScene',
            quality: 'medium_quality',
          }),
        });
      }

      const data = await resp.json();

      return NextResponse.json({
        jobId: data.job_id,
        status: data.status || 'queued',
        message: 'Animation generation started',
      });
    } catch {
      return NextResponse.json({
        status: 'service_unavailable',
        message: 'Manim service is not reachable',
      });
    }
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

function generateManimScene(type: string, description: string, title: string): string {
  return `
from manim import *

class DiagramScene(Scene):
    def construct(self):
        title = Text("${title.replace(/"/g, '\\"')}", font_size=36)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        desc = Text("${description.replace(/"/g, '\\"').slice(0, 200)}", font_size=24)
        desc.next_to(title, DOWN, buff=0.5)
        self.play(FadeIn(desc))
        self.wait(2)
  `.trim();
}
