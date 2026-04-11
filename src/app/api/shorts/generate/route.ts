// ═══════════════════════════════════════════════════════════════
// SHORTS GENERATE API
// Create 60-second educational shorts
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { createShort } from '@/lib/video/shorts-generator';

export const dynamic = 'force-dynamic';

/**
 * POST /api/shorts/generate
 */
export async function POST(request: NextRequest) {
    try {
        const session = await requireSession();
        const body = await request.json();

        const { topic, subject, duration, style } = body;

        if (!topic || !subject) {
            return NextResponse.json(
                { error: 'Topic and subject are required' },
                { status: 400 }
            );
        }

        const short = await createShort((session as any).user.id, {
            topic,
            subject,
            targetDuration: duration || 60,
            style: style || 'explanatory'
        });

        return NextResponse.json({ short });

    } catch (error: any) {
        console.error('Shorts generation error:', error);

        if (error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Please sign in' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Failed to generate short' },
            { status: 500 }
        );
    }
}
