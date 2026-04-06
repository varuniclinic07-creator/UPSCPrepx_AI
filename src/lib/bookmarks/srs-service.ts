/**
 * SRS Service (Spaced Repetition System)
 * 
 * Master Prompt v8.0 - Feature F14 (READ Mode)
 * - SM-2 Algorithm for scheduling reviews
 * - Calculate next review date based on Quality of recall
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SRSStats {
    interval_days: number;
    ease_factor: number;
    repetitions: number;
}

// SM-2 Algorithm Implementation
export function calculateNextReview(
    stats: SRSStats,
    quality: number // 0-5: 0-2=Forgot (Again), 3=Hard, 4=Good, 5=Easy
): SRSStats {
    let { interval_days, ease_factor, repetitions } = stats;

    if (quality < 3) {
        // Forgot the card: Reset progress
        return {
            interval_days: 0,
            ease_factor: Math.max(1.3, ease_factor - 0.2),
            repetitions: 0,
        };
    }

    // Success Case (Hard/Good/Easy)
    if (repetitions === 0) {
        interval_days = 1;
    } else if (repetitions === 1) {
        interval_days = 6;
    } else {
        interval_days = Math.ceil(interval_days * ease_factor);
    }

    // Adjust ease factor
    ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    ease_factor = Math.max(1.3, ease_factor); // Minimum 1.3

    repetitions += 1;

    // Modifier for Hard vs Easy
    if (quality === 3) { // Hard
        interval_days = Math.max(1, Math.ceil(interval_days * 1.2));
    } else if (quality === 5) { // Easy
        interval_days = Math.ceil(interval_days * 1.5); // Bonus interval
    }

    return { interval_days, ease_factor, repetitions };
}

export async function submitReview(
    bookmarkId: string,
    quality: number
) {
    // 1. Get current stats
    const { data: current } = await supabase
        .from('srs_stats')
        .select('*')
        .eq('bookmark_id', bookmarkId)
        .single();

    if (!current) return;

    // 2. Calculate new state
    const { interval_days, ease_factor, repetitions } = calculateNextReview(
        { interval_days: current.interval_days, ease_factor: current.ease_factor, repetitions: current.repetitions },
        quality
    );

    // 3. Compute next review date
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + interval_days);

    // 4. Update Database
    await supabase
        .from('srs_stats')
        .update({
            interval_days,
            ease_factor,
            repetitions,
            next_review_date: nextDate.toISOString(),
            last_reviewed_at: new Date().toISOString(),
            lapses: quality < 3 ? current.lapses + 1 : current.lapses
        })
        .eq('bookmark_id', bookmarkId);
}

export async function getDueBookmarks(userId: string) {
    const now = new Date().toISOString();
    
    const { data } = await supabase
        .from('bookmarks')
        .select('*, srs_stats(*)')
        .eq('user_id', userId)
        .lte('next_review_date', now);

    return data || [];
}

export const srsService = { submitReview, getDueBookmarks, calculateNextReview };
