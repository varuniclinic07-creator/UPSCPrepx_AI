'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Map, Loader2, BookOpen, ArrowRight, Sparkles, Network, Plus, Brain } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ShimmerButton } from '@/components/magic-ui/shimmer-button';
import { StatCard } from '@/components/magic-ui/stat-card';
import { BentoGrid } from '@/components/magic-ui/bento-grid';
import { BorderBeamInput } from '@/components/magic-ui/border-beam';
import { Loading } from '@/components/ui/loading';
import { QuickGenerate } from '@/components/living-content/quick-generate';

interface MindMap {
    id: string;
    topic: string;
    subject: string;
    nodes: any[];
    created_at: string;
}

const SAMPLE_TOPICS = [
    { topic: 'Indian Constitution', subject: 'Polity', icon: '⚖️', color: 'primary' },
    { topic: 'Mughal Empire', subject: 'History', icon: '📜', color: 'amber' },
    { topic: 'Monsoon System', subject: 'Geography', icon: '🌧️', color: 'secondary' },
    { topic: 'GDP & Economic Growth', subject: 'Economy', icon: '📈', color: 'green' },
    { topic: 'Environmental Pollution', subject: 'Environment', icon: '🌿', color: 'emerald' },
    { topic: 'Space Technology', subject: 'Science', icon: '🚀', color: 'accent' },
];

export default function MindMapsPage() {
    const [mindMaps, setMindMaps] = useState<MindMap[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTopic, setSearchTopic] = useState('');
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        async function fetchMindMaps() {
            try {
                const response = await fetch('/api/mind-maps');
                if (response.ok) {
                    const data = await response.json();
                    setMindMaps(data.mindMaps || []);
                }
            } catch (error) {
                console.error('Error fetching mind maps:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchMindMaps();
    }, []);

    const generateMindMap = async (topic: string, subject?: string) => {
        if (!topic.trim()) return;

        setGenerating(true);
        try {
            const response = await fetch('/api/mind-maps/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: topic.trim(), subject }),
            });

            if (response.ok) {
                const data = await response.json();
                setMindMaps(prev => [data, ...prev]);
                setSearchTopic('');
            }
        } catch (error) {
            console.error('Error generating mind map:', error);
        } finally {
            setGenerating(false);
        }
    };

    if (loading) return <Loading />;

    return (
        <div className="flex flex-col gap-8 animate-slide-down">
            {/* Header */}
            <header className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 self-start w-fit">
                    <Network className="w-3 h-3 text-pink-500" />
                    <span className="text-pink-500 text-xs font-bold uppercase tracking-wider">AI Visualization</span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-light text-foreground leading-[1.1] tracking-tight">
                    Topic <span className="font-bold text-gradient">Mind Maps</span>
                </h1>
                <p className="text-lg text-muted-foreground font-light max-w-xl">
                    Visualize connections and relationships between UPSC topics
                </p>
            </header>

            {/* Living Content — Quick Generate */}
            <QuickGenerate mode="mind_map" />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    title="Total Maps"
                    value={mindMaps.length}
                    icon={Map}
                    glowColor="hsl(330, 80%, 50%)"
                />
                <StatCard
                    title="Total Nodes"
                    value={mindMaps.reduce((acc, m) => acc + (m.nodes?.length || 0), 0)}
                    icon={Network}
                    glowColor="hsl(var(--primary))"
                />
                <StatCard
                    title="Subjects"
                    value={new Set(mindMaps.map(m => m.subject)).size}
                    icon={BookOpen}
                    glowColor="hsl(var(--secondary))"
                />
                <StatCard
                    title="Connections"
                    value={mindMaps.reduce((acc, m) => acc + (m.nodes?.length || 0) * 2, 0)}
                    icon={Brain}
                    glowColor="hsl(var(--accent))"
                />
            </div>

            {/* Generate Section */}
            <div className="bento-card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-pink-500" />
                    <h3 className="text-xl font-bold text-foreground">Generate Topic Map</h3>
                </div>
                <p className="text-muted-foreground text-sm mb-6">
                    Enter any UPSC topic to create a visual mind map with AI
                </p>

                <div className="flex gap-3">
                    <BorderBeamInput className="flex-1" active={searchTopic.length > 0}>
                        <Input
                            placeholder="e.g., Fundamental Rights, Green Revolution, Climate Change..."
                            value={searchTopic}
                            onChange={(e) => setSearchTopic(e.target.value)}
                            className="h-12 bg-muted/30 border-border/50 rounded-xl"
                            onKeyDown={(e) => e.key === 'Enter' && generateMindMap(searchTopic)}
                        />
                    </BorderBeamInput>
                    <ShimmerButton
                        onClick={() => generateMindMap(searchTopic)}
                        disabled={generating || !searchTopic.trim()}
                        className="h-12 px-6"
                        background="hsl(330, 80%, 50%)"
                    >
                        {generating ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Map className="w-5 h-5 mr-2" />
                                Generate
                            </>
                        )}
                    </ShimmerButton>
                </div>
            </div>

            {/* Quick Topics */}
            <section className="flex flex-col gap-4">
                <h3 className="text-lg font-medium text-foreground">Popular Topics</h3>
                <BentoGrid className="grid-cols-2 md:grid-cols-3 gap-4">
                    {SAMPLE_TOPICS.map((item) => (
                        <button
                            key={item.topic}
                            onClick={() => generateMindMap(item.topic, item.subject)}
                            disabled={generating}
                            className="group relative p-5 rounded-2xl bg-card/40 border border-border/50 hover:border-pink-500/30 hover:bg-card/80 transition-all text-left disabled:opacity-50"
                        >
                            <div className="absolute -right-8 -top-8 w-16 h-16 bg-pink-500/10 rounded-full blur-[40px] group-hover:bg-pink-500/20 transition-all" />

                            <span className="text-3xl mb-3 block">{item.icon}</span>
                            <h4 className="font-semibold text-foreground group-hover:text-pink-500 transition-colors">
                                {item.topic}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">{item.subject}</p>
                            <ArrowRight className="w-4 h-4 mt-3 text-muted-foreground group-hover:text-pink-500 group-hover:translate-x-1 transition-all" />
                        </button>
                    ))}
                </BentoGrid>
            </section>

            {/* Existing Mind Maps */}
            {mindMaps.length > 0 && (
                <section className="flex flex-col gap-4">
                    <div className="flex items-end justify-between">
                        <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-pink-500" />
                            Your Topic Maps
                        </h3>
                        <Link
                            href="/dashboard/mindmaps/all"
                            className="text-sm text-primary hover:text-foreground transition-colors flex items-center gap-1"
                        >
                            View all <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <BentoGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {mindMaps.map((map) => (
                            <Link key={map.id} href={`/dashboard/mindmaps/${map.id}`}>
                                <div className="group p-5 rounded-2xl bg-card/40 border border-border/50 hover:border-pink-500/30 hover:bg-card/80 transition-all cursor-pointer h-full">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500 shrink-0">
                                            <Network className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-foreground group-hover:text-pink-500 transition-colors">
                                                {map.topic}
                                            </h4>
                                            <span className="badge badge-primary">{map.subject}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Map className="w-3 h-3" />
                                            {map.nodes?.length || 0} nodes
                                        </span>
                                        <span>•</span>
                                        <span>{new Date(map.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </BentoGrid>
                </section>
            )}

            {/* Empty State */}
            {mindMaps.length === 0 && !loading && (
                <div className="bento-card text-center p-12">
                    <div className="w-16 h-16 rounded-2xl bg-pink-500/10 flex items-center justify-center mx-auto mb-4">
                        <Map className="w-8 h-8 text-pink-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No topic maps yet</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        Generate your first mind map to visualize topic connections
                    </p>
                </div>
            )}
        </div>
    );
}
