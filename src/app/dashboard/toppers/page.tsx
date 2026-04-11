'use client';

import { useState, useEffect } from 'react';
import { Trophy, BookOpen, Clock, Target, Star, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import type { TopperProfile } from '@/lib/content/topper-strategies';

export default function ToppersPage() {
    const [toppers, setToppers] = useState<TopperProfile[]>([]);
    const [years, setYears] = useState<number[]>([]);
    const [selectedYear, setSelectedYear] = useState<string>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMeta();
        fetchToppers();
    }, []);

    useEffect(() => {
        if (selectedYear !== 'all') {
            fetchToppers(selectedYear);
        } else {
            fetchToppers();
        }
    }, [selectedYear]);

    const fetchMeta = async () => {
        try {
            const res = await fetch('/api/toppers?meta=true');
            const data = await res.json();
            setYears(data.years || []);
        } catch (error) {
            console.error('Failed to fetch metadata:', error);
        }
    };

    const fetchToppers = async (year?: string) => {
        setLoading(true);
        try {
            const url = year ? `/api/toppers?year=${year}` : '/api/toppers';
            const res = await fetch(url);
            const data = await res.json();
            setToppers(data.toppers || []);
        } catch (error) {
            console.error('Failed to fetch toppers:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 animate-slide-down">
            {/* Header */}
            <header className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 self-start w-fit">
                    <Trophy className="w-3 h-3 text-amber-500" />
                    <span className="text-amber-500 text-xs font-bold uppercase tracking-wider">Success Stories</span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-light text-foreground leading-[1.1] tracking-tight">
                    Topper <span className="font-bold text-gradient">Strategies</span>
                </h1>
                <p className="text-lg text-muted-foreground font-light max-w-xl">
                    Learn from UPSC toppers - their strategies, schedules, and success mantras
                </p>
            </header>

            {/* Year Filter */}
            <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-foreground">Filter by Year:</label>
                <div className="relative">
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="appearance-none h-12 px-5 pr-10 bg-card/40 border border-border/50 rounded-xl text-foreground font-medium cursor-pointer hover:border-primary/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    >
                        <option value="all">All Years</option>
                        {years.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                </div>
            </div>

            {/* Toppers Grid */}
            {loading ? (
                <div className="text-center text-muted-foreground">Loading toppers...</div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {toppers.map((topper) => (
                        <Link key={topper.id} href={`/toppers/${topper.id}`}>
                            <div className="group h-full p-6 rounded-2xl bg-card/40 border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all cursor-pointer">
                                {/* Rank Badge */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                                            <Trophy className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">AIR</p>
                                            <p className="text-2xl font-bold text-foreground">{topper.rank}</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-bold text-primary">
                                        {topper.year}
                                    </span>
                                </div>

                                {/* Topper Info */}
                                <h3 className="text-xl font-bold text-foreground mb-2">{topper.name}</h3>
                                <p className="text-sm text-muted-foreground mb-4">{topper.optionalSubject}</p>

                                {/* Stats */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Target className="w-4 h-4" />
                                        <span>{topper.attemptsCount} {topper.attemptsCount === 1 ? 'Attempt' : 'Attempts'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Clock className="w-4 h-4" />
                                        <span>{topper.dailySchedule.length} hour schedule</span>
                                    </div>
                                </div>

                                {/* Unique Approach */}
                                <p className="text-sm text-foreground line-clamp-3 mb-4">
                                    {topper.uniqueApproach}
                                </p>

                                {/* Tips Preview */}
                                <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-amber-500" />
                                    <span className="text-xs text-muted-foreground">
                                        {topper.tips.length} Strategy Tips
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
