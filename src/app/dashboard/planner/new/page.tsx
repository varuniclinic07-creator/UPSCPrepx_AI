'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Wand2, Loader2, Calendar, Clock, BookOpen, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const SUBJECTS = [
    { id: 'history', name: 'History', icon: '📜' },
    { id: 'geography', name: 'Geography', icon: '🌍' },
    { id: 'polity', name: 'Polity', icon: '⚖️' },
    { id: 'economy', name: 'Economy', icon: '💰' },
    { id: 'science', name: 'Science & Tech', icon: '🔬' },
    { id: 'environment', name: 'Environment', icon: '🌱' },
    { id: 'ethics', name: 'Ethics', icon: '🧭' },
    { id: 'csat', name: 'CSAT', icon: '🧮' },
    { id: 'essay', name: 'Essay Writing', icon: '✍️' },
    { id: 'current-affairs', name: 'Current Affairs', icon: '📰' },
];

export default function NewPlannerPage() {
    const router = useRouter();
    const [planName, setPlanName] = useState('');
    const [examDate, setExamDate] = useState('');
    const [dailyHours, setDailyHours] = useState(6);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toggleSubject = (subjectId: string) => {
        setSelectedSubjects(prev =>
            prev.includes(subjectId)
                ? prev.filter(s => s !== subjectId)
                : [...prev, subjectId]
        );
    };

    const handleGenerate = async () => {
        if (!planName.trim()) {
            setError('Please enter a plan name');
            return;
        }
        if (selectedSubjects.length === 0) {
            setError('Please select at least one subject');
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const response = await fetch('/api/planner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: planName.trim(),
                    exam_date: examDate || null,
                    daily_hours: dailyHours,
                    subjects: selectedSubjects,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create plan');
            }

            const data = await response.json();
            router.push(`/planner/${data.id}`);
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
                    <Link href="/dashboard/planner">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                        📅 Create Study Plan
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        AI will generate a personalized schedule
                    </p>
                </div>
            </div>

            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-green-500" />
                        Plan Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Plan Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Plan Name *</label>
                        <Input
                            placeholder="e.g., Prelims 2025 Preparation"
                            value={planName}
                            onChange={(e) => setPlanName(e.target.value)}
                            className="bg-background/50"
                        />
                    </div>

                    {/* Exam Date */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Target Exam Date (Optional)
                        </label>
                        <Input
                            type="date"
                            value={examDate}
                            onChange={(e) => setExamDate(e.target.value)}
                            className="bg-background/50"
                        />
                    </div>

                    {/* Daily Hours */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Daily Study Hours: {dailyHours}h
                        </label>
                        <input
                            type="range"
                            min="2"
                            max="12"
                            value={dailyHours}
                            onChange={(e) => setDailyHours(Number(e.target.value))}
                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-green-500"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>2 hours</span>
                            <span>12 hours</span>
                        </div>
                    </div>

                    {/* Subject Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Select Subjects *
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {SUBJECTS.map((subject) => (
                                <button
                                    key={subject.id}
                                    onClick={() => toggleSubject(subject.id)}
                                    className={`p-3 rounded-lg border text-left transition-all ${selectedSubjects.includes(subject.id)
                                            ? 'bg-green-500 text-white border-transparent'
                                            : 'bg-background/50 hover:bg-background/80 border-border'
                                        }`}
                                >
                                    <span className="text-lg mr-2">{subject.icon}</span>
                                    <span className="text-sm font-medium">{subject.name}</span>
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Selected: {selectedSubjects.length} subjects
                        </p>
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
                        disabled={isGenerating}
                        className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating Your Plan...
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-4 h-4 mr-2" />
                                Generate AI Study Plan
                            </>
                        )}
                    </Button>

                    {/* Info */}
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                        <h4 className="font-medium text-green-600 dark:text-green-400 mb-2">
                            🤖 AI-Powered Planning
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Creates optimal study schedule based on your time</li>
                            <li>• Balances subjects according to UPSC weightage</li>
                            <li>• Includes revision cycles using spaced repetition</li>
                            <li>• Adjusts daily tasks based on your progress</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
