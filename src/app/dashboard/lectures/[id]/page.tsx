'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, MessageSquare, Bookmark, FileText, Loader2 } from 'lucide-react';
import { VideoPlayer } from '@/components/lectures/video-player';
import { LectureNotesTab } from '@/components/lectures/lecture-notes-tab';
import { LectureQATab } from '@/components/lectures/lecture-qa-tab';
import { LectureBookmarksTab } from '@/components/lectures/lecture-bookmarks-tab';

interface LectureJob {
  id: string;
  topic: string;
  subject_slug: string;
  status: string;
  video_url: string;
  total_chapters: number;
}

interface Chapter {
  id: string;
  chapter_number: number;
  title: string;
  duration: number;
  content: any;
  image_urls: string[];
  audio_url: string;
}

type Tab = 'notes' | 'qa' | 'bookmarks';

export default function LecturePlayerPage() {
  const { id } = useParams<{ id: string }>();
  const [lecture, setLecture] = useState<LectureJob | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('notes');
  const [currentTime, setCurrentTime] = useState(0);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [resumePosition, setResumePosition] = useState(0);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/lectures/${id}/status`).then(r => r.json()),
      fetch(`/api/lectures/${id}/chapters`).then(r => r.json()),
      fetch(`/api/lectures/${id}/progress`).then(r => r.json()),
    ]).then(([jobData, chapData, progress]) => {
      setLecture(jobData);
      setChapters(chapData.chapters || []);
      setResumePosition(progress.position || 0);
      setCurrentChapter(progress.chapter || 1);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  // Debounced save progress
  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      fetch(`/api/lectures/${id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: Math.floor(time), chapter: currentChapter }),
      }).catch(() => {});
    }, 10000); // Save every 10s
  }, [id, currentChapter]);

  const seekTo = useCallback((time: number) => {
    // This will be handled by the VideoPlayer internally
    // For now, we track it for the tabs
    setCurrentTime(time);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-saffron-500 animate-spin" />
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 text-center">
        <p className="text-gray-500">Lecture not found.</p>
        <Link href="/dashboard/lectures" className="text-saffron-600 hover:underline mt-2 inline-block">
          Back to lectures
        </Link>
      </div>
    );
  }

  const videoChapters = chapters.map(ch => ({
    number: ch.chapter_number,
    title: ch.title,
    timestamp: (ch.chapter_number - 1) * (ch.duration || 10) * 60,
    duration: (ch.duration || 10) * 60,
  }));

  const tabs: { key: Tab; label: string; icon: typeof FileText }[] = [
    { key: 'notes', label: 'Notes', icon: FileText },
    { key: 'qa', label: 'Q&A', icon: MessageSquare },
    { key: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/lectures" className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="p-1.5 bg-saffron-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-saffron-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-gray-900 truncate">{lecture.topic}</h1>
              <p className="text-xs text-gray-500">{lecture.subject_slug} — {chapters.length} chapters</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Video Player */}
        {lecture.video_url ? (
          <VideoPlayer
            videoUrl={lecture.video_url}
            chapters={videoChapters}
            lectureTitle={lecture.topic}
            initialPosition={resumePosition}
            onTimeUpdate={handleTimeUpdate}
            onChapterChange={setCurrentChapter}
          />
        ) : (
          <div className="aspect-video bg-gray-200 rounded-xl flex items-center justify-center mb-6">
            <p className="text-gray-500">Video not yet available (Status: {lecture.status})</p>
          </div>
        )}

        {/* Classroom Features Tabs */}
        <div className="mt-6 bg-white rounded-xl border border-gray-200">
          <div className="flex border-b border-gray-200">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === key
                    ? 'border-saffron-500 text-saffron-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {activeTab === 'notes' && (
              <LectureNotesTab lectureId={id} currentTime={currentTime} onSeek={seekTo} />
            )}
            {activeTab === 'qa' && (
              <LectureQATab lectureTopic={lecture.topic} />
            )}
            {activeTab === 'bookmarks' && (
              <LectureBookmarksTab
                lectureId={id}
                currentTime={currentTime}
                currentChapter={currentChapter}
                onSeek={seekTo}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
