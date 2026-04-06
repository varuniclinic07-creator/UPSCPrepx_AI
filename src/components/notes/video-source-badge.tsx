/**
 * Video Source Badge Component
 * 
 * Master Prompt v8.0 - Feature F17 (WATCH Mode)
 * - Displayed in the Notes Library to link a Note back to a Video
 * - Clicking opens the video player at the specific timestamp
 * - Bilingual support
 */

'use client';

import React from 'react';
import Play from 'lucide-react'; // Importing icon manually from lucide-react

interface VideoSourceBadgeProps {
    videoId: string;
    timestampSeconds: number;
    showHindi?: boolean;
}

/**
 * Formats seconds into MM:SS
 */
function formatTime(s: number): string {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}

export function VideoSourceBadge({ videoId, timestampSeconds, showHindi = false }: VideoSourceBadgeProps) {
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening the note detail modal if nested in a card
        // Navigate to the video player page
        // In production: router.push(`/video/${videoId}?t=${timestampSeconds}`)
        window.open(`/video/${videoId}?t=${timestampSeconds}`, '_blank');
    };

    return (
        <button
            onClick={handleClick}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-saffron-100 hover:bg-saffron-200 text-saffron-700 text-[10px] font-medium transition-colors border border-saffron-200 hover:border-saffron-300 cursor-pointer"
        >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>            </svg>            {showHindi ? 'वीडियो' : 'Video'} @ {formatTime(timestampSeconds)}        </button>    );}