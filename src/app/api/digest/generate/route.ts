import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { generateDigest, getDigestHistory } from '@/lib/digest/digest-generator';
import { errors } from '@/lib/security/error-sanitizer';
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rate-limiter';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const session = await requireSession();
        const userId = session.id;

        // Rate limit check
        const rateLimit = await checkRateLimit(userId, RATE_LIMITS.aiGenerate);
        if (!rateLimit.success) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
                { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter || 60) } }
            );
        }
        const { subjects, length, includeQuestions } = await request.json();

        // Validate subjects if provided
        const validSubjects = ['Economy', 'Polity', 'Environment', 'IR', 'History', 'Geography', 'Science'];
        const reqSubjects = subjects || ['Economy', 'Polity', 'Environment', 'IR'];

        if (!Array.isArray(reqSubjects) || reqSubjects.some((s: any) => !validSubjects.includes(s))) {
            return errors.validation([{ field: 'subjects', message: 'Invalid subjects' }]);
        }

        const digest = await generateDigest({
            userId: userId,
            subjects: reqSubjects,
            length: length || 'brief',
            includeQuestions: includeQuestions !== false
        });

        return NextResponse.json({ digest });

    } catch (error) {
        console.error('[API] Digest generate error:', error);
        return errors.internal(error);
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await requireSession();
        const userId = session.id;
        const history = await getDigestHistory(userId);
        return NextResponse.json({ history });

    } catch (error) {
        console.error('[API] Digest history error:', error);
        return errors.internal(error);
    }
}
