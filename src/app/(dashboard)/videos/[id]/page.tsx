'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Play, Download, Clock, Tag, Loader2, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';

interface LectureJob {
    id: string;
    topic: string;
    subject: string;
    status: 'pending' | 'processing' | 'ready' | 'failed' | 'cancelled';
    progress: number;
    progress_percent: number;
    current_chapter: number | null;
    total_chapters: number | null;
    duration: number | null;
    video_url: string | null;
    audio_url: string | null;
    notes_pdf_url: string | null;
    transcript: any;
    error_message: string | null;
    started_at: string | null;
    completed_at: string | null;
    created_at: string;
}

export default function VideoDetailPage() {
    const params = useParams();
    const videoId = params.id as string;

    const [video, setVideo] = useState<LectureJob | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        async function fetchVideo() {
            try {
                const response = await fetch(`/api/lectures/${videoId}/status`);
                if (!response.ok) throw new Error('Failed to fetch video');
                const data = await response.json();
                setVideo(data);

                // Stop polling if complete or failed
                if (data.status === 'ready' || data.status === 'failed' || data.status === 'cancelled') {
                    clearInterval(interval);
                }
            } catch (err) {
                setError('Failed to load video');
                console.error('Error fetching video:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchVideo();

        // Poll for updates if processing
        interval = setInterval(fetchVideo, 5000);

        return () => clearInterval(interval);
    }, [videoId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loading />
            </div>
        );
    }

    if (error || !video) {
        return (
            <Card className="glass-card">
                <CardContent className="p-12 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-500">{error || 'Video not found'}</p>
                    <Button variant="outline" asChild className="mt-4">
                        <Link href="/videos">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Videos
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/videos">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">{video.topic}</h1>
                    <div className="flex items-center gap-4 mt-1 text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Tag className="w-4 h-4" />
                            {video.subject}
                        </span>
                        {video.duration && (
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Video Player / Status */}
            <Card className="glass-card overflow-hidden">
                {video.status === 'ready' && video.video_url ? (
                    <div className="aspect-video bg-black">
                        <video
                            controls
                            className="w-full h-full"
                            poster={`/api/lectures/${videoId}/thumbnail`}
                        >
                            <source src={video.video_url} type="video/mp4" />
                            Your browser does not support video playback.
                        </video>
                    </div>
                ) : video.status === 'processing' || video.status === 'pending' ? (
                    <div className="aspect-video bg-gradient-to-br from-purple-900/50 to-blue-900/50 flex items-center justify-center">
                        <div className="text-center space-y-4">
                            <Loader2 className="w-16 h-16 animate-spin text-purple-400 mx-auto" />
                            <div>
                                <h3 className="text-xl font-semibold text-white">
                                    {video.status === 'pending' ? 'Queued for Generation' : 'Generating Your Video'}
                                </h3>
                                <p className="text-muted-foreground mt-2">
                                    {video.current_chapter && video.total_chapters
                                        ? `Processing chapter ${video.current_chapter} of ${video.total_chapters}`
                                        : 'This may take 5-15 minutes'}
                                </p>
                            </div>

                            {/* Progress Bar */}
                            <div className="max-w-xs mx-auto">
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                                        style={{ width: `${video.progress_percent || video.progress || 0}%` }}
                                    />
                                </div>
                                <p className="text-sm text-white/60 mt-2">
                                    {video.progress_percent || video.progress || 0}% complete
                                </p>
                            </div>
                        </div>
                    </div>
                ) : video.status === 'failed' ? (
                    <div className="aspect-video bg-red-900/20 flex items-center justify-center">
                        <div className="text-center space-y-4">
                            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
                            <div>
                                <h3 className="text-xl font-semibold text-red-500">Generation Failed</h3>
                                <p className="text-muted-foreground mt-2">
                                    {video.error_message || 'An error occurred during video generation'}
                                </p>
                            </div>
                            <Button variant="outline" asChild>
                                <Link href="/videos/new">
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Try Again
                                </Link>
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="aspect-video bg-gray-900/50 flex items-center justify-center">
                        <p className="text-muted-foreground">Video unavailable</p>
                    </div>
                )}
            </Card>

            {/* Actions */}
            {video.status === 'ready' && (
                <div className="flex flex-wrap gap-3">
                    {video.video_url && (
                        <Button variant="gradient" asChild>
                            <a href={video.video_url} download>
                                <Download className="w-4 h-4 mr-2" />
                                Download Video
                            </a>
                        </Button>
                    )}
                    {video.audio_url && (
                        <Button variant="outline" asChild>
                            <a href={video.audio_url} download>
                                <Download className="w-4 h-4 mr-2" />
                                Download Audio
                            </a>
                        </Button>
                    )}
                    {video.notes_pdf_url && (
                        <Button variant="outline" asChild>
                            <a href={video.notes_pdf_url} download>
                                <FileText className="w-4 h-4 mr-2" />
                                Download Notes PDF
                            </a>
                        </Button>
                    )}
                </div>
            )}

            {/* Transcript */}
            {video.transcript && video.status === 'ready' && (
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>📝 Transcript</CardTitle>
                        <CardDescription>Full text of the video narration</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="prose dark:prose-invert max-w-none">
                            {typeof video.transcript === 'string'
                                ? video.transcript
                                : JSON.stringify(video.transcript, null, 2)}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
