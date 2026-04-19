/**
 * GET /api/agents/orchestrator/next-best-action → Recommendation
 */
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { OrchestratorAgentImpl } from '@/lib/agents/core/orchestrator-agent';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    const agent = new OrchestratorAgentImpl({ feature: 'dashboard' });
    const rec = await agent.nextBestAction(user.id);
    return NextResponse.json({ success: true, recommendation: rec });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message ?? err) }, { status: 500 });
  }
}
