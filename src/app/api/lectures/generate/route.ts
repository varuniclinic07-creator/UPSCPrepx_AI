// ═══════════════════════════════════════════════════════════════
// LECTURE GENERATION API
// /api/lectures/generate
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { addLectureJob } from '@/lib/queues/lecture-queue';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        // 1. Require authentication
        const session = await requireSession();
        const userId = (session as any).user.id;

        const { topic, subject, language = 'english' } = await request.json();

        if (!topic || !subject) {
            return NextResponse.json(
                { error: 'Topic and subject are required' },
                { status: 400 }
            );
        }

        // 2. Check lecture generation limits
        const supabase = await createClient();

        const { data: limitCheck } = await (supabase as any).rpc('can_generate_lecture', {
            p_user_id: userId
        });

        if (!limitCheck || !(limitCheck as any)[0]?.can_generate) {
            return NextResponse.json(
                {
                    error: 'Lecture generation limit reached',
                    reason: (limitCheck as any)?.[0]?.reason || 'Unknown',
                    monthlyRemaining: (limitCheck as any)?.[0]?.monthly_remaining || 0,
                    dailyRemaining: (limitCheck as any)?.[0]?.daily_remaining || 0
                },
                { status: 429 }
            );
        }

        // 3. Create lecture job record
        const lectureJobId = uuidv4();

        const { error: jobError } = await (supabase.from('lecture_jobs') as any)
            .insert({
                id: lectureJobId,
                user_id: userId,
                topic,
                subject_slug: subject,
                language,
                status: 'queued'
            });

        if (jobError) {
            return NextResponse.json(
                { error: 'Failed to create lecture job' },
                { status: 500 }
            );
        }

        // 4. Add to BullMQ queue
        const { jobId, queuePosition } = await addLectureJob({
            jobId: lectureJobId,
            userId: userId,
            topic,
            subject,
            language,
            targetDuration: 180
        });

        // 5. Increment usage counter
        await (supabase as any).rpc('increment_lecture_usage', {
            p_user_id: userId
        });

        return NextResponse.json({
            success: true,
            lectureId: lectureJobId,
            queueJobId: jobId,
            queuePosition,
            status: 'queued',
            estimatedTime: queuePosition * 30 + 30 // ~30 min per lecture + this one
        });

    } catch (error: any) {
        console.error('Lecture generation API error:', error);

        if (error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Please sign in' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to start lecture generation' },
            { status: 500 }
        );
    }
}
