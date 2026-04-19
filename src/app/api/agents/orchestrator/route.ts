/**
 * Orchestrator Agent HTTP surface.
 *
 * POST /api/agents/orchestrator        body: { message, mode? }       → MentorReply
 * POST /api/agents/orchestrator/plan   body: { horizonDays: 3 }       → StudyPlan
 * GET  /api/agents/orchestrator/next-best-action                       → Recommendation
 *
 * Thin wrapper — all logic lives in OrchestratorAgentImpl. Auth comes from the
 * Supabase server client cookie; rate-limit reuses the existing aiChat bucket.
 * Phase-1 hero surface for C3 (Mentor page) migration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rate-limiter';
import { OrchestratorAgentImpl } from '@/lib/agents/core/orchestrator-agent';
import type { MentorMode } from '@/lib/agents/core/types';

export const dynamic = 'force-dynamic';

const VALID_MODES: MentorMode[] = ['explain', 'strategy', 'revision', 'diagnostic'];

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const rl = await checkRateLimit(user.id, RATE_LIMITS.aiChat);
    if (!rl.success) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const message = typeof body?.message === 'string' ? body.message : '';
    const mode: MentorMode = VALID_MODES.includes(body?.mode) ? body.mode : 'explain';
    if (!message.trim()) {
      return NextResponse.json({ success: false, error: 'message required' }, { status: 400 });
    }

    const agent = new OrchestratorAgentImpl({ feature: 'mentor' });
    const reply = await agent.answer(user.id, message, { mode });
    return NextResponse.json({ success: true, reply });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: String(err?.message ?? err) },
      { status: 500 },
    );
  }
}
