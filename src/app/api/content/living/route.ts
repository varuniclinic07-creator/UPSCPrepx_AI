/**
 * Living Content API — /api/content/living
 *
 * Universal on-demand content generation for any UPSC topic.
 * Checks knowledge_nodes for existing content; generates fresh content
 * via Hermes agents if missing or stale (freshness_score < 0.5).
 *
 * This is the backbone of "Living Pages" — every dashboard page can call
 * this single endpoint to get topic-specific content that's always fresh.
 *
 * POST { topic, contentType, subject?, brevityLevel?, forceRefresh? }
 * Returns { content, sources, nodeId, freshness, generatedNow }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireSession } from '@/lib/auth/session';
import { normalizeUPSCInput } from '@/lib/agents/normalizer-agent';

export const dynamic = 'force-dynamic';

type LivingContentType =
  | 'notes'
  | 'quiz'
  | 'mind_map'
  | 'answer_framework'
  | 'doubt_answer'
  | 'evaluation'
  | 'video_script'
  | 'animation';

interface LivingContentRequest {
  topic: string;
  contentType: LivingContentType;
  subject?: string;
  brevityLevel?: string;
  forceRefresh?: boolean;
  /** For doubt/evaluation: the user's question or answer text */
  userInput?: string;
  /** For quiz: number of questions */
  questionCount?: number;
}

interface LivingContentResponse {
  success: boolean;
  content?: any;
  sources?: Array<{ type: string; title: string; url?: string }>;
  nodeId?: string;
  freshness?: number;
  generatedNow: boolean;
  provider?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body: LivingContentRequest = await request.json();

    if (!body.topic || !body.contentType) {
      return NextResponse.json<LivingContentResponse>({
        success: false,
        generatedNow: false,
        error: 'topic and contentType are required',
      }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // Step 1: Normalize topic → KG node
    const normalized = await normalizeUPSCInput(body.topic);
    const subject = body.subject || normalized.subject;

    // Step 2: Check existing content in content_queue
    if (!body.forceRefresh && normalized.nodeId) {
      const { data: existing } = await supabase
        .from('content_queue')
        .select('generated_content, confidence_score, created_at')
        .eq('node_id', normalized.nodeId)
        .eq('content_type', mapContentType(body.contentType))
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        // Check freshness — content less than 7 days old is fresh
        const age = Date.now() - new Date(existing.created_at).getTime();
        const isFresh = age < 7 * 24 * 60 * 60 * 1000;

        if (isFresh) {
          return NextResponse.json<LivingContentResponse>({
            success: true,
            content: existing.generated_content,
            nodeId: normalized.nodeId,
            freshness: existing.confidence_score,
            generatedNow: false,
          });
        }
      }

      // Also check knowledge_nodes directly for content
      const { data: nodeData } = await supabase
        .from('knowledge_nodes')
        .select('content, freshness_score, metadata')
        .eq('id', normalized.nodeId)
        .single();

      if (nodeData?.content && nodeData.freshness_score > 0.5 && !body.forceRefresh) {
        return NextResponse.json<LivingContentResponse>({
          success: true,
          content: { content: nodeData.content, ...(nodeData.metadata || {}) },
          nodeId: normalized.nodeId,
          freshness: nodeData.freshness_score,
          generatedNow: false,
        });
      }
    }

    // Step 3: Generate fresh content via Hermes agents
    const { hermes } = await import('@/lib/agents/orchestrator');

    let result;
    switch (body.contentType) {
      case 'notes':
        result = await hermes.dispatch({
          type: 'generate_notes',
          nodeId: normalized.nodeId || undefined,
          topic: body.topic,
          subject,
          payload: { brevityLevel: body.brevityLevel || 'comprehensive' },
        });
        break;

      case 'quiz':
        result = await hermes.dispatch({
          type: 'generate_quiz',
          nodeId: normalized.nodeId || undefined,
          topic: body.topic,
          subject,
          payload: { questionCount: body.questionCount || 10 },
        });
        break;

      case 'mind_map':
        result = await hermes.dispatch({
          type: 'generate_notes',
          nodeId: normalized.nodeId || undefined,
          topic: body.topic,
          subject,
          payload: { brevityLevel: '500', format: 'mind_map' },
        });
        break;

      case 'doubt_answer':
        const { evaluatorAgent } = await import('@/lib/agents/evaluator-agent');
        const doubtResult = await evaluatorAgent.answerDoubt({
          question: body.userInput || body.topic,
          subject,
          context: body.topic,
        });
        result = { success: true, data: doubtResult };
        break;

      case 'evaluation':
        const { evaluatorAgent: evalAgent } = await import('@/lib/agents/evaluator-agent');
        const evalResult = await evalAgent.evaluateAnswer({
          questionId: '',
          answerText: body.userInput || '',
          topic: body.topic,
          subject,
        });
        result = { success: true, data: evalResult };
        break;

      case 'video_script':
        result = await hermes.dispatch({
          type: 'generate_video',
          nodeId: normalized.nodeId || undefined,
          topic: body.topic,
          subject,
        });
        break;

      case 'animation':
        result = await hermes.dispatch({
          type: 'generate_animation',
          nodeId: normalized.nodeId || undefined,
          topic: body.topic,
          subject,
          payload: { animationType: subject === 'GS4' ? 'case_study' : 'concept' },
        });
        break;

      default:
        result = await hermes.dispatch({
          type: 'generate_notes',
          nodeId: normalized.nodeId || undefined,
          topic: body.topic,
          subject,
        });
    }

    if (!result || !result.success) {
      return NextResponse.json<LivingContentResponse>({
        success: false,
        generatedNow: true,
        error: result?.error || 'Content generation failed',
      }, { status: 500 });
    }

    return NextResponse.json<LivingContentResponse>({
      success: true,
      content: result.data,
      nodeId: normalized.nodeId || undefined,
      freshness: 1.0,
      generatedNow: true,
    });
  } catch (error) {
    console.error('[api/content/living] Failed:', error);
    return NextResponse.json<LivingContentResponse>({
      success: false,
      generatedNow: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/** Map our content types to content_queue content_type enum */
function mapContentType(type: LivingContentType): string {
  const map: Record<LivingContentType, string> = {
    notes: 'note',
    quiz: 'mcq_set',
    mind_map: 'mind_map',
    answer_framework: 'answer_framework',
    doubt_answer: 'note',
    evaluation: 'note',
    video_script: 'video_script',
    animation: 'animation_prompt',
  };
  return map[type] || 'note';
}
