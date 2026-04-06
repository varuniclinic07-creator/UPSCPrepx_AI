'use client';

// Audio Player Component
import { useState, useRef } from 'react';

export function AudioPlayer({ audioUrl, title }: { audioUrl: string; title: string }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) audioRef.current.pause();
            else audioRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <audio ref={audioRef} src={audioUrl} onTimeUpdate={handleTimeUpdate} onEnded={() => setIsPlaying(false)} />
            <h3 className="font-bold mb-4">{title}</h3>
            <div className="flex items-center gap-4">
                <button onClick={togglePlay} className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center">
                    {isPlaying ? '⏸️' : '▶️'}
                </button>
                <div className="flex-1 h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-primary rounded-full" style={{ width: `${progress}%` }} />
                </div>
            </div>
        </div>
    );
}
