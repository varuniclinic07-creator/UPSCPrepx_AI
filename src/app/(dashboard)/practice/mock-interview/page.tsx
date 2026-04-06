'use client';

import { useState } from 'react';
import { Mic, Video, ChevronLeft, ChevronRight, Sparkles, Brain, MessageSquare, Clock, Award, Play } from 'lucide-react';
import { ShimmerButton } from '@/components/magic-ui/shimmer-button';
import { StatCard } from '@/components/magic-ui/stat-card';

const questions = [
    "Tell us about yourself and why you want to join civil services.",
    "What are your views on the current state of Indian economy?",
    "How would you handle a situation where your orders conflict with community interests?",
    "What are the major challenges facing Indian agriculture today?",
    "Describe a situation where you showed leadership qualities.",
];

export default function MockInterviewPage() {
    const [started, setStarted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [responses, setResponses] = useState<string[]>([]);

    const progress = ((currentQuestion + 1) / questions.length) * 100;

    return (
        <div className="flex flex-col gap-8 animate-slide-down">
            {/* Header */}
            <header className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 self-start w-fit">
                    <Video className="w-3 h-3 text-rose-500" />
                    <span className="text-rose-500 text-xs font-bold uppercase tracking-wider">Personality Test</span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-light text-foreground leading-[1.1] tracking-tight">
                    Mock <span className="font-bold text-gradient">Interview</span>
                </h1>
                <p className="text-lg text-muted-foreground font-light max-w-xl">
                    Practice UPSC personality test with AI-powered feedback
                </p>
            </header>

            {!started ? (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard title="Interviews Done" value={5} icon={Video} glowColor="hsl(346, 77%, 49%)" />
                        <StatCard title="Avg Score" value="7.5/10" icon={Award} glowColor="hsl(142, 76%, 36%)" />
                        <StatCard title="Questions" value={45} icon={MessageSquare} glowColor="hsl(var(--primary))" />
                        <StatCard title="Practice Time" value="3h" icon={Clock} glowColor="hsl(var(--secondary))" />
                    </div>

                    {/* Start Card */}
                    <div className="bento-card p-8 lg:p-12 text-center max-w-2xl mx-auto w-full">
                        <div className="w-20 h-20 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-6">
                            <Brain className="w-10 h-10 text-rose-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-foreground mb-4">AI-Powered Mock Interview</h2>
                        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                            Practice answering common UPSC personality test questions. Get AI feedback on your responses, body language tips, and scoring.
                        </p>

                        {/* Features */}
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                                <MessageSquare className="w-5 h-5 text-primary mx-auto mb-2" />
                                <span className="text-sm text-foreground">{questions.length} Questions</span>
                            </div>
                            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                                <Clock className="w-5 h-5 text-secondary mx-auto mb-2" />
                                <span className="text-sm text-foreground">~20 mins</span>
                            </div>
                            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                                <Sparkles className="w-5 h-5 text-accent mx-auto mb-2" />
                                <span className="text-sm text-foreground">AI Feedback</span>
                            </div>
                        </div>

                        <ShimmerButton
                            onClick={() => setStarted(true)}
                            className="px-10 py-4 text-lg"
                            background="hsl(346, 77%, 49%)"
                        >
                            <Play className="w-5 h-5 mr-2" />
                            Start Interview
                        </ShimmerButton>
                    </div>
                </>
            ) : (
                <div className="max-w-3xl mx-auto w-full">
                    {/* Progress */}
                    <div className="mb-6">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Question {currentQuestion + 1} of {questions.length}</span>
                            <span className="text-foreground font-medium">{Math.round(progress)}% Complete</span>
                        </div>
                        <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Question Card */}
                    <div className="bento-card p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 font-bold">
                                {currentQuestion + 1}
                            </div>
                            <div className="flex-1">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Interview Question</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mic className="w-5 h-5 text-green-500" />
                                <span className="text-xs text-green-500 font-medium">Recording</span>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-foreground mb-6 leading-relaxed">
                            {questions[currentQuestion]}
                        </h3>

                        <textarea
                            placeholder="Type your answer here... (or use voice input)"
                            className="w-full min-h-[200px] p-5 bg-muted/30 border border-border/50 rounded-2xl resize-none text-foreground placeholder:text-muted-foreground focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                            value={responses[currentQuestion] || ''}
                            onChange={(e) => {
                                const newResponses = [...responses];
                                newResponses[currentQuestion] = e.target.value;
                                setResponses(newResponses);
                            }}
                        />

                        {/* Navigation */}
                        <div className="flex items-center justify-between mt-6 pt-6 border-t border-border/30">
                            <button
                                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                                disabled={currentQuestion === 0}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border/50 text-foreground hover:border-primary/30 hover:bg-muted/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                            </button>

                            {currentQuestion === questions.length - 1 ? (
                                <ShimmerButton className="px-8 py-3" background="hsl(142, 76%, 36%)">
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Submit Interview
                                </ShimmerButton>
                            ) : (
                                <ShimmerButton
                                    onClick={() => setCurrentQuestion(currentQuestion + 1)}
                                    className="px-8 py-3"
                                    background="hsl(346, 77%, 49%)"
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </ShimmerButton>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
