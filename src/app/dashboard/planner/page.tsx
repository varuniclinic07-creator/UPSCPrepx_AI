'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Calendar, CheckCircle2, Clock, Target, TrendingUp, BookOpen, ArrowRight, Sparkles, Play } from 'lucide-react';
import { BentoGrid } from '@/components/magic-ui/bento-grid';
import { StatCard } from '@/components/magic-ui/stat-card';
import { ShimmerButton } from '@/components/magic-ui/shimmer-button';
import { Loading } from '@/components/ui/loading';

interface StudyPlan {
    id: string;
    name: string;
    exam_date: string | null;
    daily_hours: number;
    subjects: string[];
    progress: number;
    is_active: boolean;
    created_at: string;
}

interface TodayTask {
    id: string;
    subject: string;
    topic: string;
    duration_minutes: number;
    is_completed: boolean;
    scheduled_time: string;
}

export default function PlannerPage() {
    const [plans, setPlans] = useState<StudyPlan[]>([]);
    const [todayTasks, setTodayTasks] = useState<TodayTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalHoursToday: 6,
        completedHours: 2,
        streak: 12,
        weeklyProgress: 68,
    });

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch('/api/planner');
                if (!response.ok) throw new Error('Failed to fetch planner data');
                const data = await response.json();
                setPlans(data.plans || []);
                setTodayTasks(data.todayTasks || []);
                if (data.stats) setStats(data.stats);
            } catch (error) {
                console.error('Error fetching planner:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const toggleTask = async (taskId: string) => {
        setTodayTasks(tasks =>
            tasks.map(t => t.id === taskId ? { ...t, is_completed: !t.is_completed } : t)
        );
    };

    if (loading) return <Loading />;

    return (
        <div className="flex flex-col gap-8 animate-slide-down">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="flex flex-col gap-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 self-start w-fit">
                        <Calendar className="w-3 h-3 text-green-500" />
                        <span className="text-green-500 text-xs font-bold uppercase tracking-wider">AI Study Planner</span>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-light text-foreground leading-[1.1] tracking-tight">
                        Study <span className="font-bold text-gradient">Planner</span>
                    </h1>
                    <p className="text-lg text-muted-foreground font-light max-w-xl">
                        AI-optimized study schedule tailored to your UPSC preparation
                    </p>
                </div>
                <Link href="/dashboard/planner/new">
                    <ShimmerButton className="px-6 py-3 text-sm" background="hsl(142, 76%, 36%)">
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Plan
                    </ShimmerButton>
                </Link>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    title="Today's Hours"
                    value={`${stats.completedHours}/${stats.totalHoursToday}h`}
                    icon={Clock}
                    glowColor="hsl(var(--primary))"
                >
                    <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden mt-3">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-secondary"
                            style={{ width: `${(stats.completedHours / stats.totalHoursToday) * 100}%` }}
                        />
                    </div>
                </StatCard>

                <StatCard
                    title="Current Streak"
                    value={`${stats.streak} days`}
                    icon={TrendingUp}
                    trend={{ value: 'Keep going!', direction: 'up' }}
                    glowColor="hsl(32, 100%, 50%)"
                />

                <StatCard
                    title="Weekly Progress"
                    value={`${stats.weeklyProgress}%`}
                    icon={CheckCircle2}
                    glowColor="hsl(142, 76%, 36%)"
                />

                <StatCard
                    title="Active Plans"
                    value={plans.filter(p => p.is_active).length}
                    icon={Target}
                    glowColor="hsl(var(--accent))"
                />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Today's Schedule */}
                <div className="lg:col-span-2 bento-card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary" />
                                Today&apos;s Schedule
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                        {todayTasks.length > 0 && (
                            <Link href="/dashboard/planner/today">
                                <ShimmerButton className="px-4 py-2 text-sm">
                                    <Play className="w-4 h-4 mr-2" />
                                    Start Session
                                </ShimmerButton>
                            </Link>
                        )}
                    </div>

                    {todayTasks.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-8 h-8 text-muted-foreground/50" />
                            </div>
                            <p className="text-muted-foreground mb-4">No tasks scheduled for today</p>
                            <Link href="/dashboard/planner/new">
                                <ShimmerButton className="px-5 py-2.5 text-sm">
                                    Create a Study Plan
                                </ShimmerButton>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {todayTasks.map((task) => (
                                <div
                                    key={task.id}
                                    onClick={() => toggleTask(task.id)}
                                    className={`group p-4 rounded-2xl border cursor-pointer transition-all ${task.is_completed
                                            ? 'bg-green-500/10 border-green-500/30'
                                            : 'bg-muted/30 border-border/50 hover:border-primary/30 hover:bg-muted/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${task.is_completed
                                                ? 'bg-green-500 text-white'
                                                : 'border-2 border-muted-foreground/50 group-hover:border-primary'
                                            }`}>
                                            {task.is_completed && <CheckCircle2 className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className={`font-medium ${task.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                                {task.topic}
                                            </h4>
                                            <p className="text-sm text-muted-foreground">{task.subject}</p>
                                        </div>
                                        <div className="text-right text-sm">
                                            <p className="font-medium text-foreground">{task.scheduled_time}</p>
                                            <p className="text-muted-foreground">{task.duration_minutes} min</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Active Plans */}
                <div className="bento-card p-6">
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
                        <BookOpen className="w-5 h-5 text-accent" />
                        Your Plans
                    </h3>

                    {plans.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground text-sm">No study plans yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {plans.map((plan) => (
                                <Link key={plan.id} href={`/planner/${plan.id}`}>
                                    <div className="group p-4 rounded-2xl bg-muted/30 border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-all cursor-pointer">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">{plan.name}</h4>
                                            {plan.is_active && (
                                                <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-xs font-medium rounded-full">
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                                            <Clock className="w-3 h-3" />
                                            {plan.daily_hours}h/day
                                        </div>
                                        <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-accent to-primary transition-all"
                                                style={{ width: `${plan.progress}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">{plan.progress}% complete</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
