'use client';

import { useState } from 'react';
import { PenTool, Clock, Target, CheckCircle2, Send, FileText, Brain, Sparkles } from 'lucide-react';
import { ShimmerButton } from '@/components/magic-ui/shimmer-button';
import { StatCard } from '@/components/magic-ui/stat-card';
import { BentoGrid } from '@/components/magic-ui/bento-grid';

const questions = [
    { id: 1, paper: 'GS-1', topic: 'History', question: 'Examine the role of Mahatma Gandhi in the Indian freedom struggle.', marks: 15 },
    { id: 2, paper: 'GS-2', topic: 'Polity', question: 'Discuss the role of judiciary in protecting fundamental rights.', marks: 15 },
    { id: 3, paper: 'GS-3', topic: 'Economy', question: 'Analyze the impact of digital economy on traditional businesses.', marks: 15 },
    { id: 4, paper: 'GS-4', topic: 'Ethics', question: 'What do you understand by the term "ethical governance"?', marks: 10 },
];

const paperColors: Record<string, string> = {
    'GS-1': 'primary',
    'GS-2': 'secondary',
    'GS-3': 'accent',
    'GS-4': 'amber',
};

export default function AnswerWritingPage() {
    const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
    const [answer, setAnswer] = useState('');
    const [isEvaluating, setIsEvaluating] = useState(false);

    const wordCount = answer.trim().split(/\s+/).filter(w => w).length;
    const selectedQ = questions.find(q => q.id === selectedQuestion);
    const targetWords = selectedQ?.marks === 15 ? { min: 150, max: 200 } : { min: 100, max: 150 };
    const isInRange = wordCount >= targetWords.min && wordCount <= targetWords.max;

    const handleSubmit = async () => {
        if (!selectedQuestion || wordCount < targetWords.min) return;
        setIsEvaluating(true);
        // Simulate API call
        setTimeout(() => setIsEvaluating(false), 2000);
    };

    return (
        <div className="flex flex-col gap-8 animate-slide-down">
            {/* Header */}
            <header className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 self-start w-fit">
                    <PenTool className="w-3 h-3 text-blue-500" />
                    <span className="text-blue-500 text-xs font-bold uppercase tracking-wider">Mains Practice</span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-light text-foreground leading-[1.1] tracking-tight">
                    Answer <span className="font-bold text-gradient">Writing</span>
                </h1>
                <p className="text-lg text-muted-foreground font-light max-w-xl">
                    Practice UPSC Mains answers with AI-powered evaluation
                </p>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Answers Written" value={24} icon={FileText} glowColor="hsl(var(--primary))" />
                <StatCard title="Avg Score" value="7.2/10" icon={Target} glowColor="hsl(142, 76%, 36%)" />
                <StatCard title="Best Paper" value="GS-2" icon={CheckCircle2} glowColor="hsl(var(--secondary))" />
                <StatCard title="Practice Time" value="12h" icon={Clock} glowColor="hsl(var(--accent))" />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Questions */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-medium text-foreground">Select a Question</h3>
                    <div className="space-y-3">
                        {questions.map(q => (
                            <button
                                key={q.id}
                                onClick={() => { setSelectedQuestion(q.id); setAnswer(''); }}
                                className={`w-full text-left p-5 rounded-2xl border transition-all ${selectedQuestion === q.id
                                        ? `bg-${paperColors[q.paper]}/10 border-${paperColors[q.paper]}/30 shadow-lg`
                                        : 'bg-card/40 border-border/50 hover:border-primary/30 hover:bg-card/80'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`badge badge-${paperColors[q.paper]}`}>{q.paper}</span>
                                    <span className="text-xs text-muted-foreground">{q.marks} marks</span>
                                </div>
                                <p className={`font-medium ${selectedQuestion === q.id ? 'text-foreground' : 'text-foreground/80'}`}>
                                    {q.question}
                                </p>
                                <span className="text-xs text-muted-foreground mt-2 block">{q.topic}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Answer Area */}
                <div className="bento-card p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                            <Brain className="w-5 h-5 text-primary" />
                            Your Answer
                        </h3>
                        {selectedQ && (
                            <span className="text-sm text-muted-foreground">
                                Target: {targetWords.min}-{targetWords.max} words
                            </span>
                        )}
                    </div>

                    <textarea
                        placeholder={selectedQuestion ? "Write your answer here..." : "Select a question to start writing..."}
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        className="flex-1 min-h-[300px] w-full p-4 bg-muted/30 border border-border/50 rounded-2xl resize-none text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        disabled={!selectedQuestion}
                    />

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                        <div className="flex items-center gap-3">
                            <span className={`text-lg font-bold ${!selectedQuestion ? 'text-muted-foreground' :
                                    isInRange ? 'text-green-500' :
                                        wordCount > targetWords.max ? 'text-red-500' : 'text-amber-500'
                                }`}>
                                {wordCount} words
                            </span>
                            {selectedQuestion && (
                                <div className="w-32 h-2 bg-muted/50 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all ${isInRange ? 'bg-green-500' : 'bg-amber-500'}`}
                                        style={{ width: `${Math.min((wordCount / targetWords.max) * 100, 100)}%` }}
                                    />
                                </div>
                            )}
                        </div>

                        <ShimmerButton
                            onClick={handleSubmit}
                            disabled={!selectedQuestion || wordCount < targetWords.min}
                            isLoading={isEvaluating}
                            className="px-6 py-3"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Get AI Evaluation
                        </ShimmerButton>
                    </div>
                </div>
            </div>
        </div>
    );
}
