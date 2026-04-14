'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, PictureInPicture2,
} from 'lucide-react';

interface Chapter {
  number: number;
  title: string;
  timestamp: number;
  duration: number;
}

interface VideoPlayerProps {
  videoUrl: string;
  chapters: Chapter[];
  lectureTitle: string;
  initialPosition?: number;
  onTimeUpdate?: (time: number) => void;
  onChapterChange?: (chapter: number) => void;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function VideoPlayer({
  videoUrl, chapters, lectureTitle, initialPosition = 0,
  onTimeUpdate, onChapterChange,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChapters, setShowChapters] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Resume from last position
  useEffect(() => {
    if (videoRef.current && initialPosition > 0) {
      videoRef.current.currentTime = initialPosition;
    }
  }, [initialPosition]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    setCurrentTime(t);
    onTimeUpdate?.(t);

    // Update chapter
    const idx = chapters.findIndex((ch, i) => {
      const next = chapters[i + 1];
      return t >= ch.timestamp && (!next || t < next.timestamp);
    });
    if (idx >= 0 && idx !== currentChapter) {
      setCurrentChapter(idx);
      onChapterChange?.(chapters[idx].number);
    }
  }, [chapters, currentChapter, onTimeUpdate, onChapterChange]);

  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      if (!isPlaying) { videoRef.current.play(); setIsPlaying(true); }
    }
  }, [isPlaying]);

  const skip = useCallback((delta: number) => {
    if (videoRef.current) videoRef.current.currentTime += delta;
  }, []);

  const cycleSpeed = useCallback(() => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
  }, [speed]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const togglePiP = useCallback(async () => {
    if (!videoRef.current) return;
    if (document.pictureInPictureElement) await document.exitPictureInPicture();
    else await videoRef.current.requestPictureInPicture();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case ' ': e.preventDefault(); togglePlay(); break;
        case 'ArrowLeft': skip(-10); break;
        case 'ArrowRight': skip(10); break;
        case 'ArrowUp': e.preventDefault(); setVolume(v => { const n = Math.min(v + 0.1, 1); if (videoRef.current) videoRef.current.volume = n; return n; }); break;
        case 'ArrowDown': e.preventDefault(); setVolume(v => { const n = Math.max(v - 0.1, 0); if (videoRef.current) videoRef.current.volume = n; return n; }); break;
        case 'f': toggleFullscreen(); break;
        case 'm': setMuted(m => { if (videoRef.current) videoRef.current.muted = !m; return !m; }); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePlay, skip, toggleFullscreen]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div ref={containerRef} className="flex flex-col lg:flex-row gap-4">
      {/* Video + Controls */}
      <div className="flex-1">
        <div className="relative bg-black rounded-xl overflow-hidden group">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full aspect-video"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={() => { if (videoRef.current) setDuration(videoRef.current.duration); }}
            onEnded={() => setIsPlaying(false)}
            onClick={togglePlay}
          />

          {/* Controls overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Progress bar */}
            <div
              className="w-full h-1.5 bg-white/30 rounded-full mb-3 cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                seekTo(pct * duration);
              }}
            >
              <div className="h-full bg-saffron-500 rounded-full" style={{ width: `${progress}%` }} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => skip(-10)} className="text-white p-1 hover:bg-white/20 rounded">
                  <SkipBack className="w-4 h-4" />
                </button>
                <button onClick={togglePlay} className="text-white p-1 hover:bg-white/20 rounded">
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button onClick={() => skip(10)} className="text-white p-1 hover:bg-white/20 rounded">
                  <SkipForward className="w-4 h-4" />
                </button>
                <button onClick={() => { setMuted(!muted); if (videoRef.current) videoRef.current.muted = !muted; }}
                  className="text-white p-1 hover:bg-white/20 rounded">
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <span className="text-white text-xs">{formatTime(currentTime)} / {formatTime(duration)}</span>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={cycleSpeed} className="text-white text-xs font-mono px-2 py-0.5 bg-white/20 rounded hover:bg-white/30">
                  {speed}x
                </button>
                <button onClick={togglePiP} className="text-white p-1 hover:bg-white/20 rounded">
                  <PictureInPicture2 className="w-4 h-4" />
                </button>
                <button onClick={toggleFullscreen} className="text-white p-1 hover:bg-white/20 rounded">
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chapter sidebar */}
      {showChapters && chapters.length > 0 && (
        <div className="lg:w-72 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-sm text-gray-900">Chapters ({chapters.length})</h3>
          </div>
          <div className="overflow-y-auto max-h-96">
            {chapters.map((ch, idx) => (
              <button
                key={ch.number}
                onClick={() => seekTo(ch.timestamp)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-0 transition ${
                  idx === currentChapter
                    ? 'bg-saffron-50 border-l-2 border-l-saffron-500'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono ${idx === currentChapter ? 'text-saffron-600' : 'text-gray-400'}`}>
                    {ch.number}
                  </span>
                  <span className={`text-sm ${idx === currentChapter ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                    {ch.title}
                  </span>
                </div>
                <span className="text-xs text-gray-400 ml-6">{formatTime(ch.timestamp)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
