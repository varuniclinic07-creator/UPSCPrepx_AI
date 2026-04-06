'use client';

import { useState, useEffect } from 'react';
import { Scale, Search, BookOpen, Sparkles, ArrowRight, TrendingUp } from 'lucide-react';
import { ShimmerButton } from '@/components/magic-ui/shimmer-button';
import type { ConstitutionalArticle } from '@/lib/legal/constitution-data';

export default function LegalExplainerPage() {
    const [articles, setArticles] = useState<ConstitutionalArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedArticle, setSelectedArticle] = useState<ConstitutionalArticle | null>(null);
    const [explanation, setExplanation] = useState<any>(null);
    const [explaining, setExplaining] = useState(false);

    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async () => {
        try {
            const res = await fetch('/api/legal/articles?relevance=high');
            const data = await res.json();
            setArticles(data.articles || []);
        } catch (error) {
            console.error('Failed to fetch articles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExplain = async (article: ConstitutionalArticle) => {
        setSelectedArticle(article);
        setExplaining(true);

        try {
            const res = await fetch('/api/legal/explain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ articleId: article.id })
            });

            const data = await res.json();
            setExplanation(data);
        } catch (error) {
            console.error('Failed to get explanation:', error);
        } finally {
            setExplaining(false);
        }
    };

    const filteredArticles = searchQuery
        ? articles.filter(art =>
            art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            art.articleNumber.includes(searchQuery) ||
            art.keywords.some(kw => kw.includes(searchQuery.toLowerCase()))
        )
        : articles;

    return (
        <div className="flex flex-col gap-8 animate-slide-down">
            {/* Header */}
            <header className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 self-start w-fit">
                    <Scale className="w-3 h-3 text-purple-500" />
                    <span className="text-purple-500 text-xs font-bold uppercase tracking-wider">Legal & Constitutional</span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-light text-foreground leading-[1.1] tracking-tight">
                    Constitution <span className="font-bold text-gradient">Explainer</span>
                </h1>
                <p className="text-lg text-muted-foreground font-light max-w-xl">
                    AI-powered explanations of Indian Constitution articles
                </p>
            </header>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search articles by number, title, or keyword..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 bg-card/40 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
            </div>

            {/* Articles Grid */}
            {loading ? (
                <div className="text-center text-muted-foreground">Loading articles...</div>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {filteredArticles.map((article) => (
                        <div
                            key={article.id}
                            className="group p-6 rounded-2xl bg-card/40 border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all cursor-pointer"
                            onClick={() => handleExplain(article)}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                        <BookOpen className="w-5 h-5 text-purple-500" />
                                    </div>
                                    <div>
                                        <span className="text-sm text-muted-foreground">Article</span>
                                        <h3 className="text-xl font-bold text-foreground">{article.articleNumber}</h3>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {[...Array(article.upscRelevance >= 8 ? 3 : article.upscRelevance >= 6 ? 2 : 1)].map((_, i) => (
                                        <TrendingUp key={i} className="w-3 h-3 text-amber-500" />
                                    ))}
                                </div>
                            </div>

                            <h4 className="text-lg font-semibold text-foreground mb-2">{article.title}</h4>
                            <p className="text-sm text-muted-foreground mb-4">{article.description}</p>

                            <div className="flex items-center justify-between">
                                <div className="flex gap-2 flex-wrap">
                                    {article.keywords.slice(0, 3).map(kw => (
                                        <span key={kw} className="px-2 py-1 bg-muted/30 rounded text-xs text-muted-foreground">
                                            {kw}
                                        </span>
                                    ))}
                                </div>
                                <button className="text-primary font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                                    Explain
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Explanation Modal */}
            {(explaining || explanation) && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
                        {explaining ? (
                            <div className="flex flex-col items-center gap-4 py-12">
                                <Sparkles className="w-12 h-12 text-primary animate-pulse" />
                                <p className="text-lg text-foreground">Generating explanation...</p>
                            </div>
                        ) : explanation && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground mb-2">
                                        Article {explanation.article.articleNumber}: {explanation.article.title}
                                    </h2>
                                    <p className="text-muted-foreground">{explanation.article.description}</p>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-foreground mb-2">Explanation</h3>
                                    <p className="text-foreground leading-relaxed">{explanation.explanation}</p>
                                </div>

                                {explanation.keyPoints?.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold text-foreground mb-2">Key Points</h3>
                                        <ul className="space-y-2">
                                            {explanation.keyPoints.map((point: string, i: number) => (
                                                <li key={i} className="flex gap-2">
                                                    <span className="text-primary">•</span>
                                                    <span className="text-foreground">{point}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {explanation.upscTips?.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold text-foreground mb-2">UPSC Exam Tips</h3>
                                        <ul className="space-y-2">
                                            {explanation.upscTips.map((tip: string, i: number) => (
                                                <li key={i} className="flex gap-2">
                                                    <TrendingUp className="w-4 h-4 text-amber-500 flex-shrink-0 mt-1" />
                                                    <span className="text-foreground">{tip}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <button
                                    onClick={() => { setExplanation(null); setSelectedArticle(null); }}
                                    className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
