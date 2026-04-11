// ═══════════════════════════════════════════════════════════════
// LEGAL/CONSTITUTIONAL ARTICLES API
// List and search constitutional articles
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import {
    CONSTITUTIONAL_ARTICLES,
    searchArticles,
    getHighRelevanceArticles
} from '@/lib/legal/constitution-data';

export const dynamic = 'force-dynamic';

/**
 * GET /api/legal/articles
 * List all articles or search
 */
export async function GET(request: NextRequest) {
    try {
        await requireSession();

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');
        const highRelevanceOnly = searchParams.get('relevance') === 'high';

        let articles;

        if (query) {
            articles = searchArticles(query);
        } else if (highRelevanceOnly) {
            articles = getHighRelevanceArticles();
        } else {
            articles = CONSTITUTIONAL_ARTICLES;
        }

        return NextResponse.json({
            articles,
            total: articles.length
        });

    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Please sign in' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to fetch articles' },
            { status: 500 }
        );
    }
}
