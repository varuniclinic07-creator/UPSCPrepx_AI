/**
 * Community Forum Main Page
 * 
 * Master Prompt v8.0 - F19 Community Features
 * - List all threads with tags, search & filters
 * - Create New Thread
 * - Bilingual support
 */

'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Search, Filter, Hash, TrendingUp, Pin } from 'lucide-react';

interface Thread {
    id: string;
    title: string;
    tags: string[];
    author: string;
    replies: number;
    upvotes: number;
    created_at: string;
    is_pinned: boolean;
}

export default function CommunityPage() {
    const [showHindi, setShowHindi] = useState(false);
    const [threads, setThreads] = useState<Thread[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock Data for Demo
        setThreads([
            { id: 't1', title: '📌 Welcome to UPSC AI Community!', tags: ['Announcement', 'Rules'], author: 'Admin', replies: 45, upvotes: 120, created_at: '2026-01-01', is_pinned: true },
            { id: 't2', title: 'Best strategy for Ancient History?', tags: ['Polity', 'Strategy'], author: 'Rahul_99', replies: 12, upvotes: 5, created_at: '2026-04-06', is_pinned: false },
            { id: 't3', title: 'Video Generation: Manim vs Remotion?', tags: ['Tech', 'Video'], author: 'Dev_01', replies: 8, upvotes: 15, created_at: '2026-04-05', is_pinned: false },
            { id: 't4', title: 'Daily CA: 5th April Discussion', tags: ['Current Affairs'], author: 'IAS_Hopeful', replies: 34, upvotes: 28, created_at: '2026-04-05', is_pinned: false },
        ]);
        setLoading(false);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            {/* Header */}
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <MessageSquare className="w-7 h-7 text-saffron-600" />
                        {showHindi ? 'समुदाय फोरम' : 'Community Forum'}
                    </h1>
                    <p className="text-gray-500">Connect, Discuss, and Learn together</p>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 text-sm font-medium text-gray-600 bg-white border rounded hover:bg-gray-50">
                        {showHindi ? 'हिंदी' : 'EN'}
                    </button>
                    <button className="px-4 py-2 bg-saffron-600 hover:bg-saffron-700 text-white font-bold rounded-lg shadow-md flex items-center gap-2 transition-all">
                        <Plus className="w-4 h-4" /> {showHindi ? 'नया थ्रेड' : 'New Thread'}
                    </button>
                </div>
            </div>

            {/* Thread List */}
            <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <div className="w-1/2 px-4">Topic</div>
                    <div className="flex gap-4">
                        <div className="w-16 text-center">Replies</div>
                        <div className="w-16 text-center">Upvotes</div>
                    </div>
                </div>

                <div className="divide-y divide-gray-100">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading...</div>
                    ) : (
                        threads.map(thread => (
                            <div key={thread.id} className="p-4 flex hover:bg-gray-50 transition-colors group cursor-pointer">
                                <div className="w-1/2 px-4 flex items-start gap-3">
                                    {thread.is_pinned && <Pin className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />}
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-saffron-600 transition-colors">
                                            {thread.title}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                            <span className="font-medium text-saffron-700">{thread.author}</span>
                                            <span>•</span>
                                            <span>{thread.created_at}</span>
                                            {thread.tags.map(tag => (
                                                <span key={tag} className="flex items-center gap-0.5 bg-gray-100 px-1.5 rounded">
                                                    <Hash className="w-3 h-3" /> {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-16 text-center">
                                        <div className="font-bold text-gray-900 text-sm">{thread.replies}</div>
                                    </div>
                                    <div className="w-16 text-center">
                                        <div className="font-bold text-saffron-600 text-sm flex items-center justify-center gap-1">
                                            <TrendingUp className="w-3 h-3" /> {thread.upvotes}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}