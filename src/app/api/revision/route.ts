import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/session';
import { getDueRevisions, getMasteryStats, updateMastery } from '@/lib/mastery/mastery-service';

export const dynamic = 'force-dynamic';

// GET /api/revision - Get user's revision cards and stats (SM-2 powered)
export async function GET() {
    try {
        const session = await requireSession();
        const supabase = await createClient();
        const userId = (session as any).user.id;

        // Get mastery-based due items
        const dueItems = await getDueRevisions(userId, 20);

        // Also get legacy notes for users who haven't built mastery yet
        const { data: notes } = await (supabase.from('notes') as any)
            .select('id, topic, subject, created_at, updated_at, view_count')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        // Convert notes to cards (fallback for topics not in knowledge_nodes)
        const noteCards = (notes || []).map((note: any) => {
            const mastery = Math.min(100, (note.view_count || 0) * 20);
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
                source: 'legacy' as const,
            };
        });

        // Convert mastery due items to cards
        const masteryCards = dueItems.map((item) => ({
            id: item.node_id,
            topic: item.title,
            subject: item.subject,
            last_revised: item.last_attempted_at,
            next_revision: item.next_revision_at,
            revision_count: 0,
            mastery_level: masteryLevelToPercent(item.mastery_level),
            content_type: 'knowledge_node' as const,
            source: 'mastery' as const,
        }));

        // Merge: mastery cards first (SM-2 scheduled), then legacy notes
        const today = new Date().toISOString().split('T')[0];
        const dueNoteCards = noteCards.filter((card: any) =>
            card.next_revision?.split('T')[0] <= today
        );

        const allDue = [...masteryCards, ...dueNoteCards];
        const allCards = [...masteryCards, ...noteCards];

        // Get stats from mastery engine
        const stats = await getMasteryStats(userId);

        return NextResponse.json({
            cards: allCards,
            dueToday: allDue.slice(0, 20),
            stats: {
                totalCards: allCards.length,
                masteredCards: stats.mastered + noteCards.filter((c: any) => c.mastery_level >= 80).length,
                dueToday: allDue.length,
                streak: stats.current_streak,
            },
        });
    } catch (error: any) {
        console.error('Error fetching revision data:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch revision data' },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}

// POST /api/revision - Update revision progress (SM-2 powered)
export async function POST(request: NextRequest) {
    try {
        const session = await requireSession();
        const supabase = await createClient();
        const body = await request.json();
        const userId = (session as any).user.id;

        const { cardId, remembered, source } = body;

        if (!cardId) {
            return NextResponse.json({ error: 'Card ID is required' }, { status: 400 });
        }

        // If this is a mastery/knowledge_node card, use SM-2 update
        if (source === 'mastery') {
            const correct = remembered ? 1 : 0;
            await updateMastery(userId, cardId, correct, 1, 0);
            return NextResponse.json({ success: true, engine: 'sm2' });
        }

        // Legacy notes path
        const { data: note, error: fetchError } = await (supabase.from('notes') as any)
            .select('view_count')
            .eq('id', cardId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !note) {
            throw new Error('Note not found');
        }

        const { error: updateError } = await (supabase.from('notes') as any)
            .update({
                view_count: remembered ? (note.view_count || 0) + 1 : note.view_count,
                updated_at: new Date().toISOString(),
            })
            .eq('id', cardId)
            .eq('user_id', userId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, engine: 'legacy' });
    } catch (error: any) {
        console.error('Error updating revision:', error);
        const errorMessage = error.message || 'Unknown error';
        return NextResponse.json(
            { error: errorMessage },
            { status: errorMessage === 'Unauthorized' ? 401 : 500 }
        );
    }
}

function masteryLevelToPercent(level: string): number {
    switch (level) {
        case 'not_started': return 0;
        case 'weak': return 20;
        case 'developing': return 45;
        case 'strong': return 70;
        case 'mastered': return 95;
        default: return 0;
    }
}
