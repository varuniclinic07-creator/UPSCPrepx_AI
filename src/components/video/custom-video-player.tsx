/**
 * Custom Video Player Component
 * 
 * Master Prompt v8.0 - Feature F16 (WATCH Mode)
 * - Custom controls with speed, fullscreen, PiP
 * - Bilingual UI for tooltips
 */

'use client';

import React, { useRef, useState, useEffect } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Settings, Maximize, PictureInPicture, SkipBack, SkipForward } from 'lucide-react';

interface CustomVideoPlayerProps {
    src: string;
    thumbnail?: string;
    showHindi?: boolean;
    onTimeUpdate?: (time: number) => void;
    initialTime?: number;
}

export function CustomVideoPlayer({ src, thumbnail, showHindi = false, onTimeUpdate, initialTime = 0 }: CustomVideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(initialTime);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showControls, setShowControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [hlsError, setHlsError] = useState<string | null>(null);
    const [hlsRetryKey, setHlsRetryKey] = useState(0);

    // HLS.js support for .m3u8 streams
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !src) return;

        let hls: Hls | null = null;

        if (src.endsWith('.m3u8')) {
            if (Hls.isSupported()) {
                hls = new Hls();
                hls.loadSource(src);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    if (initialTime > 0) video.currentTime = initialTime;
                });
                hls.on(Hls.Events.ERROR, (_event, data) => {
                    if (data.fatal) {
                        console.error('Fatal HLS error:', data);
                        setHlsError('Video playback error. Please try again.');
                        hls?.destroy();
                    }
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // Safari native HLS
                video.src = src;
                if (initialTime > 0) video.currentTime = initialTime;
            }
        } else {
            // MP4 or other formats — default behavior
            video.src = src;
            if (initialTime > 0) video.currentTime = initialTime;
        }

        return () => {
            if (hls) {
                hls.destroy();
            }
        };
    }, [src, initialTime, hlsRetryKey]);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = playbackRate;
        }
    }, [playbackRate]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
                setIsPlaying(false);
            } else {
                videoRef.current.play().catch((err) => {
                    console.warn('Autoplay blocked or play failed:', err);
                    setIsPlaying(false);
                });
                setIsPlaying(true);
            }
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
            onTimeUpdate?.(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const seek = (time: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const changePlaybackRate = () => {
        const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
        const currentIndex = rates.indexOf(playbackRate);
        const nextRate = rates[(currentIndex + 1) % rates.length];
        setPlaybackRate(nextRate);
        if (videoRef.current) videoRef.current.playbackRate = nextRate;
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement && containerRef.current) {
            containerRef.current.requestFullscreen();
            setIsFullscreen(true);
        } else if (document.fullscreenElement) {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const formatTime = (seconds: number) => {
        if (!isFinite(seconds)) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div 
            ref={containerRef}
            className="relative group bg-black rounded-xl overflow-hidden shadow-lg aspect-video"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => isPlaying && setShowControls(false)}
        >
            <video
                ref={videoRef}
                className="w-full h-full object-contain cursor-pointer"
                onClick={togglePlay}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                poster={thumbnail}
            />

            {/* HLS Error Overlay */}
            {hlsError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
                    <div className="text-center text-white p-4">
                        <p className="text-lg font-semibold mb-2">Playback Error</p>
                        <p className="text-sm text-gray-300">{hlsError}</p>
                        <button
                            onClick={() => { setHlsError(null); setHlsRetryKey(k => k + 1); }}
                            className="mt-3 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-sm"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {/* Play/Pause Overlay (Center) */}
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                </div>
            )}

            {/* Controls Bar */}
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-gray-600 rounded-full mb-4 cursor-pointer group/progress hover:h-2.5 transition-all" onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    seek(duration * percent);
                }}>
                    <div className="h-full bg-saffron-500 rounded-full relative" style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover/progress:opacity-100 transition-opacity" />
                    </div>
                </div>

                <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                        <button onClick={togglePlay} className="hover:text-saffron-400 transition-colors">
                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </button>
                        <button onClick={() => seek(currentTime - 10)} className="hover:text-saffron-400 transition-colors">
                            <SkipBack className="w-4 h-4" />
                        </button>
                        <button onClick={() => seek(currentTime + 10)} className="hover:text-saffron-400 transition-colors">
                            <SkipForward className="w-4 h-4" />
                        </button>
                        
                        <div className="flex items-center gap-2 group/vol">
                            <button onClick={toggleMute} className="hover:text-saffron-400 transition-colors">
                                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            </button>
                            <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.1" 
                                value={isMuted ? 0 : volume} 
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setVolume(val);
                                    if (videoRef.current) {
                                        videoRef.current.volume = val;
                                        videoRef.current.muted = val === 0;
                                    }
                                    setIsMuted(val === 0);
                                }}
                                className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-300 accent-saffron-500 h-1 bg-gray-600 rounded-lg cursor-pointer"
                            />
                        </div>

                        <span className="text-xs font-medium text-gray-300">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={changePlaybackRate} className="text-xs font-bold hover:text-saffron-400 transition-colors w-8 text-center">
                            {playbackRate}x
                        </button>
                        <button onClick={() => {
                            if (document.pictureInPictureElement) document.exitPictureInPicture().catch(() => {});
                             else if (videoRef.current) videoRef.current.requestPictureInPicture().catch(() => {});
                        }} className="hover:text-saffron-400 transition-colors">
                            <PictureInPicture className="w-5 h-5" />
                        </button>
                        <button onClick={toggleFullscreen} className="hover:text-saffron-400 transition-colors">
                            {isFullscreen ? <Maximize className="w-5 h-5 rotate-180" /> : <Maximize className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}