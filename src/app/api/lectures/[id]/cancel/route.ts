// ═══════════════════════════════════════════════════════════════
// LECTURE CANCEL API
// /api/lectures/[id]/cancel
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireSession();
        const userId = (session as any).user.id;
        const lectureId = params.id;

        const supabase = await createClient();

        // Get lecture job
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

        // Can only cancel if in queued or processing status
        if ((job as any).status !== 'queued' && (job as any).status !== 'processing') {
            return NextResponse.json(
                { error: `Cannot cancel lecture in ${(job as any).status} status` },
                { status: 400 }
            );
        }

        // Update status to cancelled
        await (supabase.from('lecture_jobs') as any)
            .update({
                status: 'cancelled',
                updated_at: new Date().toISOString()
            })
            .eq('id', lectureId);

        return NextResponse.json({
            success: true,
            message: 'Lecture generation cancelled'
        });

    } catch (error: any) {
        console.error('Lecture cancel API error:', error);
        return NextResponse.json(
            { error: 'Failed to cancel lecture' },
            { status: 500 }
        );
    }
}
