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
import { createBrowserClient } from '@supabase/ssr';

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
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchVideo() {
            try {
                const supabase = createBrowserClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                );

                // Try 'lectures' table first, fall back to 'videos'
                let { data, error: dbError } = await supabase
                    .from('lectures')
                    .select('id, topic, title, video_url, description, transcript')
                    .eq('id', params.id as string)
                    .single();

                if (dbError || !data) {
                    const fallback = await supabase
                        .from('videos')
                        .select('id, topic, title, video_url, description, transcript')
                        .eq('id', params.id as string)
                        .single();
                    data = fallback.data;
                    dbError = fallback.error;
                }

                if (dbError || !data) {
                    setError('Video not found');
                    setLoading(false);
                    return;
                }

                setVideo({
                    id: data.id,
                    topic: data.topic || data.title || 'Untitled Video',
                    video_url: data.video_url,
                    transcript: data.transcript ?? [],
                });
            } catch (err) {
                console.error('Failed to fetch video:', err);
                setError('Failed to load video');
            } finally {
                setLoading(false);
            }
        }

        fetchVideo();
    }, [params.id]);

    if (loading) return <div className="h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;
    if (!video || error) return <div className="h-screen bg-gray-900 flex items-center justify-center text-white">{error || 'Video not found'}</div>;

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
                <div className={`flex-1 flex items-center justify-center bg-black ${isTranscriptOpen ? 'w-2/3' : 'w-full'}`}>
                    <CustomVideoPlayer
                        src={video.video_url}
                        showHindi={showHindi}
                        onTimeUpdate={setCurrentTime}
                        initialTime={0}
                    />
                </div>

                {/* Transcript Sidebar */}
                {isTranscriptOpen && video.transcript && video.transcript.length > 0 && (
                    <div className="w-1/3 border-l border-gray-800 overflow-y-auto bg-gray-950">
                        <TranscriptBar
                            transcript={video.transcript}
                            currentTime={currentTime}
                            showHindi={showHindi}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}