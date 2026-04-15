/**
 * Note Animation API — /api/notes/[id]/animate
 *
 * POST: Trigger Manim animation for a diagram in a note
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { diagramType, description, title } = await request.json();

    if (!description) {
      return NextResponse.json({ error: 'Description required' }, { status: 400 });
    }

    // Call Manim service if available
    const manimUrl = process.env.MANIM_URL;
    if (!manimUrl) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Manim service not configured',
      });
    }

    // Generate Manim scene code via AI
    const sceneCode = generateManimScene(diagramType, description, title);

    try {
      const resp = await fetch(`${manimUrl}/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scene_code: sceneCode,
          scene_name: 'DiagramScene',
          quality: 'medium_quality',
        }),
      });

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
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

function generateManimScene(type: string, description: string, title: string): string {
  // Generate a basic Manim scene based on diagram type
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
