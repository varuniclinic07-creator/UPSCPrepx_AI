'use client';

import { useState, useEffect } from 'react';
import { Newspaper, Sparkles, Calendar } from 'lucide-react';
import { ShimmerButton } from '@/components/magic-ui/shimmer-button';

export default function DigestPage() {
    const [generating, setGenerating] = useState(false);
    const [digest, setDigest] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/digest/generate');
            const data = await res.json();
            setHistory(data.history || []);
        } catch (error) {
            console.error('Failed to fetch history:', error);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const res = await fetch('/api/digest/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const data = await res.json();
            setDigest(data.digest);
            fetchHistory();
        } catch (error) {
            console.error('Failed to generate digest:', error);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="flex flex-col gap-8">
            <header>
                <h1 className="text-4xl font-bold">News <span className="text-gradient">Digest</span></h1>
                <p className="text-muted-foreground">Your personalized daily current affairs summary</p>
            </header>

            <ShimmerButton onClick={handleGenerate} disabled={generating} className="w-fit">
                <Sparkles className="w-5 h-5 mr-2" />
                {generating ? 'Generating...' : 'Generate Today\'s Digest'}
            </ShimmerButton>

            {digest && (
                <div className="bento-card p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">{digest.date}</h2>
                        <Newspaper className="w-6 h-6 text-primary" />
                    </div>

                    <p className="text-foreground leading-relaxed">{digest.summary}</p>

                    <div className="space-y-4">
                        {digest.topics?.map((topic: any, i: number) => (
                            <div key={i} className="p-4 bg-muted/20 rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="badge badge-primary">{topic.category}</span>
                                </div>
                                <h3 className="font-bold text-lg mb-2">{topic.headline}</h3>
                                <p className="text-sm text-foreground mb-2">{topic.summary}</p>
                                <p className="text-xs text-muted-foreground italic">UPSC Relevance: {topic.upscRelevance}</p>
                            </div>
                        ))}
                    </div>

                    {digest.practiceQuestions && digest.practiceQuestions.length > 0 && (
                        <div className="p-4 bg-primary/10 rounded-xl">
                            <h3 className="font-bold mb-3">Practice Questions</h3>
                            <ol className="space-y-2">
                                {digest.practiceQuestions.map((q: string, i: number) => (
                                    <li key={i} className="text-sm">{i + 1}. {q}</li>
                                ))}
                            </ol>
                        </div>
                    )}
                </div>
            )}

            {history.length > 0 && (
                <div className="bento-card p-6">
                    <h3 className="font-bold mb-4">Previous Digests</h3>
                    <div className="space-y-2">
                        {history.map(h => (
                            <button
                                key={h.id}
                                onClick={() => setDigest(h)}
                                className="w-full p-3 text-left bg-muted/20 rounded-lg hover:bg-muted/30 transition-all"
                            >
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span className="font-medium">{h.date}</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{h.topics?.length || 0} topics</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
