import { Suspense } from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
import {
  BookOpen,
  Brain,
  Newspaper,
  TrendingUp,
  Clock,
  Target,
  ArrowRight,
  Sparkles,
  Calendar,
  Flame,
  Play,
  FileText,
  Video,
  PenTool,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/auth-config';

export const metadata = {
  title: 'Dashboard',
};

async function DashboardStats() {
  let stats = {
    syllabusProgress: 0,
    totalSyllabus: 100,
    studyStreak: 0,
    bestStreak: 0,
    studyHours: 0,
    weeklyChange: 0,
    mockAverage: 0,
    mockRank: 'N/A',
  };

  try {
    const { createServerSupabaseClient } = await import('@/lib/supabase/server');
    const supabase = await createServerSupabaseClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (authUser) {
      const [notesResult, quizzesResult, progressResult] = await Promise.allSettled([
        (supabase.from('notes') as any).select('id', { count: 'exact', head: true }).eq('user_id', authUser.id),
        (supabase.from('quizzes') as any).select('score').eq('user_id', authUser.id).order('created_at', { ascending: false }).limit(5),
        (supabase.from('user_progress') as any).select('syllabus_coverage, study_streak, best_streak, total_study_hours').eq('user_id', authUser.id).single(),
      ]);

      if (progressResult.status === 'fulfilled' && progressResult.value.data) {
        const p = progressResult.value.data;
        stats.syllabusProgress = p.syllabus_coverage || 0;
        stats.studyStreak = p.study_streak || 0;
        stats.bestStreak = p.best_streak || 0;
        stats.studyHours = p.total_study_hours || 0;
      }

      if (quizzesResult.status === 'fulfilled' && quizzesResult.value.data?.length) {
        const scores = quizzesResult.value.data.map((q: any) => q.score).filter(Boolean);
        if (scores.length > 0) {
          stats.mockAverage = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
        }
      }
    }
  } catch (error) {
    console.warn('[Dashboard] Stats fetch error (using defaults):', error);
  }

  const statCards = [
    {
      icon: BookOpen,
      label: 'Syllabus',
      value: `${stats.syllabusProgress}%`,
      sub: `of ${stats.totalSyllabus} topics`,
      color: 'text-blue-400',
      bg: 'from-blue-500/15 to-blue-600/5',
    },
    {
      icon: Flame,
      label: 'Streak',
      value: `${stats.studyStreak}`,
      sub: `Best: ${stats.bestStreak} days`,
      color: 'text-orange-400',
      bg: 'from-orange-500/15 to-orange-600/5',
    },
    {
      icon: Clock,
      label: 'Study Hours',
      value: `${stats.studyHours}h`,
      sub: 'This week',
      color: 'text-cyan-400',
      bg: 'from-cyan-500/15 to-cyan-600/5',
    },
    {
      icon: Target,
      label: 'Mock Avg',
      value: `${stats.mockAverage}%`,
      sub: 'Last 5 tests',
      color: 'text-violet-400',
      bg: 'from-violet-500/15 to-violet-600/5',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card) => (
        <div
          key={card.label}
          className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-300"
        >
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.bg} flex items-center justify-center mb-3`}>
            <card.icon className={`w-5 h-5 ${card.color}`} />
          </div>
          <p className="text-2xl font-display font-bold text-foreground">{card.value}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{card.label}</p>
          <p className="text-xs text-white/30 mt-1">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}

const quickActions = [
  { icon: BookOpen, label: 'Study Notes', href: '/dashboard/notes', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { icon: Brain, label: 'Practice Quiz', href: '/dashboard/quiz', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { icon: Newspaper, label: 'Current Affairs', href: '/dashboard/current-affairs', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { icon: Video, label: 'Video Lectures', href: '/dashboard/videos', color: 'text-rose-400', bg: 'bg-rose-500/10' },
  { icon: PenTool, label: 'Answer Practice', href: '/dashboard/answer-practice', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { icon: Calendar, label: 'Study Planner', href: '/dashboard/planner', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
];

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const firstName = user?.name?.split(' ')[0] || 'Aspirant';
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-foreground">
            {greeting}, <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">{firstName}</span>
          </h1>
          <p className="text-muted-foreground mt-1">Your daily AI-orchestrated study plan is ready.</p>
        </div>
        <Link
          href="/dashboard/planner"
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:brightness-110 transition-all"
        >
          <Play className="w-4 h-4" />
          Start Session
        </Link>
      </header>

      {/* Stats */}
      <Suspense fallback={<StatsLoading />}>
        <DashboardStats />
      </Suspense>

      {/* AI Search */}
      <div className="relative">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.1] transition-all">
          <Sparkles className="w-5 h-5 text-primary shrink-0" />
          <input
            className="flex-1 bg-transparent border-none text-foreground placeholder:text-white/30 text-base focus:outline-none"
            placeholder="Ask AI anything about UPSC..."
            type="text"
          />
          <button className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:brightness-110 transition-all flex items-center gap-2">
            Generate
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {['Generate Summary', 'Create Flashcards', 'Analyze Trends'].map((label) => (
            <button
              key={label}
              className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/40 hover:text-white/60 hover:bg-white/[0.05] transition-all"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <section>
        <h2 className="font-display text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-200"
            >
              <div className={`w-12 h-12 rounded-xl ${action.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <action.icon className={`w-6 h-6 ${action.color}`} />
              </div>
              <span className="text-xs font-medium text-white/60 group-hover:text-white/80 text-center transition-colors">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Two-column content */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Recent Activity */}
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-semibold text-foreground">Recent Activity</h3>
            <Link href="/dashboard/notes" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {[
              { icon: FileText, label: 'Indian Polity Notes', time: '2h ago', color: 'text-blue-400' },
              { icon: Brain, label: 'History Mock Test', time: '5h ago', color: 'text-violet-400' },
              { icon: TrendingUp, label: 'Economy Analysis', time: 'Yesterday', color: 'text-emerald-400' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
                  <p className="text-xs text-white/30">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Mentor */}
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">AI Mentor</h3>
              <p className="text-xs text-white/30">Your personal UPSC guide</p>
            </div>
          </div>
          <div className="space-y-3 mb-4">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
              <p className="text-sm text-white/60">
                Based on your progress, I recommend focusing on <span className="text-primary font-medium">Indian Economy</span> today.
                You&apos;ve covered 60% of Polity but only 25% of Economy.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/mentor"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium hover:bg-violet-500/15 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Chat with Mentor
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatsLoading() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-36 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
      ))}
    </div>
  );
}
