/**
 * Knowledge Agent HTTP surface.
 *
 * POST /api/agents/knowledge
 *   body: { action: 'retrieve', query, topK?, filter? } → { chunks }
 *   body: { action: 'ground',   query, chunks, cite?, maxTokens? } → GroundedAnswer
 *   body: { action: 'ingest',   type, content, meta } → IngestResult   (admin-gated)
 *
 * Phase-1 hero surface for C1 (Notes page) migration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rate-limiter';
import { KnowledgeAgentImpl } from '@/lib/agents/core/knowledge-agent';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    const rl = await checkRateLimit(user.id, RATE_LIMITS.aiChat);
    if (!rl.success) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    const agent = new KnowledgeAgentImpl({ feature: 'notes', userId: user.id });

    switch (action) {
      case 'retrieve': {
        const query = String(body?.query ?? '');
        if (!query) return NextResponse.json({ success: false, error: 'query required' }, { status: 400 });
        const topK = Number(body?.topK ?? 6);
        const filter = body?.filter ?? undefined;
        const chunks = await agent.retrieve(query, { topK, filter });
        return NextResponse.json({ success: true, chunks });
      }
      case 'ground': {
        const query = String(body?.query ?? '');
        const chunks = Array.isArray(body?.chunks) ? body.chunks : [];
        if (!query || !chunks.length) {
          return NextResponse.json({ success: false, error: 'query + chunks required' }, { status: 400 });
        }
        const answer = await agent.ground(query, chunks, {
          cite: body?.cite !== false,
          maxTokens: Math.min(800, Number(body?.maxTokens ?? 400)),
        });
        return NextResponse.json({ success: true, answer });
      }
      case 'ingest': {
        // Admin-only ingest (use service-role context instead of user token
        // when scripted; here we gate by users.role = admin for safety).
        const { data: profile } = await supabase
          .from('users').select('role').eq('id', user.id).maybeSingle();
        if (profile?.role !== 'admin') {
          return NextResponse.json({ success: false, error: 'admin only' }, { status: 403 });
        }
        const res = await agent.ingest({
          type: body?.type ?? 'note',
          content: String(body?.content ?? ''),
          meta: body?.meta ?? {},
        });
        return NextResponse.json({ success: true, ingest: res });
      }
      default:
        return NextResponse.json({ success: false, error: 'unknown action' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message ?? err) }, { status: 500 });
  }
}
