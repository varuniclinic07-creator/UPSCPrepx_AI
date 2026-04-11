/**
 * AI Video Generation Dashboard
 * 
 * Master Prompt v8.0 - Feature F15 (WATCH Mode)
 * - Request new videos via AI
 * - View History & Status
 * - Bilingual Support
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Video, Plus, Calendar, Clock, CheckCircle, Loader2, AlertCircle, PlayCircle } from 'lucide-react';

interface VideoRequest {
    id: string;
    topic: string;
    subject: string;
    status: 'PENDING' | 'GENERATING' | 'RENDERING' | 'DONE' | 'FAILED';
    created_at: string;
    video_url?: string;
}

export default function VideoGenerationPage() {
    const [showHindi, setShowHindi] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [videos, setVideos] = useState<VideoRequest[]>([]);
    const [topic, setTopic] = useState('');
    const [subject, setSubject] = useState('General');

    useEffect(() => {
        fetchVideos();
    }, []);

    const fetchVideos = async () => {
        setRefreshing(true);
        try {
            // In production: fetch('/api/video/history')
            // Mock Data for demo
            const mockData: VideoRequest[] = [
                { id: '1', topic: 'Fundamental Rights', subject: 'Polity', status: 'DONE', created_at: '2026-04-05T10:00:00Z', video_url: '#' },
                { id: '2', topic: 'Monsoon Mechanism', subject: 'Geography', status: 'RENDERING', created_at: '2026-04-06T14:00:00Z' },
                { id: '3', topic: 'GDP Calculation', subject: 'Economy', status: 'GENERATING', created_at: '2026-04-07T08:00:00Z' },
            ];
            setVideos(mockData);
        } catch (err) {
            console.error(err);
        } finally {
            setRefreshing(false);
        }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic) return;

        setLoading(true);
        try {
            await fetch('/api/video/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, subject })
            });
            setTopic('');
            fetchVideos();
        } catch (err) {
            console.error('Generation Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'DONE': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'FAILED': return <AlertCircle className="w-4 h-4 text-red-500" />;
            default: return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Video className="w-6 h-6 text-saffron-600" />
                        {showHindi ? 'AI वीडियो लेक्चर' : 'AI Video Lectures'}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {showHindi 
                            ? 'किसी भी टॉपिक से 2 मिनट में वीडियो बनाएं' 
                            : 'Generate videos from any topic in 2 minutes'}
                    </p>
                </div>
                <button
                    onClick={() => setShowHindi(!showHindi)}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border rounded hover:bg-gray-50"
                >
                    {showHindi ? 'EN' : 'हिंदी'}
                </button>
            </header>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column: Request Form */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">
                            {showHindi ? 'नया वीडियो बनाएं' : 'Create New Video'}
                        </h2>
                        <form onSubmit={handleGenerate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {showHindi ? 'विषय (Topic)' : 'Topic'}
                                </label>
                                <input 
                                    type="text" 
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder={showHindi ? 'e.g. Article 356' : 'e.g. Article 356'}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-saffron-500 focus:border-saffron-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {showHindi ? 'वर्ग (Subject)' : 'Subject'}
                                </label>
                                <select 
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-saffron-500 focus:border-saffron-500"
                                >
                                    <option value="Polity">Polity</option>
                                    <option value="History">History</option>
                                    <option value="Geography">Geography</option>
                                    <option value="Economy">Economy</option>
                                    <option value="Science">Science</option>
                                    <option value="Current Affairs">Current Affairs</option>
                                </select>
                            </div>
                            <button 
                                type="submit"
                                disabled={loading || !topic}
                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-saffron-600 text-white font-bold rounded-lg hover:bg-saffron-700 disabled:opacity-50 transition-colors"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                {showHindi ? 'वीडियो जनरेट करें' : 'Generate Video'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Column: Video Library */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-800">
                                {showHindi ? 'आपकी वीडियो लाइब्रेरी' : 'Your Video Library'}
                            </h3>
                            <button 
                                onClick={fetchVideos}
                                className="p-2 hover:bg-gray-100 rounded transition-colors"
                                disabled={refreshing}
                            >
                                <Video className={`w-4 h-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                        
                        <div className="divide-y divide-gray-100">
                            {videos.map((video) => (
                                <div key={video.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden relative">
                                            {video.status === 'DONE' ? (
                                                <div className="w-full h-full bg-saffron-100 flex items-center justify-center">
                                                    <PlayCircle className="w-6 h-6 text-saffron-600" />
                                                </div>
                                            ) : (
                                                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{video.topic}</p>
                                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                                <span>{video.subject}</span>
                                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                <span>{new Date(video.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${
                                            video.status === 'DONE' ? 'bg-green-50 text-green-700 border-green-200' :
                                            video.status === 'FAILED' ? 'bg-red-50 text-red-700 border-red-200' :
                                            'bg-blue-50 text-blue-700 border-blue-200'
                                        }`}>
                                            {getStatusIcon(video.status)}
                                            {video.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            
                            {videos.length === 0 && (
                                <div className="p-8 text-center text-gray-500">
                                    {showHindi ? 'कोई वीडियो नहीं मिला' : 'No videos generated yet'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
