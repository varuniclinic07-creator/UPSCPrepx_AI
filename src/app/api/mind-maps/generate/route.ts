import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/auth-config';
import { checkAccess } from '@/lib/auth/check-access';
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rate-limiter';
import { normalizeUPSCInput } from '@/lib/agents/normalizer-agent';

export const dynamic = 'force-dynamic';


// POST /api/mind-maps/generate - Generate a new mind map
export async function POST(request: NextRequest) {
    try {
        const session = await requireSession();

        // Rate limit check
        const rateLimitId = (session as any).user.id;
        const rateLimit = await checkRateLimit(rateLimitId, RATE_LIMITS.aiGenerate);
        if (!rateLimit.success) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
                { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter || 60) } }
            );
        }

        // Check entitlement (free: 2 mind maps/day)
        const access = await checkAccess((session as any).user.id, 'mind_maps');
        if (!access.allowed) {
            return NextResponse.json(
                { error: access.reason, remaining: access.remaining },
                { status: 403 }
            );
        }

        const supabase = await createClient();
        const body = await request.json();

        const { topic, subject } = body;

        if (!topic?.trim()) {
            return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
        }

        // Best-effort UPSC input normalization
        let normalized: any = null;
        try { normalized = await normalizeUPSCInput(topic || ''); } catch (_e) { /* non-blocking */ }

        // Generate mind map structure using AI (simplified version)
        // In production, this would call the AI API
        const mindMapNodes = generateMindMapStructure(topic, subject);

        // Store the mind map (using notes table with special content type)
        const { data: mindMap, error } = await (supabase.from('notes') as any)
            .insert({
                user_id: (session as any).user.id,
                topic: topic.trim(),
                subject: subject || 'General',
                content: {
                    type: 'mind_map',
                    nodes: mindMapNodes,
                    connections: generateConnections(mindMapNodes),
                },
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            id: (mindMap as any).id,
            topic: (mindMap as any).topic,
            subject: (mindMap as any).subject,
            nodes: mindMapNodes,
            created_at: (mindMap as any).created_at,
        });
    } catch (error: any) {
        console.error('Error generating mind map:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate mind map' },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}

// Helper function to generate mind map structure
function generateMindMapStructure(topic: string, subject?: string) {
    // This would be replaced with AI generation in production
    const subtopics = getSubtopics(topic, subject);

    const nodes = [
        {
            id: 'root',
            label: topic,
            type: 'root',
            x: 400,
            y: 300,
        },
        ...subtopics.map((subtopic, index) => ({
            id: `node-${index}`,
            label: subtopic.label,
            type: 'branch',
            x: 400 + Math.cos((index * 2 * Math.PI) / subtopics.length) * 200,
            y: 300 + Math.sin((index * 2 * Math.PI) / subtopics.length) * 200,
            details: subtopic.details,
        })),
    ];

    return nodes;
}

function generateConnections(nodes: any[]) {
    const rootNode = nodes.find((n: any) => n.type === 'root');
    if (!rootNode) return [];

    return nodes
        .filter((n: any) => n.type !== 'root')
        .map((node: any) => ({
            from: rootNode.id,
            to: node.id,
        }));
}

function getSubtopics(topic: string, _subject?: string) {
    // Mock subtopics based on topic keywords
    const topicLower = topic.toLowerCase();

    if (topicLower.includes('constitution') || topicLower.includes('polity')) {
        return [
            { label: 'Preamble', details: 'Soul of the Constitution' },
            { label: 'Fundamental Rights', details: 'Articles 12-35' },
            { label: 'DPSP', details: 'Articles 36-51' },
            { label: 'Fundamental Duties', details: 'Article 51A' },
            { label: 'Parliament', details: 'Lok Sabha & Rajya Sabha' },
            { label: 'Judiciary', details: 'Supreme Court, High Courts' },
        ];
    }

    if (topicLower.includes('history') || topicLower.includes('mughal')) {
        return [
            { label: 'Founding', details: 'Babur - Battle of Panipat 1526' },
            { label: 'Golden Era', details: 'Akbar\'s reign' },
            { label: 'Architecture', details: 'Taj Mahal, Red Fort' },
            { label: 'Administration', details: 'Mansabdari System' },
            { label: 'Decline', details: 'Aurangzeb onwards' },
            { label: 'Legacy', details: 'Cultural synthesis' },
        ];
    }

    // Default subtopics
    return [
        { label: 'Introduction', details: 'Basic concepts' },
        { label: 'Key Features', details: 'Important characteristics' },
        { label: 'UPSC Relevance', details: 'Exam importance' },
        { label: 'Related Topics', details: 'Connected concepts' },
        { label: 'Current Affairs', details: 'Recent developments' },
    ];
}