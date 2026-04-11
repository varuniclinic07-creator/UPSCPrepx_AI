'use client';

import { useState } from 'react';
import { FileEdit, Clock, Target, CheckCircle2, Sparkles, BookOpen, ArrowRight, Lightbulb } from 'lucide-react';
import { ShimmerButton } from '@/components/magic-ui/shimmer-button';
import { StatCard } from '@/components/magic-ui/stat-card';
import { BorderBeamInput } from '@/components/magic-ui/border-beam';
import { Input } from '@/components/ui/input';

const suggestedTopics = [
    { topic: "Science and Technology is a double-edged sword", category: "Science" },
    { topic: "Women empowerment and economic development", category: "Social" },
    { topic: "Ethics in governance: Challenges and solutions", category: "Ethics" },
    { topic: "Democracy is not just about elections", category: "Polity" },
    { topic: "Climate change: A threat to humanity", category: "Environment" },
];

export default function EssayPage() {
    const [topic, setTopic] = useState('');
    const [essay, setEssay] = useState('');
    const [isEvaluating, setIsEvaluating] = useState(false);

    const wordCount = essay.trim().split(/\s+/).filter(w => w).length;
    const targetMin = 1000;
    const targetMax = 1200;
    const isInRange = wordCount >= targetMin && wordCount <= targetMax;

    const handleSubmit = async () => {
        if (wordCount < targetMin) return;
        setIsEvaluating(true);
        setTimeout(() => setIsEvaluating(false), 2000);
    };

    return (
        <div className="flex flex-col gap-8 animate-slide-down">
            {/* Header */}
            <header className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 self-start w-fit">
                    <FileEdit className="w-3 h-3 text-violet-500" />
                    <span className="text-violet-500 text-xs font-bold uppercase tracking-wider">Essay Practice</span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-light text-foreground leading-[1.1] tracking-tight">
                    Essay <span className="font-bold text-gradient">Writing</span>
                </h1>
                <p className="text-lg text-muted-foreground font-light max-w-xl">
                    Master UPSC essay writing with AI-powered feedback and evaluation
                </p>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Essays Written" value={8} icon={FileEdit} glowColor="hsl(263, 70%, 50%)" />
                <StatCard title="Avg Score" value="6.8/10" icon={Target} glowColor="hsl(142, 76%, 36%)" />
                <StatCard title="Best Topic" value="Polity" icon={CheckCircle2} glowColor="hsl(var(--primary))" />
                <StatCard title="Avg Time" value="45min" icon={Clock} glowColor="hsl(var(--secondary))" />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Essay Editor */}
                <div className="lg:col-span-2 bento-card p-6 flex flex-col">
                    {/* Topic Input */}
                    <div className="mb-6">
                        <label className="text-sm font-medium text-foreground mb-2 block">Essay Topic</label>
                        <BorderBeamInput className="w-full" active={topic.length > 0}>
                            <Input
                                placeholder="Enter your essay topic..."
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                className="h-14 bg-muted/30 border-border/50 rounded-xl text-lg font-medium"
                            />
                        </BorderBeamInput>
                    </div>

                    {/* Essay Textarea */}
                    <div className="flex-1 flex flex-col">
                        <label className="text-sm font-medium text-foreground mb-2 flex items-center justify-between">
                            <span>Your Essay</span>
                            <span className="text-muted-foreground font-normal">Target: {targetMin}-{targetMax} words</span>
                        </label>
                        <textarea
                            placeholder="Start writing your essay here... Structure it with an introduction, body paragraphs, and conclusion."
                            value={essay}
                            onChange={(e) => setEssay(e.target.value)}
                            className="flex-1 min-h-[400px] w-full p-5 bg-muted/30 border border-border/50 rounded-2xl resize-none text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all leading-relaxed"
                        />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                        <div className="flex items-center gap-4">
                            <span className={`text-xl font-bold ${isInRange ? 'text-green-500' :
                                    wordCount > targetMax ? 'text-red-500' : 'text-amber-500'
                                }`}>
                                {wordCount} words
                            </span>
                            <div className="w-40 h-2.5 bg-muted/50 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all ${isInRange ? 'bg-green-500' : 'bg-amber-500'}`}
                                    style={{ width: `${Math.min((wordCount / targetMax) * 100, 100)}%` }}
                                />
                            </div>
                        </div>

                        <ShimmerButton
                            onClick={handleSubmit}
                            disabled={wordCount < targetMin || !topic}
                            isLoading={isEvaluating}
                            className="px-6 py-3"
                            background="hsl(263, 70%, 50%)"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Get AI Evaluation
                        </ShimmerButton>
                    </div>
                </div>

                {/* Suggested Topics */}
                <div className="bento-card p-6">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                        <Lightbulb className="w-5 h-5 text-amber-500" />
                        Suggested Topics
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                        Previous year and trending UPSC essay topics
                    </p>

                    <div className="space-y-3">
                        {suggestedTopics.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => setTopic(item.topic)}
                                className="w-full text-left p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-all group"
                            >
                                <span className="text-xs text-primary font-bold uppercase tracking-wider mb-1 block">
                                    {item.category}
                                </span>
                                <p className="text-foreground font-medium group-hover:text-primary transition-colors">
                                    {item.topic}
                                </p>
                                <ArrowRight className="w-4 h-4 mt-2 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </button>
                        ))}
                    </div>

                    {/* Tips */}
                    <div className="mt-6 p-4 rounded-xl bg-violet-500/5 border border-violet-500/10">
                        <h4 className="font-medium text-foreground text-sm mb-2">💡 Essay Tips</h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                            <li>• Structure: Intro → Body (3-4 paras) → Conclusion</li>
                            <li>• Use examples, quotes, and data</li>
                            <li>• Balance multiple perspectives</li>
                            <li>• Time limit: 1 hour per essay</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
