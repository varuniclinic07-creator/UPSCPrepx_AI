/**
 * Video Player Page
 * 
 * Master Prompt v8.0 - Feature F16 (WATCH Mode)
 * - Combines Video Player, Transcript, and Notes
 * - Bilingual support
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { CustomVideoPlayer } from '@/components/video/custom-video-player';
import { TranscriptBar } from '@/components/video/transcript-bar';

interface VideoData {
    id: string;
    topic: string;
    video_url: string;
    transcript?: { start: number; end: number; text: string }[];
}

export default function VideoPlayerPage() {
    const params = useParams();
    const router = useRouter();
    const [showHindi, setShowHindi] = useState(false);
    const [video, setVideo] = useState<VideoData | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [isTranscriptOpen, setIsTranscriptOpen] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In production: fetch(`/api/video/${params.id}`)
        // Mock Data
        setVideo({
            id: params.id as string,
            topic: 'Fundamental Rights & Duties - Polity Masterclass',
            video_url: '/placeholder-video.mp4', // Replace with real URL
            transcript: [
                { start: 0, end: 10, text: 'Welcome to the masterclass on Fundamental Rights. Let's start with Article 12.' },
                { start: 10, end: 25, text: 'Article 12 defines the "State". It includes Govt, Parliament, and Local Authorities.' },
                { start: 25, end: 40, text: 'Fundamental Rights are enshrined in Part III of the Constitution (Art 12-35).' },
                { start: 40, end: 55, text: 'They are justiciable, meaning you can go to court if violated.' },
                { start: 55, end: 70, text: 'Let's discuss Article 14: Equality before Law.' },
                { start: 70, end: 85, text: 'Article 15 prohibits discrimination on grounds of religion, race, caste, sex.' },
            ]
        });
        setLoading(false);
    }, [params.id]);

    if (loading) return <div className="h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;
    if (!video) return <div className="h-screen bg-gray-900 flex items-center justify-center text-white">Video not found</div>;

    return (
        <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
            {/* Top Bar */}
            <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-950">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-sm font-semibold text-saffron-500 truncate max-w-[200px] md:max-w-md">{video.topic}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsTranscriptOpen(!isTranscriptOpen)} className="p-2 hover:bg-gray-800 rounded transition-colors text-xs">
                        {isTranscriptOpen ? 'Hide Transcript' : 'Show Transcript'}
                    </button>
                    <button onClick={() => setShowHindi(!showHindi)} className="px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 rounded transition-colors">
                        {showHindi ? ' हिंदी' : ' EN'}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Video Area */}
                <div className=