'use client';

import { useState, useEffect } from 'react';
import { Newspaper, Calendar, ExternalLink, Star, BookOpen, Clock, Filter, ChevronDown } from 'lucide-react';
import { ShimmerButton } from '@/components/magic-ui/shimmer-button';
import { StatCard } from '@/components/magic-ui/stat-card';
import { Input } from '@/components/ui/input';

interface Article {
    id: string;
    title: string;
    source: string;
    date: string;
    summary: string;
    url: string;
    category: string;
}

const sources = [
    { name: 'The Hindu', logo: '🗞️', color: 'primary' },
    { name: 'Indian Express', logo: '📰', color: 'secondary' },
    { name: 'Drishti IAS', logo: '📚', color: 'accent' },
];

export default function NewspapersPage() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedSource, setSelectedSource] = useState('all');
    const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchArticles();
    }, [selectedDate, selectedSource]);

    const fetchArticles = async () => {
        const mockArticles: Article[] = [
            {
                id: '1',
                title: 'Budget 2024: Key Highlights for UPSC',
                source: 'The Hindu',
                date: selectedDate,
                summary: 'Finance Minister presents Union Budget with focus on infrastructure, employment, and green energy initiatives...',
                url: '#',
                category: 'Economy'
            },
            {
                id: '2',
                title: 'Supreme Court Verdict on Electoral Bonds',
                source: 'Indian Express',
                date: selectedDate,
                summary: 'Historic judgment on transparency in political funding...',
                url: '#',
                category: 'Polity'
            },
            {
                id: '3',
                title: 'Climate Change and India\'s Coastal Regions',
                source: 'Drishti IAS',
                date: selectedDate,
                summary: 'Analysis of rising sea levels and impact on coastal communities...',
                url: '#',
                category: 'Environment'
            },
        ];
        setArticles(mockArticles.filter(
            a => selectedSource === 'all' || a.source === selectedSource
        ));
    };

    const toggleBookmark = (id: string) => {
        setBookmarked(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <div className="flex flex-col gap-8 animate-slide-down">
            {/* Header */}
            <header className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 self-start w-fit">
                    <Newspaper className="w-3 h-3 text-orange-500" />
                    <span className="text-orange-500 text-xs font-bold uppercase tracking-wider">Daily News</span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-light text-foreground leading-[1.1] tracking-tight">
                    Newspaper <span className="font-bold text-gradient">Reader</span>
                </h1>
                <p className="text-lg text-muted-foreground font-light max-w-xl">
                    Curated UPSC-relevant news from top newspapers
                </p>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Today's Articles" value={articles.length} icon={Newspaper} glowColor="hsl(25, 95%, 53%)" />
                <StatCard title="Bookmarked" value={bookmarked.size} icon={Star} glowColor="hsl(var(--accent))" />
                <StatCard title="Sources" value={sources.length} icon={BookOpen} glowColor="hsl(var(--primary))" />
                <StatCard title="Avg Read Time" value="5 min" icon={Clock} glowColor="hsl(var(--secondary))" />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
                {/* Date Picker */}
                <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="pl-12 h-12 bg-card/40 border-border/50 rounded-xl"
                    />
                </div>

                {/* Source Selector */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setSelectedSource('all')}
                        className={`px-5 py-3 rounded-xl font-medium transition-all ${selectedSource === 'all'
                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                : 'bg-card/40 border border-border/50 text-foreground hover:border-orange-500/30'
                            }`}
                    >
                        All Sources
                    </button>
                    {sources.map(s => (
                        <button
                            key={s.name}
                            onClick={() => setSelectedSource(s.name)}
                            className={`px-5 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${selectedSource === s.name
                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                    : 'bg-card/40 border border-border/50 text-foreground hover:border-orange-500/30'
                                }`}
                        >
                            <span>{s.logo}</span>
                            <span className="hidden md:inline">{s.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Articles */}
            {articles.length === 0 ? (
                <div className="bento-card text-center p-12">
                    <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                        <Newspaper className="w-8 h-8 text-orange-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No articles found</h3>
                    <p className="text-muted-foreground">Try selecting a different date or source</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {articles.map(article => {
                        const source = sources.find(s => s.name === article.source);

                        return (
                            <div
                                key={article.id}
                                className="group p-6 rounded-2xl bg-card/40 border border-border/50 hover:border-orange-500/30 hover:bg-card/80 transition-all"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Source Logo */}
                                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-2xl shrink-0">
                                        {source?.logo || '📰'}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <h3 className="text-xl font-bold text-foreground group-hover:text-orange-500 transition-colors">
                                                {article.title}
                                            </h3>
                                            <button
                                                onClick={() => toggleBookmark(article.id)}
                                                className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${bookmarked.has(article.id)
                                                        ? 'bg-amber-500 text-white'
                                                        : 'bg-muted/50 text-muted-foreground hover:text-amber-500'
                                                    }`}
                                            >
                                                <Star className={`w-5 h-5 ${bookmarked.has(article.id) ? 'fill-current' : ''}`} />
                                            </button>
                                        </div>

                                        <p className="text-muted-foreground mb-4 line-clamp-2">{article.summary}</p>

                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="text-foreground font-medium">{article.source}</span>
                                            <span className="text-muted-foreground">•</span>
                                            <span className="text-muted-foreground">
                                                {new Date(article.date).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short'
                                                })}
                                            </span>
                                            <span className="text-muted-foreground">•</span>
                                            <span className={`badge badge-${source?.color || 'primary'}`}>
                                                {article.category}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
