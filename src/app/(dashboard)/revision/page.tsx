'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle2, Clock, Brain, Target, Zap, ArrowRight, Play } from 'lucide-react';
import { StatCard } from '@/components/magic-ui/stat-card';
import { ShimmerButton } from '@/components/magic-ui/shimmer-button';
import { Loading } from '@/components/ui/loading';

interface RevisionCard {
    id: string;
    topic: string;
    subject: string;
    last_revised: string | null;
    next_revision: string | null;
    revision_count: number;
    mastery_level: number;
    content_type: 'note' | 'quiz';
}

const MASTERY_LEVELS = [
    { min: 0, max: 20, label: 'New', color: 'bg-gray-500', emoji: '🆕', textColor: 'text-gray-500' },
    { min: 21, max: 40, label: 'Learning', color: 'bg-red-500', emoji: '📖', textColor: 'text-red-500' },
    { min: 41, max: 60, label: 'Familiar', color: 'bg-amber-500', emoji: '💡', textColor: 'text-amber-500' },
    { min: 61, max: 80, label: 'Good', color: 'bg-blue-500', emoji: '👍', textColor: 'text-blue-500' },
    { min: 81, max: 100, label: 'Mastered', color: 'bg-green-500', emoji: '🏆', textColor: 'text-green-500' },
];

function getMasteryInfo(level: number) {
    return MASTERY_LEVELS.find(m => level >= m.min && level <= m.max) || MASTERY_LEVELS[0];
}

export default function RevisionPage() {
    const [cards, setCards] = useState<RevisionCard[]>([]);
    const [dueToday, setDueToday] = useState<RevisionCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCard, setActiveCard] = useState<RevisionCard | null>(null);
    const [stats, setStats] = useState({
        totalCards: 45,
        masteredCards: 12,
        dueToday: 8,
        streak: 5,
    });

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch('/api/revision');
                if (response.ok) {
                    const data = await response.json();
                    setCards(data.cards || []);
                    setDueToday(data.dueToday || []);
                    if (data.stats) setStats(data.stats);
                }
            } catch (error) {
                console.error('Error fetching revision data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const handleRevise = async (card: RevisionCard, remembered: boolean) => {
        try {
            await fetch('/api/revision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cardId: card.id, remembered }),
            });

            setDueToday(prev => prev.filter(c => c.id !== card.id));
            setActiveCard(null);

            if (remembered) {
                setStats(prev => ({ ...prev, masteredCards: prev.masteredCards + 1 }));
            }
        } catch (error) {
            console.error('Error updating revision:', error);
        }
    };

    if (loading) return <Loading />;

    return (
        <div className="flex flex-col gap-8 animate-slide-down">
            {/* Header */}
            <header className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 self-start w-fit">
                    <RefreshCw className="w-3 h-3 text-indigo-500" />
                    <span className="text-indigo-500 text-xs font-bold uppercase tracking-wider">Spaced Repetition</span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-light text-foreground leading-[1.1] tracking-tight">
                    Revision <span className="font-bold text-gradient">Helper</span>
                </h1>
                <p className="text-lg text-muted-foreground font-light max-w-xl">
                    AI-powered spaced repetition for long-term memory retention
                </p>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    title="Total Cards"
                    value={stats.totalCards}
                    icon={Brain}
                    glowColor="hsl(var(--accent))"
                />
                <StatCard
                    title="Mastered"
                    value={stats.masteredCards}
                    icon={CheckCircle2}
                    trend={{ value: 'Great!', direction: 'up' }}
                    glowColor="hsl(142, 76%, 36%)"
                />
                <StatCard
                    title="Due Today"
                    value={stats.dueToday}
                    icon={Clock}
                    glowColor="hsl(32, 100%, 50%)"
                />
                <StatCard
                    title="Streak"
                    value={`${stats.streak} days`}
                    icon={Zap}
                    glowColor="hsl(263, 70%, 50%)"
                />
            </div>

            {/* Active Revision Card */}
            {activeCard ? (
                <div className="bento-card overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-1">
                        <div className="bg-card p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getMasteryInfo(activeCard.mastery_level).color} text-white`}>
                                    {getMasteryInfo(activeCard.mastery_level).emoji} {getMasteryInfo(activeCard.mastery_level).label}
                                </span>
                                <span className="badge badge-primary">{activeCard.subject}</span>
                            </div>

                            <h2 className="text-3xl font-bold text-foreground mb-4">{activeCard.topic}</h2>

                            <p className="text-muted-foreground text-lg mb-8">
                                Think about what you remember about this topic...
                            </p>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => handleRevise(activeCard, false)}
                                    className="flex-1 py-4 rounded-2xl border-2 border-red-500 text-red-500 font-semibold hover:bg-red-500 hover:text-white transition-all"
                                >
                                    Need More Practice 📚
                                </button>
                                <ShimmerButton
                                    onClick={() => handleRevise(activeCard, true)}
                                    className="flex-1 py-4"
                                    background="hsl(142, 76%, 36%)"
                                >
                                    Got It! ✅
                                </ShimmerButton>
                            </div>
                        </div>
                    </div>
                </div>
            ) : dueToday.length > 0 ? (
                <div className="bento-card text-center p-12">
                    <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-6">
                        <RefreshCw className="w-10 h-10 text-indigo-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                        {dueToday.length} topics due for revision
                    </h3>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                        Start your revision session to strengthen your memory using spaced repetition
                    </p>
                    <ShimmerButton
                        onClick={() => setActiveCard(dueToday[0])}
                        className="px-8 py-4 text-lg"
                    >
                        <Play className="w-5 h-5 mr-2" />
                        Start Revision Session
                    </ShimmerButton>
                </div>
            ) : (
                <div className="bento-card text-center p-12">
                    <div className="w-20 h-20 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">All caught up! 🎉</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        No topics due for revision today. Great job staying on top of your studies!
                    </p>
                </div>
            )}

            {/* All Cards Overview */}
            <div className="bento-card p-6">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-indigo-500" />
                    Mastery Overview
                </h3>
                <p className="text-muted-foreground text-sm mb-6">Your revision progress by mastery level</p>

                {cards.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                        Topics from your notes and quizzes will appear here for revision
                    </p>
                ) : (
                    <div className="space-y-4">
                        {MASTERY_LEVELS.map((level) => {
                            const levelCards = cards.filter(
                                c => c.mastery_level >= level.min && c.mastery_level <= level.max
                            );
                            const percentage = cards.length > 0 ? (levelCards.length / cards.length) * 100 : 0;

                            return (
                                <div key={level.label} className="flex items-center gap-4">
                                    <span className="text-2xl w-10">{level.emoji}</span>
                                    <span className={`text-sm font-medium w-24 ${level.textColor}`}>{level.label}</span>
                                    <div className="flex-1 h-3 bg-muted/50 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${level.color} transition-all duration-500`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-sm text-muted-foreground w-12 text-right font-medium">
                                        {levelCards.length}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
