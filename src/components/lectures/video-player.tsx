'use client';

// Video Player with Chapter Navigation
import { useState, useRef, useEffect } from 'react';

interface Chapter {
    number: number;
    title: string;
    timestamp: number; // seconds
    duration: number;
}

interface VideoPlayerProps {
    videoUrl: string;
    chapters: Chapter[];
    lectureTitle: string;
}

export function VideoPlayer({ videoUrl, chapters, lectureTitle }: VideoPlayerProps) {
    const [currentChapter, setCurrentChapter] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleChapterClick = (chapter: Chapter) => {
        if (videoRef.current) {
            videoRef.current.currentTime = chapter.timestamp;
            videoRef.current.play();
            setIsPlaying(true);
        }
    };

    const handleTimeUpdate = () => {
        if (!videoRef.current) return;

        const currentTime = videoRef.current.currentTime;

        // Update current chapter based on time
        const chapterIndex = chapters.findIndex((ch, idx) => {
            const nextChapter = chapters[idx + 1];
            return currentTime >= ch.timestamp &&
                (!nextChapter || currentTime < nextChapter.timestamp);
        });

        if (chapterIndex !== -1 && chapterIndex !== currentChapter) {
            setCurrentChapter(chapterIndex);
        }
    };

    return (
        <div className="grid lg:grid-cols-3 gap-6">
            {/* Video Player */}
            <div className="lg:col-span-2">
                <div className="bg-black rounded-lg overflow-hidden">
                    <video
                        ref={videoRef}
                        src={videoUrl}
                        controls
                        className="w-full"
                        onTimeUpdate={handleTimeUpdate}
                    >
                        Your browser does not support the video tag.
                    </video>
                </div>

                <div className="mt-4">
                    <h2 className="text-2xl font-bold">{lectureTitle}</h2>
                    <p className="text-gray-600">
                        Chapter {currentChapter + 1}/{chapters.length}: {chapters[currentChapter]?.title}
                    </p>
                </div>
            </div>

            {/* Chapters List */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-lg p-4">
                    <h3 className="font-bold text-lg mb-4">Chapters ({chapters.length})</h3>

                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {chapters.map((chapter, idx) => (
                            <button
                                key={chapter.number}
                                onClick={() => handleChapterClick(chapter)}
                                className={`w-full text-left p-3 rounded-lg transition ${idx === currentChapter
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-50 hover:bg-gray-100'
                                    }`}
                            >
                                <div className="font-semibold">
                                    {chapter.number}. {chapter.title}
                                </div>
                                <div className={`text-sm ${idx === currentChapter ? 'text-white/80' : 'text-gray-500'}`}>
                                    {Math.floor(chapter.duration / 60)} minutes
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
