'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Play, Clock, Tag, Video, Loader2, ArrowRight, Sparkles, Zap } from 'lucide-react';
import { BentoGrid } from '@/components/magic-ui/bento-grid';
import { StatCard } from '@/components/magic-ui/stat-card';
import { Loading } from '@/components/ui/loading';

interface LectureJob {
    id: string;
    topic: string;
    subject: string;
    status: 'pending' | 'processing' | 'ready' | 'failed' | 'cancelled';
    progress: number;
    duration: number | null;
    video_url: string | null;
    created_at: string;
}

function VideoCard({ video }: { video: LectureJob }) {
    const statusConfig = {
        pending: { color: 'amber', label: 'Queued', icon: Clock },
        processing: { color: 'blue', label: 'Generating...', icon: Loader2 },
        ready: { color: 'green', label: 'Ready', icon: Play },
        failed: { color: 'red', label: 'Failed', icon: Zap },
        cancelled: { color: 'gray', label: 'Cancelled', icon: Zap },
    };

    const config = statusConfig[video.status];
    const StatusIcon = config.icon;

    return (
        <Link href={`/videos/${video.id}`}>
            <div className="group relative flex flex-col p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.05] transition-all duration-500 overflow-hidden cursor-pointer h-full">
                {/* Glow */}
                <div className="absolute -right-12 -top-12 w-24 h-24 bg-violet-500/10 rounded-full blur-[50px] group-hover:bg-violet-500/20 transition-all duration-500" />

                {/* Video Thumbnail */}
                <div className="relative aspect-video bg-gradient-to-br from-violet-500/10 via-blue-500/10 to-orange-500/10 rounded-2xl mb-4 flex items-center justify-center overflow-hidden border border-white/[0.05]">
                    {video.status === 'processing' ? (
                        <div className="text-center">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-400 mx-auto mb-2" />
                            <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                                    style={{ width: `${video.progress}%` }}
                                />
                            </div>
                            <span className="text-xs text-white/40 mt-1">{video.progress}%</span>
                        </div>
                    ) : video.status === 'ready' ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Play className="w-7 h-7 text-violet-500 ml-1" />
                            </div>
                        </div>
                    ) : (
                        <Video className="w-12 h-12 text-white/10" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 z-10">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                            {video.topic}
                        </h3>
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-${config.color}-500/10 text-${config.color}-400 shrink-0`}>
                            <StatusIcon className={`w-3 h-3 ${video.status === 'processing' ? 'animate-spin' : ''}`} />
                            {config.label}
                        </span>
                    </div>
                    <span className="badge badge-primary">{video.subject}</span>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-white/[0.05] flex justify-between items-center z-10">
                    <span className="text-xs text-white/40 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(video.created_at).toLocaleDateString()}
                    </span>
                    {video.duration && (
                        <span className="text-xs text-white/40">
                            {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

function VideosList() {
    const [videos, setVideos] = useState<LectureJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchVideos() {
            try {
                const response = await fetch('/api/lectures');
                if (!response.ok) throw new Error('Failed to fetch videos');
                const data = await response.json();
                setVideos(data.lectures || []);
            } catch (err) {
                setError('Failed to load videos');
                console.error('Error fetching videos:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchVideos();
    }, []);

    if (loading) {
        return <VideosLoading />;
    }

    if (error) {
        return (
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.05] p-12 text-center">
                <p className="text-red-400">{error}</p>
            </div>
        );
    }

    if (videos.length === 0) {
        return (
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.05] text-center p-12">
                <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
                    <Video className="w-8 h-8 text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No videos yet</h3>
                <p className="text-white/40 mb-6 max-w-sm mx-auto">
                    Generate your first AI-powered video lecture to visualize complex UPSC topics
                </p>
                <Link href="/dashboard/videos/new" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-white/90 hover:scale-105 active:scale-95 transition-all">
                    <Sparkles className="w-4 h-4" />
                    Generate Video
                </Link>
            </div>
        );
    }

    return (
        <BentoGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
            ))}
        </BentoGrid>
    );
}

function VideosStats() {
    const stats = {
        total: 12,
        ready: 8,
        processing: 2,
        totalMinutes: 245,
    };

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                title="Total Videos"
                value={stats.total}
                icon={Video}
                glowColor="rgba(139,92,246,0.15)"
            />
            <StatCard
                title="Ready to Watch"
                value={stats.ready}
                icon={Play}
                glowColor="rgba(34,197,94,0.15)"
            />
            <StatCard
                title="Processing"
                value={stats.processing}
                icon={Loader2}
                glowColor="rgba(59,130,246,0.15)"
            />
            <StatCard
                title="Watch Time"
                value={`${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`}
                icon={Clock}
                glowColor="rgba(249,115,22,0.15)"
            />
        </div>
    );
}

export default function VideosPage() {
    return (
        <div className="flex flex-col gap-8 animate-slide-down">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="flex flex-col gap-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 self-start w-fit">
                        <Video className="w-3 h-3 text-violet-400" />
                        <span className="text-violet-400 text-xs font-bold uppercase tracking-wider">AI Video Generator</span>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-light text-white leading-[1.1] tracking-tight">
                        Video <span className="font-bold text-gradient">Lessons</span>
                    </h1>
                    <p className="text-lg text-white/40 font-light max-w-xl">
                        AI-generated animated explanations for complex UPSC topics
                    </p>
                </div>
                <Link href="/dashboard/videos/new" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 hover:scale-105 active:scale-95 transition-all">
                    <Plus className="w-4 h-4" />
                    Generate Video
                </Link>
            </header>

            {/* Stats */}
            <VideosStats />

            {/* Videos List */}
            <section className="flex flex-col gap-6">
                <div className="flex items-end justify-between px-1">
                    <h2 className="text-2xl font-medium text-white tracking-tight">Your Videos</h2>
                    <Link
                        href="/dashboard/videos/all"
                        className="text-sm text-blue-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                        View all <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <Suspense fallback={<VideosLoading />}>
                    <VideosList />
                </Suspense>
            </section>
        </div>
    );
}

function VideosLoading() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.05] h-72 shimmer" />
            ))}
        </div>
    );
}
