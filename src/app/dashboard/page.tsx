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
  Star,
  Trophy,
  CheckCircle2,
  BarChart3,
  Activity,
  Medal,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/auth-config';

export const metadata = {
  title: 'Dashboard',
};

/* ═══════════════════════════════════════════════════════════════
   SERVER COMPONENT: Fetch real stats from DB
   ═══════════════════════════════════════════════════════════════ */

async function DashboardStats() {
  let stats = {
    studyHours: 0,
    studyChange: 0,
    mockAverage: 0,
    mockChange: 0,
    syllabusProgress: 0,
    syllabusChange: 0,
    rank: 'N/A' as string,
    rankChange: 0,
    studyStreak: 0,
    bestStreak: 0,
  };

  try {
    const { createServerSupabaseClient } = await import('@/lib/supabase/server');
    const supabase = await createServerSupabaseClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (authUser) {
      const [quizzesResult, progressResult] = await Promise.allSettled([
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
      icon: Clock,
      label: 'Study Hours',
      value: `${stats.studyHours}h`,
      change: '+12%',
      changePositive: true,
      color: 'blue',
    },
    {
      icon: Target,
      label: 'Mock Score Avg',
      value: `${stats.mockAverage}/200`,
      change: '+5 pts',
      changePositive: true,
      color: 'green',
    },
    {
      icon: BookOpen,
      label: 'Syllabus Covered',
      value: `${stats.syllabusProgress}%`,
      change: '+2%',
      changePositive: true,
      color: 'violet',
    },
    {
      icon: BarChart3,
      label: 'Current Rank',
      value: '#1,240',
      change: 'up 40',
      changePositive: true,
      color: 'orange',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card) => {
        const colorMap: Record<string, { bg: string; text: string; glow: string }> = {
          blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', glow: 'rgba(59,130,246,0.15)' },
          green: { bg: 'bg-green-500/10', text: 'text-green-400', glow: 'rgba(34,197,94,0.15)' },
          violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', glow: 'rgba(139,92,246,0.15)' },
          orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', glow: 'rgba(249,115,22,0.15)' },
        };
        const c = colorMap[card.color];

        return (
          <div
            key={card.label}
            className="stat-card group"
          >
            <div className="stat-card-glow" style={{ background: c.glow }} />
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${c.text}`} />
              </div>
              <span className="text-xs text-green-400 font-medium bg-green-500/10 px-2 py-0.5 rounded-full">
                {card.change}
              </span>
            </div>
            <p className="text-2xl font-display font-bold text-white">{card.value}</p>
            <p className="text-sm text-white/40 mt-1">{card.label}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   QUICK ACTIONS
   ═══════════════════════════════════════════════════════════════ */

const quickActions = [
  { icon: BookOpen, label: 'Study Notes', href: '/dashboard/notes', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { icon: Brain, label: 'Practice Quiz', href: '/dashboard/quiz', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { icon: Newspaper, label: 'Current Affairs', href: '/dashboard/current-affairs', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { icon: Video, label: 'Video Lectures', href: '/dashboard/videos', color: 'text-rose-400', bg: 'bg-rose-500/10' },
  { icon: PenTool, label: 'Answer Practice', href: '/dashboard/answer-practice', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { icon: Calendar, label: 'Study Planner', href: '/dashboard/planner', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
];

/* ═══════════════════════════════════════════════════════════════
   AI PERFORMANCE INSIGHTS
   ═══════════════════════════════════════════════════════════════ */

const insights = [
  {
    icon: CheckCircle2,
    title: 'Polity Mastery',
    description: 'Constitutional articles analysis shows 78% accuracy. Focus on Part III amendments for improvement.',
    color: 'green',
  },
  {
    icon: Activity,
    title: 'Economy Focus Needed',
    description: 'Your economic survey analysis needs work. Spend 30 min daily on macroeconomic indicators.',
    color: 'orange',
  },
  {
    icon: TrendingUp,
    title: 'Optimal Study Time',
    description: 'Your peak performance window is 6-9 AM. Schedule difficult topics during this period.',
    color: 'blue',
  },
];

/* ═══════════════════════════════════════════════════════════════
   BADGES
   ═══════════════════════════════════════════════════════════════ */

const badges = [
  { icon: Flame, label: 'Week Warrior', description: '7-day streak', earned: true, color: 'orange' },
  { icon: Trophy, label: 'Quiz Master', description: '100 quizzes done', earned: true, color: 'yellow' },
  { icon: Medal, label: 'Top Ranker', description: 'Top 100 rank', earned: false, color: 'blue' },
  { icon: Star, label: 'Scholar', description: '90% syllabus', earned: false, color: 'violet' },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD PAGE
   ═══════════════════════════════════════════════════════════════ */

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const firstName = user?.name?.split(' ')[0] || 'Aspirant';
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="flex flex-col gap-8">
      {/* ─── Header ─── */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-white">
            {greeting},{' '}
            <span className="text-gradient">{firstName}</span>
          </h1>
          <p className="text-white/40 mt-1">Your AI-orchestrated study plan is ready.</p>
        </div>
        <Link
          href="/dashboard/planner"
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          <Play className="w-4 h-4" />
          Start Session
        </Link>
      </header>

      {/* ─── Performance Analytics ─── */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-semibold text-white">Performance Analytics</h2>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/5">
            <button className="px-3 py-1 rounded-md text-xs font-medium text-white bg-white/10">Weekly</button>
            <button className="px-3 py-1 rounded-md text-xs font-medium text-white/40 hover:text-white/60 transition-colors">Monthly</button>
          </div>
        </div>

        <Suspense fallback={<StatsLoading />}>
          <DashboardStats />
        </Suspense>
      </section>

      {/* ─── AI Search ─── */}
      <div className="relative">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:border-white/10 transition-all group">
          <Sparkles className="w-5 h-5 text-blue-400 shrink-0" />
          <input
            className="flex-1 bg-transparent border-none text-white placeholder:text-white/30 text-base focus:outline-none"
            placeholder="Ask AI anything about UPSC..."
            type="text"
          />
          <button className="px-5 py-2 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
            Generate
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {['Generate Summary', 'Create Flashcards', 'Analyze Trends', 'PYQ Analysis'].map((label) => (
            <button
              key={label}
              className="px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05] text-xs text-white/40 hover:text-white/60 hover:bg-white/[0.05] transition-all"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Quick Actions Grid ─── */}
      <section>
        <h2 className="font-display text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-200"
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

      {/* ─── AI Performance Insights ─── */}
      <section>
        <h2 className="font-display text-lg font-semibold text-white mb-4">AI Performance Insights</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {insights.map((insight) => {
            const colorMap: Record<string, { bg: string; text: string; border: string }> = {
              green: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
              orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
              blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
            };
            const c = colorMap[insight.color];
            return (
              <div key={insight.title} className={`p-5 rounded-2xl bg-white/[0.03] border ${c.border} transition-all hover:bg-white/[0.05]`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center`}>
                    <insight.icon className={`w-4 h-4 ${c.text}`} />
                  </div>
                  <h3 className="text-sm font-semibold text-white">{insight.title}</h3>
                </div>
                <p className="text-sm text-white/50 leading-relaxed">{insight.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Gamification: Streak + Badges ─── */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Daily Streak */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-900/20 to-black border border-white/[0.05]">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-white">Daily Streak</h3>
              <p className="text-xs text-white/30">Keep your streak alive!</p>
            </div>
            <div className="ml-auto">
              <p className="text-3xl font-display font-bold text-orange-400">12</p>
              <p className="text-[10px] text-white/30 text-right uppercase tracking-wider">Days</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  i < 5 ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-white/20'
                }`}>
                  {i < 5 ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs">-</span>}
                </div>
                <span className="text-[10px] text-white/30 font-medium">{day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-white">Badges & Achievements</h3>
                <p className="text-xs text-white/30">2 of 4 earned</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {badges.map((badge) => {
              const colorMap: Record<string, string> = {
                orange: 'text-orange-400 bg-orange-500/10',
                yellow: 'text-yellow-400 bg-yellow-500/10',
                blue: 'text-blue-400 bg-blue-500/10',
                violet: 'text-violet-400 bg-violet-500/10',
              };
              return (
                <div key={badge.label} className={`flex flex-col items-center gap-2 p-3 rounded-xl ${badge.earned ? '' : 'opacity-30'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[badge.color]}`}>
                    <badge.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] text-white/60 text-center font-medium leading-tight">{badge.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Two-column: Recent Activity + AI Mentor ─── */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Recent Activity */}
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-semibold text-white">Recent Activity</h3>
            <Link href="/dashboard/notes" className="text-xs text-blue-400 hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {[
              { icon: FileText, label: 'Indian Polity Notes', time: '2h ago', color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { icon: Brain, label: 'History Mock Test', time: '5h ago', color: 'text-violet-400', bg: 'bg-violet-500/10' },
              { icon: TrendingUp, label: 'Economy Analysis', time: 'Yesterday', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center`}>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.label}</p>
                  <p className="text-xs text-white/30">{item.time}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-white/20" />
              </div>
            ))}
          </div>
        </div>

        {/* AI Mentor */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-900/20 to-black border border-white/[0.05]">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.15)]">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-white">Chanakya AI Mentor</h3>
              <p className="text-xs text-white/30">Your personal UPSC guide</p>
            </div>
          </div>
          <div className="space-y-3 mb-4">
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-white/70 leading-relaxed">
                Based on your progress, I recommend focusing on <span className="text-blue-400 font-medium">Indian Economy</span> today.
                You&apos;ve covered 60% of Polity but only 25% of Economy.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/mentor"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 hover:scale-105 active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Chat with Chanakya AI
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
        <div key={i} className="h-36 rounded-2xl bg-white/[0.03] border border-white/[0.05] animate-pulse" />
      ))}
    </div>
  );
}
