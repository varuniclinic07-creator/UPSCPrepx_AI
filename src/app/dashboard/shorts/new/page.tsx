'use client';

import { useState } from 'react';
import { Video, Sparkles, Clock, Zap } from 'lucide-react';
import { ShimmerButton } from '@/components/magic-ui/shimmer-button';

const subjects = ['Polity', 'History', 'Geography', 'Economy', 'Environment', 'Current Affairs'];
const styles = [
    { value: 'explanatory', label: 'Explanatory', icon: '📚' },
    { value: 'facts', label: 'Quick Facts', icon: '⚡' },
    { value: 'quiz', label: 'Quiz Style', icon: '❓' }
];

export default function ShortsNewPage() {
    const [topic, setTopic] = useState('');
    const [subject, setSubject] = useState('Polity');
    const [style, setStyle] = useState('explanatory');
    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleGenerate = async () => {
        setGenerating(true);

        try {
            const res = await fetch('/api/shorts/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, subject, style })
            });

            const data = await res.json();
            setResult(data.short);
        } catch (error) {
            console.error('Failed to generate short:', error);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 animate-slide-down">
            <header className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 self-start w-fit">
                    <Video className="w-3 h-3 text-rose-500" />
                    <span className="text-rose-500 text-xs font-bold uppercase tracking-wider">60-Second Shorts</span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-light text-foreground leading-[1.1] tracking-tight">
                    Create <span className="font-bold text-gradient">Video Shorts</span>
                </h1>
                <p className="text-lg text-muted-foreground font-light max-w-xl">
                    Generate bite-sized educational videos perfect for quick revision
                </p>
            </header>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Form */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Topic</label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g., Fundamental Rights"
                            className="w-full h-12 px-4 bg-card/40 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Subject</label>
                        <select
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full h-12 px-4 bg-card/40 border border-border/50 rounded-xl text-foreground cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        >
                            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Style</label>
                        <div className="grid grid-cols-3 gap-2">
                            {styles.map(st => (
                                <button
                                    key={st.value}
                                    onClick={() => setStyle(st.value)}
                                    className={`p-3 rounded-xl border transition-all ${style === st.value
                                            ? 'bg-primary/10 border-primary text-primary'
                                            : 'bg-card/40 border-border/50 text-foreground hover:border-primary/30'
                                        }`}
                                >
                                    <div className="text-2xl mb-1">{st.icon}</div>
                                    <div className="text-xs font-medium">{st.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <ShimmerButton
                        onClick={handleGenerate}
                        disabled={!topic || generating}
                        className="w-full h-12"
                    >
                        {generating ? (
                            <>
                                <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Zap className="w-5 h-5 mr-2" />
                                Generate Short
                            </>
                        )}
                    </ShimmerButton>
                </div>

                {/* Preview */}
                <div className="bento-card p-6">
                    <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-rose-500" />
                        Preview
                    </h3>

                    {result ? (
                        <div className="space-y-4">
                            <div className="aspect-video bg-muted/30 rounded-xl flex items-center justify-center">
                                <Video className="w-16 h-16 text-muted-foreground/50" />
                            </div>
                            <div className="p-4 bg-muted/20 rounded-xl">
                                <p className="text-sm text-foreground leading-relaxed">{result.script}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Duration: ~{result.estimatedDuration}s • Status: {result.status}
                            </p>
                        </div>
                    ) : (
                        <div className="aspect-video bg-muted/10 rounded-xl flex flex-col items-center justify-center text-muted-foreground">
                            <Video className="w-12 h-12 mb-2" />
                            <p className="text-sm">Your short will appear here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
