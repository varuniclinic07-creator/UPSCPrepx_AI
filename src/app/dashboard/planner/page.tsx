'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Calendar, CheckCircle2, Clock, Target, TrendingUp, BookOpen, ArrowRight, Sparkles, Play } from 'lucide-react';
import { BentoGrid } from '@/components/magic-ui/bento-grid';
import { StatCard } from '@/components/magic-ui/stat-card';
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
                        <Calendar className="w-3 h-3 text-green-400" />
                        <span className="text-green-400 text-xs font-bold uppercase tracking-wider">AI Study Planner</span>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-light text-white leading-[1.1] tracking-tight">
                        Study <span className="font-bold text-gradient">Planner</span>
                    </h1>
                    <p className="text-lg text-white/40 font-light max-w-xl">
                        AI-optimized study schedule tailored to your UPSC preparation
                    </p>
                </div>
                <Link href="/dashboard/planner/new" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 hover:scale-105 active:scale-95 transition-all">
                    <Plus className="w-4 h-4" />
                    Create New Plan
                </Link>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    title="Today's Hours"
                    value={`${stats.completedHours}/${stats.totalHoursToday}h`}
                    icon={Clock}
                    glowColor="rgba(59,130,246,0.15)"
                >
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-3">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                            style={{ width: `${(stats.completedHours / stats.totalHoursToday) * 100}%` }}
                        />
                    </div>
                </StatCard>

                <StatCard
                    title="Current Streak"
                    value={`${stats.streak} days`}
                    icon={TrendingUp}
                    trend={{ value: 'Keep going!', direction: 'up' }}
                    glowColor="rgba(249,115,22,0.15)"
                />

                <StatCard
                    title="Weekly Progress"
                    value={`${stats.weeklyProgress}%`}
                    icon={CheckCircle2}
                    glowColor="rgba(34,197,94,0.15)"
                />

                <StatCard
                    title="Active Plans"
                    value={plans.filter(p => p.is_active).length}
                    icon={Target}
                    glowColor="rgba(139,92,246,0.15)"
                />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Today's Schedule */}
                <div className="lg:col-span-2 rounded-2xl bg-white/[0.03] border border-white/[0.05] p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-400" />
                                Today&apos;s Schedule
                            </h3>
                            <p className="text-sm text-white/40 mt-1">
                                {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                        {todayTasks.length > 0 && (
                            <Link href="/dashboard/planner/today" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 hover:scale-105 active:scale-95 transition-all">
                                <Play className="w-4 h-4" />
                                Start Session
                            </Link>
                        )}
                    </div>

                    {todayTasks.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-8 h-8 text-white/20" />
                            </div>
                            <p className="text-white/40 mb-4">No tasks scheduled for today</p>
                            <Link href="/dashboard/planner/new" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 hover:scale-105 active:scale-95 transition-all">
                                Create a Study Plan
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {todayTasks.map((task) => (
                                <div
                                    key={task.id}
                                    onClick={() => toggleTask(task.id)}
                                    className={`group p-4 rounded-2xl border cursor-pointer transition-all ${task.is_completed
                                            ? 'bg-green-500/10 border-green-500/20'
                                            : 'bg-white/[0.03] border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.05]'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${task.is_completed
                                                ? 'bg-green-500 text-white'
                                                : 'border-2 border-white/20 group-hover:border-blue-500'
                                            }`}>
                                            {task.is_completed && <CheckCircle2 className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className={`font-medium ${task.is_completed ? 'line-through text-white/40' : 'text-white'}`}>
                                                {task.topic}
                                            </h4>
                                            <p className="text-sm text-white/40">{task.subject}</p>
                                        </div>
                                        <div className="text-right text-sm">
                                            <p className="font-medium text-white">{task.scheduled_time}</p>
                                            <p className="text-white/40">{task.duration_minutes} min</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Active Plans */}
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.05] p-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                        <BookOpen className="w-5 h-5 text-violet-400" />
                        Your Plans
                    </h3>

                    {plans.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-white/40 text-sm">No study plans yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {plans.map((plan) => (
                                <Link key={plan.id} href={`/planner/${plan.id}`}>
                                    <div className="group p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.05] transition-all cursor-pointer">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-medium text-white group-hover:text-blue-400 transition-colors">{plan.name}</h4>
                                            {plan.is_active && (
                                                <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs font-medium rounded-full">
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-white/40 mb-3">
                                            <Clock className="w-3 h-3" />
                                            {plan.daily_hours}h/day
                                        </div>
                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all"
                                                style={{ width: `${plan.progress}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-white/40 mt-2">{plan.progress}% complete</p>
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
