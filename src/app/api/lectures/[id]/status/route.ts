// ═══════════════════════════════════════════════════════════════
// LECTURE STATUS API
// /api/lectures/[id]/status
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { getLectureJobStatus } from '@/lib/queues/lecture-queue';

export const dynamic = 'force-dynamic';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireSession();
        const userId = (session as any).user.id;
        const { id: lectureId } = await params;

        const supabase = await createClient();

        // Get lecture job from database
        const { data: job, error } = await (supabase.from('lecture_jobs') as any)
            .select('*')
            .eq('id', lectureId)
            .single();

        if (error || !job) {
            return NextResponse.json(
                { error: 'Lecture not found' },
                { status: 404 }
            );
        }

        // Verify ownership
        if ((job as any).user_id !== userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Get queue status if still processing
        let queueStatus = null;
        if ((job as any).status !== 'ready' && (job as any).status !== 'failed') {
            queueStatus = await getLectureJobStatus(lectureId);
        }

        return NextResponse.json({
            id: (job as any).id,
            topic: (job as any).topic,
            subject: (job as any).subject_slug,
            status: (job as any).status,
            currentPhase: (job as any).current_phase,
            currentChapter: (job as any).current_chapter,
            totalChapters: (job as any).total_chapters,
            progressPercent: (job as any).progress_percent,
            outline: (job as any).outline,
            videoUrl: (job as any).video_url,
            notesPdfUrl: (job as any).notes_pdf_url,
            error: (job as any).error_message,
            queueStatus,
            startedAt: (job as any).started_at,
            estimatedCompletion: (job as any).estimated_completion,
            completedAt: (job as any).completed_at
        });

    } catch (error: any) {
        console.error('Lecture status API error:', error);

        if (error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Please sign in' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to get lecture status' },
            { status: 500 }
        );
    }
}
