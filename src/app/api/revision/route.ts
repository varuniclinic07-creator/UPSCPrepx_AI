import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/session';

// GET /api/revision - Get user's revision cards and stats
export async function GET() {
    try {
        const session = await requireSession();
        const supabase = await createClient();
        const today = new Date().toISOString().split('T')[0];

        // Fetch notes for revision tracking
        const { data: notes, error: notesError } = await (supabase.from('notes') as any)
            .select('id, topic, subject, created_at, updated_at, view_count')
            .eq('user_id', (session as any).user.id)
            .order('created_at', { ascending: false });

        if (notesError) throw notesError;

        // Convert notes to revision cards with calculated mastery
        const cards = (notes || []).map((note: any) => {
            // Simple mastery calculation based on view count
            const mastery = Math.min(100, (note.view_count || 0) * 20);

            // Calculate next revision date using spaced repetition
            const _daysSinceCreated = Math.floor(
                (Date.now() - new Date(note.created_at).getTime()) / (1000 * 60 * 60 * 24)
            );

            // Fibonacci-like intervals: 1, 2, 3, 5, 8, 13, 21 days
            const intervals = [1, 2, 3, 5, 8, 13, 21];
            const revisionIndex = Math.min(note.view_count || 0, intervals.length - 1);
            const nextInterval = intervals[revisionIndex];

            const nextRevision = new Date(note.updated_at || note.created_at);
            nextRevision.setDate(nextRevision.getDate() + nextInterval);

            return {
                id: note.id,
                topic: note.topic,
                subject: note.subject,
                last_revised: note.updated_at,
                next_revision: nextRevision.toISOString(),
                revision_count: note.view_count || 0,
                mastery_level: mastery,
                content_type: 'note' as const,
            };
        });

        // Filter cards due today or overdue
        const dueToday = cards.filter((card: any) => {
            if (!card.next_revision) return false;
            return card.next_revision.split('T')[0] <= today;
        });

        // Calculate stats
        const stats = {
            totalCards: cards.length,
            masteredCards: cards.filter((c: any) => c.mastery_level >= 80).length,
            dueToday: dueToday.length,
            streak: 0, // Would need more complex tracking
        };

        return NextResponse.json({
            cards,
            dueToday: dueToday.slice(0, 20), // Limit to 20 per session
            stats,
        });
    } catch (error: any) {
        console.error('Error fetching revision data:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch revision data' },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}

// POST /api/revision - Update revision progress
export async function POST(request: NextRequest) {
    try {
        const session = await requireSession();
        const supabase = await createClient();
        const body = await request.json();

        const { cardId, remembered } = body;

        if (!cardId) {
            return NextResponse.json({ error: 'Card ID is required' }, { status: 400 });
        }

        // 1. First, get current view count
        const { data: note, error: fetchError } = await (supabase.from('notes') as any)
            .select('view_count')
            .eq('id', cardId)
            .eq('user_id', (session as any).user.id)
            .single();

        if (fetchError || !note) {
            throw new Error('Note not found');
        }

        // 2. Update view count and updated_at
        const { error: updateError } = await (supabase.from('notes') as any)
            .update({
                view_count: remembered ? (note.view_count || 0) + 1 : note.view_count,
                updated_at: new Date().toISOString(),
            })
            .eq('id', cardId)
            .eq('user_id', (session as any).user.id);

        if (updateError) throw updateError;

        // 3. Try to use RPC for atomic increment if remembered (as a bonus/backup check)
        if (remembered) {
            await ((supabase as any).rpc('increment_view_count', { note_id: cardId }));
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating revision:', error);
        const errorMessage = error.message || 'Unknown error';
        return NextResponse.json(
            { error: errorMessage },
            { status: errorMessage === 'Unauthorized' ? 401 : 500 }
        );
    }
}