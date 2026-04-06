// ═══════════════════════════════════════════════════════════════
// TOPPERS API ROUTE
// List topper strategies and profiles
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import {
    TOPPER_STRATEGIES,
    getToppersByYear,
    getToppersByOptional,
    getAllYears,
    getAllOptionals
} from '@/lib/content/topper-strategies';

/**
 * GET /api/toppers
 */
export async function GET(request: NextRequest) {
    try {
        await requireSession();

        const { searchParams } = new URL(request.url);
        const year = searchParams.get('year');
        const optional = searchParams.get('optional');
        const meta = searchParams.get('meta');

        // Return metadata
        if (meta === 'true') {
            return NextResponse.json({
                years: getAllYears(),
                optionals: getAllOptionals(),
                total: TOPPER_STRATEGIES.length
            });
        }

        let toppers = TOPPER_STRATEGIES;

        if (year) {
            toppers = getToppersByYear(parseInt(year));
        } else if (optional) {
            toppers = getToppersByOptional(optional);
        }

        return NextResponse.json({
            toppers,
            total: toppers.length
        });

    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Please sign in' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to fetch toppers' },
            { status: 500 }
        );
    }
}
