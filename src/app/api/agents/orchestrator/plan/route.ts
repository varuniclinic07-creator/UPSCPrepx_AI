/**
 * POST /api/agents/orchestrator/plan  body: { horizonDays: number } → StudyPlan
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { OrchestratorAgentImpl } from '@/lib/agents/core/orchestrator-agent';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const horizonDays = Math.max(1, Math.min(14, Number(body?.horizonDays ?? 7)));
    const agent = new OrchestratorAgentImpl({ feature: 'mentor' });
    const plan = await agent.studyPlan(user.id, horizonDays);
    return NextResponse.json({ success: true, plan });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message ?? err) }, { status: 500 });
  }
}
