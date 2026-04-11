// ═══════════════════════════════════════════════════════════════
// TOPPER DETAIL API
// Get specific topper profile
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getTopperById } from '@/lib/content/topper-strategies';

export const dynamic = 'force-dynamic';

/**
 * GET /api/toppers/[id]
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await requireSession();

        const topper = getTopperById(params.id);

        if (!topper) {
            return NextResponse.json(
                { error: 'Topper not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ topper });

    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Please sign in' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to fetch topper details' },
            { status: 500 }
        );
    }
}
