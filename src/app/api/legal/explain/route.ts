// ═══════════════════════════════════════════════════════════════
// LEGAL EXPLAINER API
// Generate AI explanations for constitutional articles
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { explainArticle, compareArticles, getExamSummary } from '@/lib/legal/explainer-service';

/**
 * POST /api/legal/explain
 * Generate explanation for an article
 */
export async function POST(request: NextRequest) {
    try {
        await requireSession();

        const body = await request.json();
        const { articleId, query, mode } = body;

        if (!articleId) {
            return NextResponse.json(
                { error: 'Article ID is required' },
                { status: 400 }
            );
        }

        let result;

        switch (mode) {
            case 'compare':
                if (!body.compareWithId) {
                    return NextResponse.json(
                        { error: 'Second article ID required for comparison' },
                        { status: 400 }
                    );
                }
                result = await compareArticles(articleId, body.compareWithId);
                break;

            case 'summary':
                result = await getExamSummary(articleId);
                break;

            default:
                result = await explainArticle(articleId, query);
        }

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Legal explainer error:', error);

        if (error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Please sign in' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Failed to generate explanation' },
            { status: 500 }
        );
    }
}
