/**
 * Main Bookmarks & Review Page
 * 
 * Master Prompt v8.0 - Feature F14 (READ Mode)
 * - Dashboard for bookmarks and spaced repetition review
 * - Bilingual support (EN+HI)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Bookmark, RefreshCw, BookOpen, CheckCircle, AlertCircle, Loader2, Plus, Search, Filter } from 'lucide-react';
import { Flashcard } from '@/components/bookmarks/flashcard';

// Types for Bookmark data from API
interface SrsData {
    interval_days: number;
    ease_factor: number;
    next_review_date: string;
    repetitions: number;
}

interface BookmarkData {
    id: string;
    content: string;
    source_type: string;
    context_url?: string;
    front_content?: string;
    back_content?: string;
    srs_stats?: SrsData;
}

export default function BookmarksPage() {
    const [showHindi, setShowHindi] = useState(false);
    const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Review Session State
    const [reviewMode, setReviewMode] = useState(false);
    const [reviewQueue, setReviewQueue] = useState<BookmarkData[]>([]);
    const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
    const [reviewsCompleted, setReviewsCompleted] = useState(0);

    useEffect(() => {
        fetchBookmarks();
    }, []);

    const fetchBookmarks = async () => {
        setLoading(true);
        setError(null);
        try {
            // For now, we use dummy data or fetch from an endpoint if available
            // In a real app: fetch('/api/bookmarks' { credentials: 'include' })
            const mockData: BookmarkData[] = [
                {
                    id: '1',
                    content: 'Article 370 was repealed on August 5, 2019.',
                    source_type: 'CA',
                    front_content: 'When was Article 370 repealed?',
                    back_content: 'Article 370 was repealed on August 5, 2019 by the government.',
                    srs_stats: { interval_days: 0, ease_factor: 2.5, next_review_date: new Date().toISOString(), repetitions: 0 }
                },
                {
                    id: '2',
                    content: 'The concept of Fundamental Duties was borrowed from the Constitution of the USSR.',
                    source_type: 'POLITY',
                    front_content: 'From where was Fundamental Duties concept borrowed?',
                    back_content: 'The concept of Fundamental Duties was borrowed from the Constitution of the USSR.',
                    srs_stats: { interval_days: 0, ease_factor: 2.5, next_review_date: new Date().toISOString(), repetitions: 0 }
                },
                {
                    id: '3',
                    content: 'Lok Sabha is dissolved every 5 years unless dissolved earlier.',
                    source_type: 'POLITY',
                    front_content: 'How long is the term of Lok Sabha?',
                    back_content: 'The term is 5 years.',
                    srs_stats: { interval_days: 0, ease_factor: 2.5, next_review_date: new Date().toISOString(), repetitions: 0 }
                }
            ];
            setBookmarks(mockData);
        } catch (err) {
            setError('Failed to fetch bookmarks');
        } finally {
            setLoading(false);
        }
    };

    const startReview = () => {
        // Initialize review queue with due cards
        setReviewQueue(bookmarks.filter(b => b.srs_stats));
        setCurrentReviewIndex(0);
        setReviewsCompleted(0);
        setReviewMode(true);
    };

    const handleRate = async (quality: number) => {
        try {
            await fetch('/api/bookmarks/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookmarkId: reviewQueue[currentReviewIndex].id,
                    quality
                })
            });
            
            setReviewsCompleted(prev => prev + 1);
            setCurrentReviewIndex(prev => prev + 1);
        } catch (err) {
            console.error('Failed to rate card', err);
        }
    };

    // Completion Screen
    if (reviewMode && currentReviewIndex >= reviewQueue.length) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        {showHindi ? 'सत्र पूर्ण!' : 'Session Complete!'}
                    </h2>
                    <p className="text-gray-600 mb-8">
                        {showHindi 
                            ? `आपने ${reviewsCompleted} कार्ड की समीक्षा की।` 
                            : `You reviewed ${reviewsCompleted} cards.`}
                    </p>
                    <button
                        onClick={() => setReviewMode(false)}
                        className="px-8 py-3 bg-saffron-600 text-white font-bold rounded-lg hover:bg-saffron-700 transition-colors"
                    >
                        {showHindi ? 'वापस जाएं' : 'Back to Dashboard'}
                    </button>
                </div>
            </div>
        );
    }

    // Review Mode Active
    if (reviewMode) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Flashcard
                    bookmark={reviewQueue[currentReviewIndex]}
                    currentIndex={currentReviewIndex}
                    totalCount={reviewQueue.length}
                    showHindi={showHindi}
                    onRate={handleRate}
                />
            </div>
        );
    }

    // Dashboard View
    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {showHindi ? 'माई बुकमार्क्स' : 'My Bookmarks'}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {showHindi 
                            ? `आपके पास ${bookmarks.length} स्मरणियां हैं` 
                            : `You have ${bookmarks.length} flashcards saved`}
                    </p>
                </div>
                <button
                    onClick={() => setShowHindi(!showHindi)}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border rounded hover:bg-gray-50"
                >
                    {showHindi ? 'EN' : 'हिंदी'}
                </button>
            </header>

            {/* Main Stats & Review Call to Action */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Review Card */}
                <div className="bg-gradient-to-br from-saffron-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-lg font-medium opacity-90 mb-1">
                                {showHindi ? 'आज की समीक्षा' : 'Review Today'}
                            </h3>
                            <p className="text-4xl font-bold">{bookmarks.length}</p>
                            <p className="text-sm opacity-75 mt-2">
                                {showHindi ? 'रिव्यू के लिए तैयार हैं' : 'cards ready for review'}
                            </p>
                        </div>
                        <RefreshCw className="w-12 h-12 opacity-50" />
                    </div>
                    <button
                        onClick={startReview}
                        disabled={bookmarks.length === 0}
                        className="mt-6 w-full py-3 bg-white text-saffron-600 font-bold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        {showHindi ? 'अभी रिव्यू शुरू करें' : 'Start Review Now'}
                    </button>
                </div>
                {/* Add Bookmark Card */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                    <Plus className="w-12 h-12 text-saffron-600 mb-2" />
                    <h3 className="text-lg font-semibold text-gray-800">
                        {showHindi ? 'नया कार्ड बनाएं' : 'Create New Card'}
                    </h3>
                    <p className="text-gray-500 text-sm mb-4 text-center">
                        {showHindi ? 'नोट या पीडीएफ से स्मरणियां जोड़ें' : 'Add flashcard from notes or PDFs'}
                    </p>
                </div>
            </div>

            {/* Bookmarks List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">
                        {showHindi ? 'सभी स्मरणियां' : 'All Cards'}
                    </h3>
                    <div className="flex gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded">
                            <Filter className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>
                </div>
                
                <div className="divide-y divide-gray-100">
                    {loading ? (
                        <div className="p-8 text-center">
                            <Loader2 className="w-8 h-8 text-saffron-500 animate-spin mx-auto" />
                        </div>
                    ) : (
                        bookmarks.map((bookmark) => (
                            <div key={bookmark.id} className="p-4 hover:bg-gray-50 transition-colors group flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <BookOpen className="w-5 h-5 text-gray-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">
                                        {bookmark.front_content || bookmark.content.substring(0, 50) + '...'}
                                    </p>
                                    <span className="text-xs px-2 py-0.5 bg-gray-200 rounded-full text-gray-600 mt-1 inline-block">
                                        {bookmark.source_type}
                                    </span>
                                </div>
                                <span className={`text-xs font-medium whitespace-nowrap ${
                                    new Date(bookmark.srs_stats?.next_review_date || 0) <= new Date()
                                        ? 'text-green-600'
                                        : 'text-gray-400'
                                }`}>
                                    {new Date(bookmark.srs_stats?.next_review_date || 0) <= new Date()
                                        ? (showHindi ? 'दये' : 'Due')
                                        : (showHindi ? 'बाकी' : 'Scheduled')}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
