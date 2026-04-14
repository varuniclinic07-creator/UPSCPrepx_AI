import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { solveEquation } from '@/lib/math/equation-solver';
import { errors } from '@/lib/security/error-sanitizer';
import { normalizeUPSCInput } from '@/lib/agents/normalizer-agent';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const session = await requireSession();
        const { equation } = await request.json();

        if (!equation || typeof equation !== 'string') {
            return errors.validation([{ field: 'equation', message: 'Equation is required' }]);
        }

        // Prevent overly long inputs
        if (equation.length > 1000) {
            return errors.validation([{ field: 'equation', message: 'Equation too long' }]);
        }

        // Best-effort KG normalization
        try { await normalizeUPSCInput(equation.trim()); } catch { /* best-effort */ }

        const solution = await solveEquation(equation.trim());
        return NextResponse.json({ solution });

    } catch (error) {
        console.error('[API] Math solve error:', error);
        return errors.internal(error);
    }
}
