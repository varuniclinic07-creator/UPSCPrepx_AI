'use client';

import { useState } from 'react';
import { BookMarked, Download, Calendar, FileText, Eye, Sparkles, ArrowRight } from 'lucide-react';
import { ShimmerButton } from '@/components/magic-ui/shimmer-button';
import { StatCard } from '@/components/magic-ui/stat-card';
import { BentoGrid } from '@/components/magic-ui/bento-grid';

interface Magazine {
    id: string;
    title: string;
    month: string;
    year: number;
    coverUrl: string;
    pdfUrl: string;
    articles: number;
    color: string;
}

const magazines: Magazine[] = [
    {
        id: '1',
        title: 'Yojana',
        month: 'January',
        year: 2024,
        coverUrl: '/covers/yojana.jpg',
        pdfUrl: '/magazines/yojana-jan-2024.pdf',
        articles: 12,
        color: 'from-blue-500 to-indigo-600'
    },
    {
        id: '2',
        title: 'Kurukshetra',
        month: 'January',
        year: 2024,
        coverUrl: '/covers/kurukshetra.jpg',
        pdfUrl: '/magazines/kurukshetra-jan-2024.pdf',
        articles: 15,
        color: 'from-emerald-500 to-teal-600'
    },
    {
        id: '3',
        title: 'Yojana',
        month: 'December',
        year: 2023,
        coverUrl: '/covers/yojana.jpg',
        pdfUrl: '/magazines/yojana-dec-2023.pdf',
        articles: 10,
        color: 'from-purple-500 to-pink-600'
    },
    {
        id: '4',
        title: 'Kurukshetra',
        month: 'December',
        year: 2023,
        coverUrl: '/covers/kurukshetra.jpg',
        pdfUrl: '/magazines/kurukshetra-dec-2023.pdf',
        articles: 14,
        color: 'from-amber-500 to-orange-600'
    },
];

export default function MagazinesPage() {
    const [filter, setFilter] = useState<'all' | 'Yojana' | 'Kurukshetra'>('all');

    const filteredMagazines = magazines.filter(
        m => filter === 'all' || m.title === filter
    );

    return (
        <div className="flex flex-col gap-8 animate-slide-down">
            {/* Header */}
            <header className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 self-start w-fit">
                    <BookMarked className="w-3 h-3 text-indigo-500" />
                    <span className="text-indigo-500 text-xs font-bold uppercase tracking-wider">Government Publications</span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-light text-foreground leading-[1.1] tracking-tight">
                    Monthly <span className="font-bold text-gradient">Magazines</span>
                </h1>
                <p className="text-lg text-muted-foreground font-light max-w-xl">
                    Yojana & Kurukshetra - Essential reading for UPSC preparation
                </p>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Total Issues" value={magazines.length} icon={BookMarked} glowColor="hsl(239, 84%, 67%)" />
                <StatCard title="Total Articles" value={magazines.reduce((a, m) => a + m.articles, 0)} icon={FileText} glowColor="hsl(var(--primary))" />
                <StatCard title="Yojana" value={magazines.filter(m => m.title === 'Yojana').length} icon={Sparkles} glowColor="hsl(var(--primary))" />
                <StatCard title="Kurukshetra" value={magazines.filter(m => m.title === 'Kurukshetra').length} icon={Sparkles} glowColor="hsl(142, 76%, 36%)" />
            </div>

            {/* Filter */}
            <div className="flex gap-3">
                {(['all', 'Yojana', 'Kurukshetra'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-5 py-3 rounded-xl font-medium transition-all ${filter === f
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                : 'bg-card/40 border border-border/50 text-foreground hover:border-indigo-500/30'
                            }`}
                    >
                        {f === 'all' ? 'All Magazines' : f}
                    </button>
                ))}
            </div>

            {/* Magazines Grid */}
            <BentoGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredMagazines.map(magazine => (
                    <div
                        key={magazine.id}
                        className="group flex flex-col rounded-2xl bg-card/40 border border-border/50 hover:border-indigo-500/30 overflow-hidden transition-all"
                    >
                        {/* Cover */}
                        <div className={`aspect-[3/4] bg-gradient-to-br ${magazine.color} flex items-center justify-center p-6 relative overflow-hidden`}>
                            <div className="absolute inset-0 bg-black/10" />
                            <div className="relative text-center text-white z-10">
                                <h3 className="text-3xl font-bold mb-2">{magazine.title}</h3>
                                <p className="text-lg font-medium opacity-90">{magazine.month}</p>
                                <p className="text-sm opacity-75">{magazine.year}</p>
                            </div>
                            {/* Decorative circles */}
                            <div className="absolute -right-12 -bottom-12 w-32 h-32 rounded-full bg-white/10" />
                            <div className="absolute -left-8 -top-8 w-24 h-24 rounded-full bg-white/10" />
                        </div>

                        {/* Info */}
                        <div className="p-5 flex flex-col gap-4 flex-1">
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <FileText className="w-4 h-4" />
                                    {magazine.articles} Articles
                                </span>
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    {magazine.month.substring(0, 3)} {magazine.year}
                                </span>
                            </div>

                            <div className="flex gap-2 mt-auto">
                                <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-muted/50 border border-border/50 text-foreground hover:bg-muted transition-all">
                                    <Eye className="w-4 h-4" />
                                    Read
                                </button>
                                <a
                                    href={magazine.pdfUrl}
                                    download
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-all"
                                >
                                    <Download className="w-4 h-4" />
                                    Download
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </BentoGrid>
        </div>
    );
}
