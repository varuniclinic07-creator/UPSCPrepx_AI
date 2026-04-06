'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Wand2, Loader2, Video, Clock, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const SUBJECTS = [
    { value: 'history', label: '📜 History', color: 'from-amber-500 to-orange-500' },
    { value: 'geography', label: '🌍 Geography', color: 'from-green-500 to-emerald-500' },
    { value: 'polity', label: '⚖️ Polity', color: 'from-blue-500 to-indigo-500' },
    { value: 'economy', label: '💰 Economy', color: 'from-yellow-500 to-amber-500' },
    { value: 'science', label: '🔬 Science & Tech', color: 'from-purple-500 to-pink-500' },
    { value: 'environment', label: '🌱 Environment', color: 'from-teal-500 to-green-500' },
    { value: 'ethics', label: '🧭 Ethics', color: 'from-rose-500 to-red-500' },
    { value: 'current-affairs', label: '📰 Current Affairs', color: 'from-cyan-500 to-blue-500' },
];

const DURATIONS = [
    { value: 5, label: '5 min', description: 'Quick overview' },
    { value: 10, label: '10 min', description: 'Standard explanation' },
    { value: 15, label: '15 min', description: 'Detailed coverage' },
    { value: 20, label: '20 min', description: 'Comprehensive' },
];

export default function NewVideoPage() {
    const router = useRouter();
    const [topic, setTopic] = useState('');
    const [subject, setSubject] = useState('');
    const [duration, setDuration] = useState(10);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!topic.trim() || !subject) {
            setError('Please enter a topic and select a subject');
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const response = await fetch('/api/lectures/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: topic.trim(),
                    subject,
                    duration,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to start video generation');
            }

            const data = await response.json();
            router.push(`/videos/${data.jobId}`);
        } catch (err: any) {
            setError(err.message);
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/videos">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        🎬 Generate Video Lesson
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Create an AI-powered video explanation
                    </p>
                </div>
            </div>

            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Video className="w-5 h-5 text-purple-500" />
                        Video Details
                    </CardTitle>
                    <CardDescription>
                        Enter the topic you want explained in video format
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Topic Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Topic *</label>
                        <Input
                            placeholder="e.g., Constitutional Amendments, Water Cycle, GDP Calculation..."
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="bg-background/50"
                        />
                        <p className="text-xs text-muted-foreground">
                            Be specific for better video quality
                        </p>
                    </div>

                    {/* Subject Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Subject *
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {SUBJECTS.map((s) => (
                                <button
                                    key={s.value}
                                    onClick={() => setSubject(s.value)}
                                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${subject === s.value
                                            ? `bg-gradient-to-r ${s.color} text-white border-transparent`
                                            : 'bg-background/50 hover:bg-background/80 border-border'
                                        }`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Duration Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Video Duration
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {DURATIONS.map((d) => (
                                <button
                                    key={d.value}
                                    onClick={() => setDuration(d.value)}
                                    className={`p-3 rounded-lg border text-center transition-all ${duration === d.value
                                            ? 'bg-purple-500 text-white border-transparent'
                                            : 'bg-background/50 hover:bg-background/80 border-border'
                                        }`}
                                >
                                    <div className="font-semibold">{d.label}</div>
                                    <div className="text-xs opacity-80">{d.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Generate Button */}
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || !topic.trim() || !subject}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Starting Generation...
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-4 h-4 mr-2" />
                                Generate Video Lesson
                            </>
                        )}
                    </Button>

                    {/* Info */}
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-2">
                            ℹ️ How it works
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• AI generates a comprehensive script for your topic</li>
                            <li>• Visual animations are created automatically</li>
                            <li>• Natural voice narration is added</li>
                            <li>• Video processing takes 5-15 minutes</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
