'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Play, Clock, Tag, Video, Loader2, ArrowRight, Sparkles, Zap } from 'lucide-react';
import { BentoGrid } from '@/components/magic-ui/bento-grid';
import { ShimmerButton } from '@/components/magic-ui/shimmer-button';
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
        processing: { color: 'primary', label: 'Generating...', icon: Loader2 },
        ready: { color: 'green', label: 'Ready', icon: Play },
        failed: { color: 'red', label: 'Failed', icon: Zap },
        cancelled: { color: 'gray', label: 'Cancelled', icon: Zap },
    };

    const config = statusConfig[video.status];
    const StatusIcon = config.icon;

    return (
        <Link href={`/videos/${video.id}`}>
            <div className="group relative flex flex-col p-6 rounded-3xl bg-card/40 border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all duration-500 overflow-hidden cursor-pointer h-full">
                {/* Glow */}
                <div className="absolute -right-12 -top-12 w-24 h-24 bg-accent/20 rounded-full blur-[50px] group-hover:bg-accent/30 transition-all duration-500" />

                {/* Video Thumbnail */}
                <div className="relative aspect-video bg-gradient-to-br from-accent/10 via-primary/10 to-secondary/10 rounded-2xl mb-4 flex items-center justify-center overflow-hidden border border-border/30">
                    {video.status === 'processing' ? (
                        <div className="text-center">
                            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-2" />
                            <div className="w-24 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                                    style={{ width: `${video.progress}%` }}
                                />
                            </div>
                            <span className="text-xs text-muted-foreground mt-1">{video.progress}%</span>
                        </div>
                    ) : video.status === 'ready' ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Play className="w-7 h-7 text-accent ml-1" />
                            </div>
                        </div>
                    ) : (
                        <Video className="w-12 h-12 text-muted-foreground/30" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 z-10">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                            {video.topic}
                        </h3>
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-${config.color}-500/10 text-${config.color}-500 shrink-0`}>
                            <StatusIcon className={`w-3 h-3 ${video.status === 'processing' ? 'animate-spin' : ''}`} />
                            {config.label}
                        </span>
                    </div>
                    <span className="badge badge-primary">{video.subject}</span>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-border/30 flex justify-between items-center z-10">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(video.created_at).toLocaleDateString()}
                    </span>
                    {video.duration && (
                        <span className="text-xs text-muted-foreground">
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
            <div className="bento-card p-12 text-center">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    if (videos.length === 0) {
        return (
            <div className="bento-card text-center p-12">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <Video className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No videos yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    Generate your first AI-powered video lecture to visualize complex UPSC topics
                </p>
                <Link href="/dashboard/videos/new">
                    <ShimmerButton className="px-6 py-3">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Video
                    </ShimmerButton>
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
                glowColor="hsl(var(--accent))"
            />
            <StatCard
                title="Ready to Watch"
                value={stats.ready}
                icon={Play}
                glowColor="hsl(142, 76%, 36%)"
            />
            <StatCard
                title="Processing"
                value={stats.processing}
                icon={Loader2}
                glowColor="hsl(var(--primary))"
            />
            <StatCard
                title="Watch Time"
                value={`${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`}
                icon={Clock}
                glowColor="hsl(var(--secondary))"
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
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 self-start w-fit">
                        <Video className="w-3 h-3 text-accent" />
                        <span className="text-accent text-xs font-bold uppercase tracking-wider">AI Video Generator</span>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-light text-foreground leading-[1.1] tracking-tight">
                        Video <span className="font-bold text-gradient">Lessons</span>
                    </h1>
                    <p className="text-lg text-muted-foreground font-light max-w-xl">
                        AI-generated animated explanations for complex UPSC topics
                    </p>
                </div>
                <Link href="/dashboard/videos/new">
                    <ShimmerButton className="px-6 py-3 text-sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Generate Video
                    </ShimmerButton>
                </Link>
            </header>

            {/* Stats */}
            <VideosStats />

            {/* Videos List */}
            <section className="flex flex-col gap-6">
                <div className="flex items-end justify-between px-1">
                    <h2 className="text-2xl font-medium text-foreground tracking-tight">Your Videos</h2>
                    <Link
                        href="/dashboard/videos/all"
                        className="text-sm text-primary hover:text-foreground transition-colors flex items-center gap-1"
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
                <div key={i} className="bento-card h-72 shimmer" />
            ))}
        </div>
    );
}
