'use client';

import { useState } from 'react';
import { FileSearch, Calendar, BookOpen, ArrowRight, Target, TrendingUp, Clock, ChevronDown } from 'lucide-react';
import { ShimmerButton } from '@/components/magic-ui/shimmer-button';
import { StatCard } from '@/components/magic-ui/stat-card';
import { BentoGrid } from '@/components/magic-ui/bento-grid';

const years = ['2024', '2023', '2022', '2021', '2020', '2019'];
const papers = ['GS-1', 'GS-2', 'GS-3', 'GS-4', 'Essay'];

const paperInfo: Record<string, { color: string; topics: string[] }> = {
    'GS-1': { color: 'primary', topics: ['History', 'Geography', 'Society'] },
    'GS-2': { color: 'secondary', topics: ['Polity', 'Governance', 'IR'] },
    'GS-3': { color: 'accent', topics: ['Economy', 'Environment', 'Security'] },
    'GS-4': { color: 'amber', topics: ['Ethics', 'Aptitude', 'Case Studies'] },
    'Essay': { color: 'violet', topics: ['Philosophy', 'Social', 'Political'] },
};

const pyqs = [
    { year: '2023', paper: 'GS-1', question: 'Discuss the role of women in the Indian freedom struggle.', topic: 'Modern History', marks: 15 },
    { year: '2023', paper: 'GS-1', question: 'Examine the causes and consequences of migration.', topic: 'Geography', marks: 10 },
    { year: '2023', paper: 'GS-2', question: 'Evaluate the role of civil services in ensuring good governance.', topic: 'Governance', marks: 15 },
    { year: '2023', paper: 'GS-3', question: 'Analyze the impact of digital economy on employment.', topic: 'Economy', marks: 15 },
    { year: '2022', paper: 'GS-1', question: 'Discuss the contribution of Subhas Chandra Bose to the freedom struggle.', topic: 'Modern History', marks: 15 },
];

export default function PYQAnalysisPage() {
    const [selectedYear, setSelectedYear] = useState('2023');
    const [selectedPaper, setSelectedPaper] = useState('GS-1');

    const filteredPYQs = pyqs.filter(q => q.year === selectedYear && q.paper === selectedPaper);
    const currentPaperInfo = paperInfo[selectedPaper];

    return (
        <div className="flex flex-col gap-8 animate-slide-down">
            {/* Header */}
            <header className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 self-start w-fit">
                    <FileSearch className="w-3 h-3 text-cyan-500" />
                    <span className="text-cyan-500 text-xs font-bold uppercase tracking-wider">Previous Year Analysis</span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-light text-foreground leading-[1.1] tracking-tight">
                    PYQ <span className="font-bold text-gradient">Analysis</span>
                </h1>
                <p className="text-lg text-muted-foreground font-light max-w-xl">
                    Study previous year questions with AI-powered trend analysis
                </p>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Total PYQs" value="500+" icon={FileSearch} glowColor="hsl(187, 92%, 37%)" />
                <StatCard title="Years Covered" value="10" icon={Calendar} glowColor="hsl(var(--primary))" />
                <StatCard title="Papers" value="5" icon={BookOpen} glowColor="hsl(var(--secondary))" />
                <StatCard title="Trending Topics" value="25" icon={TrendingUp} glowColor="hsl(var(--accent))" />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                {/* Year Selector */}
                <div className="relative">
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="appearance-none h-12 px-5 pr-10 bg-card/40 border border-border/50 rounded-xl text-foreground font-medium cursor-pointer hover:border-primary/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    >
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                </div>

                {/* Paper Selector */}
                <div className="flex gap-2">
                    {papers.map(p => (
                        <button
                            key={p}
                            onClick={() => setSelectedPaper(p)}
                            className={`px-5 py-3 rounded-xl font-medium transition-all ${selectedPaper === p
                                    ? `bg-${paperInfo[p].color}/90 text-white shadow-lg shadow-${paperInfo[p].color}/30`
                                    : 'bg-card/40 border border-border/50 text-foreground hover:border-primary/30'
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {/* Paper Info */}
            <div className="bento-card p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-${currentPaperInfo.color}/10 flex items-center justify-center`}>
                        <BookOpen className={`w-6 h-6 text-${currentPaperInfo.color}`} />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground">{selectedPaper} - {selectedYear}</h3>
                        <p className="text-sm text-muted-foreground">
                            Topics: {currentPaperInfo.topics.join(', ')}
                        </p>
                    </div>
                </div>
                <span className="text-lg font-bold text-foreground">{filteredPYQs.length} Questions</span>
            </div>

            {/* Questions */}
            {filteredPYQs.length === 0 ? (
                <div className="bento-card text-center p-12">
                    <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4">
                        <FileSearch className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No questions found</h3>
                    <p className="text-muted-foreground">Try selecting a different year or paper</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredPYQs.map((q, idx) => (
                        <div
                            key={idx}
                            className="group p-6 rounded-2xl bg-card/40 border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all"
                        >
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <span className={`badge badge-${currentPaperInfo.color}`}>{q.topic}</span>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        ~{q.marks} min
                                    </span>
                                </div>
                                <span className="text-lg font-bold text-foreground">{q.marks} marks</span>
                            </div>

                            <p className="text-lg text-foreground leading-relaxed mb-4">{q.question}</p>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Target className="w-3 h-3" />
                                    <span>Asked {q.year}</span>
                                </div>
                                <button className="text-primary font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                                    View Model Answer
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Trend Analysis */}
            <div className="bento-card p-6">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-cyan-500" />
                    Trend Analysis
                </h3>
                <p className="text-muted-foreground text-sm mb-6">
                    Topics that are frequently asked in {selectedPaper}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {currentPaperInfo.topics.map((topic, idx) => (
                        <div key={topic} className="p-4 rounded-xl bg-muted/30 border border-border/50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-foreground font-medium">{topic}</span>
                                <span className="text-xs text-green-500 font-bold">+{15 - idx * 3}%</span>
                            </div>
                            <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                                <div
                                    className={`h-full bg-gradient-to-r from-${currentPaperInfo.color} to-primary`}
                                    style={{ width: `${90 - idx * 15}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
