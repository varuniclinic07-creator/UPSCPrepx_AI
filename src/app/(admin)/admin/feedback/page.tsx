'use client';

import Link from 'next/link';
import { ArrowLeft, Star, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';

const mockFeedback = [
    { id: 1, user: 'Rahul K.', rating: 5, category: 'Notes', message: 'The simplified language feature is amazing for Hindi-medium students!', date: '2024-01-15' },
    { id: 2, user: 'Priya S.', rating: 4, category: 'Quiz', message: 'MCQ difficulty levels are well balanced. Need more PYQ analysis.', date: '2024-01-14' },
    { id: 3, user: 'Amit V.', rating: 3, category: 'Video', message: 'Video player works well but HLS streams sometimes buffer.', date: '2024-01-13' },
    { id: 4, user: 'Sneha R.', rating: 5, category: 'Mentor', message: 'AI mentor gives very relevant UPSC-specific guidance.', date: '2024-01-12' },
    { id: 5, user: 'Deepak M.', rating: 2, category: 'Bug', message: 'Mind maps page crashes on mobile when topic has many subtopics.', date: '2024-01-11' },
];

export default function AdminFeedbackPage() {
    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/admin" className="p-2 rounded-lg hover:bg-muted"><ArrowLeft className="w-5 h-5" /></Link>
                <h1 className="text-2xl font-bold">User Feedback</h1>
                <span className="ml-auto text-sm text-muted-foreground">{mockFeedback.length} submissions</span>
            </div>
            <div className="space-y-4">
                {mockFeedback.map(fb => (
                    <div key={fb.id} className="rounded-xl border bg-card p-5 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="font-medium">{fb.user}</span>
                                <span className="px-2 py-0.5 rounded-full bg-muted text-xs">{fb.category}</span>
                                <div className="flex">{Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className={`w-4 h-4 ${i < fb.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted'}`} />
                                ))}</div>
                            </div>
                            <span className="text-xs text-muted-foreground">{fb.date}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{fb.message}</p>
                        <div className="flex gap-2 pt-1">
                            <button className="text-xs px-3 py-1 rounded-lg border hover:bg-muted flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> Acknowledge</button>
                            <button className="text-xs px-3 py-1 rounded-lg border hover:bg-muted flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Reply</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
