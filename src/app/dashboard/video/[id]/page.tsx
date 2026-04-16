/**
 * Video Player Page
 *
 * Master Prompt v8.0 - Feature F16 (WATCH Mode)
 * - Combines Video Player, Transcript, and Notes
 * - Bilingual support
 * - Tabbed panel (Notes | Q&A) below the player
 * - Related Content section via knowledge_edges
 */

'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, MessageSquare, Link2 } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

const CustomVideoPlayer = dynamic(() => import('@/components/video/custom-video-player').then(m => m.CustomVideoPlayer), { ssr: false });
const TranscriptBar = dynamic(() => import('@/components/video/transcript-bar').then(m => m.TranscriptBar), { ssr: false });
const VideoNotesPanel = dynamic(() => import('@/components/video/video-notes-panel').then(m => m.VideoNotesPanel), { ssr: false });
const VideoQueryPanel = dynamic(() => import('@/components/video/video-query-panel').then(m => m.VideoQueryPanel), { ssr: false });

interface VideoData {
    id: string;
    topic: string;
    video_url: string;
    node_id?: string;
    subject?: string;
    transcript?: { start: number; end: number; text: string }[];
}

interface RelatedItem {
    id: string;
    title: string;
    type: 'note' | 'mcq' | 'pyq';
    link: string;
}

type VideoTab = 'notes' | 'qa';

export default function VideoPlayerPage() {
    const params = useParams();
    const router = useRouter();
    const [showHindi, setShowHindi] = useState(false);
    const [video, setVideo] = useState<VideoData | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [isTranscriptOpen, setIsTranscriptOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<VideoTab>('notes');
    const [relatedContent, setRelatedContent] = useState<RelatedItem[]>([]);

    useEffect(() => {
        async function fetchVideo() {
            try {
                const supabase = createBrowserClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                );

                // Try 'lectures' table first, fall back to 'videos'
                let result: any = null;

                const { data: lectureData, error: lectureError } = await supabase
                    .from('lectures')
                    .select('id, topic, title, video_url, description, transcript, node_id, subject_slug')
                    .eq('id', params.id as string)
                    .single();

                if (!lectureError && lectureData) {
                    result = lectureData;
                } else {
                    const { data: videoData, error: videoError } = await supabase
                        .from('videos')
                        .select('id, topic, title, video_url, description, transcript, node_id, subject')
                        .eq('id', params.id as string)
                        .single();
                    if (!videoError && videoData) {
                        result = videoData;
                    }
                }

                if (!result) {
                    setError('Video not found');
                    setLoading(false);
                    return;
                }

                const videoData: VideoData = {
                    id: result.id,
                    topic: result.topic || result.title || 'Untitled Video',
                    video_url: result.video_url,
                    node_id: result.node_id ?? undefined,
                    subject: result.subject_slug ?? result.subject ?? undefined,
                    transcript: result.transcript ?? [],
                };

                setVideo(videoData);

                // Fetch related content via knowledge_edges if node_id exists
                if (videoData.node_id) {
                    const { data: edges } = await supabase
                        .from('knowledge_edges')
                        .select('target_node_id, target_topic, edge_type, knowledge_nodes!knowledge_edges_target_node_id_fkey(id, title, type)')
                        .eq('source_node_id', videoData.node_id)
                        .limit(12);

                    if (edges && edges.length > 0) {
                        const items: RelatedItem[] = edges
                            .filter((e: any) => e.knowledge_nodes)
                            .map((e: any) => {
                                const node = e.knowledge_nodes;
                                const nodeType = node.type || 'note';
                                let type: 'note' | 'mcq' | 'pyq' = 'note';
                                if (nodeType === 'mcq' || nodeType === 'quiz') type = 'mcq';
                                else if (nodeType === 'pyq') type = 'pyq';

                                let link = '/dashboard';
                                if (type === 'mcq') link = `/dashboard/mcq?node=${node.id}`;
                                else if (type === 'pyq') link = `/dashboard/pyq?node=${node.id}`;
                                else link = `/dashboard/notes/${node.id}`;

                                return {
                                    id: node.id,
                                    title: node.title || e.target_topic || 'Related Topic',
                                    type,
                                    link,
                                };
                            });
                        setRelatedContent(items);
                    }
                }
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

    const tabs: { key: VideoTab; label: string; icon: typeof FileText }[] = [
        { key: 'notes', label: 'Notes', icon: FileText },
        { key: 'qa', label: 'Q&A', icon: MessageSquare },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-gray-900 text-white">
            {/* Top Bar */}
            <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-950 shrink-0">
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

            {/* Main Content — Video + Transcript */}
            <div className="flex overflow-hidden" style={{ height: '56vh' }}>
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
                            segments={video.transcript}
                            currentTime={currentTime}
                            onSeek={setCurrentTime}
                            showHindi={showHindi}
                            isCollapsed={false}
                        />
                    </div>
                )}
            </div>

            {/* Tabbed Panel: Notes | Q&A */}
            <div className="border-t border-gray-800 bg-gray-950">
                <div className="flex border-b border-gray-800">
                    {tabs.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                                activeTab === key
                                    ? 'border-saffron-500 text-saffron-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            <Icon className="w-4 h-4" /> {label}
                        </button>
                    ))}
                </div>

                <div style={{ height: '240px' }}>
                    {activeTab === 'notes' && (
                        <VideoNotesPanel
                            videoId={video.id}
                            currentTime={currentTime}
                            topic={video.topic}
                        />
                    )}
                    {activeTab === 'qa' && (
                        <VideoQueryPanel
                            topic={video.topic}
                            subject={video.subject}
                            nodeId={video.node_id}
                        />
                    )}
                </div>
            </div>

            {/* Related Content Section */}
            {relatedContent.length > 0 && (
                <div className="border-t border-gray-800 bg-gray-950 px-4 py-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Link2 className="w-4 h-4 text-saffron-400" />
                        <h2 className="text-sm font-semibold text-white">Related Content</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {relatedContent.map((item) => (
                            <a
                                key={item.id}
                                href={item.link}
                                className="bg-gray-800 hover:bg-gray-700 rounded-lg p-3 transition-colors block"
                            >
                                <span className={`text-xs font-medium uppercase tracking-wide ${
                                    item.type === 'mcq' ? 'text-green-400'
                                    : item.type === 'pyq' ? 'text-purple-400'
                                    : 'text-blue-400'
                                }`}>
                                    {item.type === 'mcq' ? 'MCQ' : item.type === 'pyq' ? 'PYQ' : 'Notes'}
                                </span>
                                <p className="text-sm text-gray-200 mt-1 line-clamp-2">{item.title}</p>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}