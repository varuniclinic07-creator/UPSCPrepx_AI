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
  Rocket,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/auth-config';

export const metadata = {
  title: 'Dashboard',
};

/* ═══════════════════════════════════════════════════════════════
   TYPES & DATA FETCHERS — real DB, honest zero-state
   ═══════════════════════════════════════════════════════════════ */

type DashboardData = {
  studyHours: number;
  mockAverage: number | null;
  mockCount: number;
  syllabusProgress: number;
  rank: number | null;
  studyStreak: number;
  bestStreak: number;
  weekDays: boolean[]; // Mon-Sun completion
  isFreshUser: boolean;
  recentActivity: ActivityItem[];
  earnedBadges: string[];
  mentorTip: string | null;
};

type ActivityItem = {
  id: string;
  kind: 'note' | 'quiz' | 'ca' | 'video' | 'practice';
  label: string;
  timeLabel: string;
  href: string;
};

async function fetchDashboardData(): Promise<DashboardData> {
  const empty: DashboardData = {
    studyHours: 0,
    mockAverage: null,
    mockCount: 0,
    syllabusProgress: 0,
    rank: null,
    studyStreak: 0,
    bestStreak: 0,
    weekDays: [false, false, false, false, false, false, false],
    isFreshUser: true,
    recentActivity: [],
    earnedBadges: [],
    mentorTip: null,
  };

  try {
    const { createServerSupabaseClient } = await import('@/lib/supabase/server');
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return empty;

    const db = supabase as any;
    const [progressRes, quizRes, notesRes, activityRes] = await Promise.allSettled([
      db
        .from('user_progress')
        .select('syllabus_coverage, study_streak, best_streak, total_study_hours, last_active_dates, rank_estimate')
        .eq('user_id', authUser.id)
        .single(),
      db
        .from('quizzes')
        .select('score')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(10),
      db
        .from('notes')
        .select('id, title, created_at')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(3),
      db
        .from('user_activity')
        .select('id, activity_type, title, created_at, href')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const data: DashboardData = { ...empty };

    if (progressRes.status === 'fulfilled' && progressRes.value.data) {
      const p = progressRes.value.data;
      data.syllabusProgress = Number(p.syllabus_coverage) || 0;
      data.studyStreak = Number(p.study_streak) || 0;
      data.bestStreak = Number(p.best_streak) || 0;
      data.studyHours = Number(p.total_study_hours) || 0;
      data.rank = p.rank_estimate ? Number(p.rank_estimate) : null;

      // Compute week-day completion from last_active_dates (ISO date strings)
      if (Array.isArray(p.last_active_dates)) {
        const now = new Date();
        const monday = new Date(now);
        monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
        monday.setHours(0, 0, 0, 0);
        const activeSet = new Set(p.last_active_dates as string[]);
        data.weekDays = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          return activeSet.has(d.toISOString().slice(0, 10));
        });
      }
    }

    if (quizRes.status === 'fulfilled' && quizRes.value.data?.length) {
      const scores = (quizRes.value.data as any[])
        .map((q) => Number(q.score))
        .filter((n) => !Number.isNaN(n) && n > 0);
      data.mockCount = scores.length;
      if (scores.length > 0) {
        data.mockAverage = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      }
    }

    // Activity fallback: use notes if user_activity table empty
    if (activityRes.status === 'fulfilled' && activityRes.value.data?.length) {
      data.recentActivity = (activityRes.value.data as any[]).map((r) => ({
        id: String(r.id),
        kind: mapActivityKind(r.activity_type),
        label: r.title ?? 'Activity',
        timeLabel: formatRelativeTime(r.created_at),
        href: r.href ?? '/dashboard',
      }));
    } else if (notesRes.status === 'fulfilled' && notesRes.value.data?.length) {
      data.recentActivity = (notesRes.value.data as any[]).map((n) => ({
        id: String(n.id),
        kind: 'note' as const,
        label: n.title ?? 'Untitled note',
        timeLabel: formatRelativeTime(n.created_at),
        href: `/dashboard/notes/${n.id}`,
      }));
    }

    // Badge earning rules — all real, no hardcoded earned:true
    if (data.studyStreak >= 7) data.earnedBadges.push('week-warrior');
    if (data.mockCount >= 100) data.earnedBadges.push('quiz-master');
    if (data.rank !== null && data.rank <= 100) data.earnedBadges.push('top-ranker');
    if (data.syllabusProgress >= 90) data.earnedBadges.push('scholar');

    // Fresh user detection — zero of everything
    data.isFreshUser =
      data.studyHours === 0 &&
      data.mockCount === 0 &&
      data.syllabusProgress === 0 &&
      data.recentActivity.length === 0;

    // Mentor tip only when we have real signal
    if (!data.isFreshUser) {
      if (data.syllabusProgress > 0 && data.syllabusProgress < 40) {
        data.mentorTip = `You've covered ${data.syllabusProgress}% of the syllabus. Let's focus on building foundations — try today's Polity notes.`;
      } else if (data.mockAverage !== null && data.mockAverage < 100) {
        data.mentorTip = `Your mock average is ${data.mockAverage}/200. A focused PYQ analysis session could lift this quickly.`;
      } else if (data.studyStreak >= 3) {
        data.mentorTip = `${data.studyStreak}-day streak — momentum is on your side. Keep it going with a revision round today.`;
      }
    }

    return data;
  } catch (error) {
    console.warn('[Dashboard] Fetch error (returning empty state):', error);
    return empty;
  }
}

function mapActivityKind(t: string): ActivityItem['kind'] {
  switch (t) {
    case 'quiz_completed':
    case 'quiz':
      return 'quiz';
    case 'ca_read':
    case 'current_affairs':
      return 'ca';
    case 'video_watched':
    case 'lecture':
      return 'video';
    case 'answer_practice':
      return 'practice';
    default:
      return 'note';
  }
}

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/* ═══════════════════════════════════════════════════════════════
   STAT CARDS — honest display, no fake deltas
   ═══════════════════════════════════════════════════════════════ */

function DashboardStats({ data }: { data: DashboardData }) {
  const statCards = [
    {
      icon: Clock,
      label: 'Study Hours',
      value: data.studyHours > 0 ? `${data.studyHours}h` : '—',
      sub: data.studyHours > 0 ? 'Total recorded' : 'Start your first session',
      color: 'blue',
    },
    {
      icon: Target,
      label: 'Mock Score Avg',
      value: data.mockAverage !== null ? `${data.mockAverage}/200` : '—',
      sub: data.mockCount > 0 ? `Across ${data.mockCount} mock${data.mockCount === 1 ? '' : 's'}` : 'Take your first mock',
      color: 'green',
    },
    {
      icon: BookOpen,
      label: 'Syllabus Covered',
      value: `${data.syllabusProgress}%`,
      sub: data.syllabusProgress > 0 ? 'Tracked via notes & quizzes' : 'Begin a chapter to track',
      color: 'violet',
    },
    {
      icon: BarChart3,
      label: 'Current Rank',
      value: data.rank !== null ? `#${data.rank.toLocaleString('en-IN')}` : 'Unranked',
      sub: data.rank !== null ? 'All-India estimate' : 'Rank unlocks after 3 mocks',
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
          <div key={card.label} className="stat-card group">
            <div className="stat-card-glow" style={{ background: c.glow }} />
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${c.text}`} />
              </div>
            </div>
            <p className="text-2xl font-display font-bold text-white">{card.value}</p>
            <p className="text-sm text-white/40 mt-1">{card.label}</p>
            <p className="text-[11px] text-white/30 mt-1.5 leading-snug">{card.sub}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   QUICK ACTIONS — static links, no fake progress
   ═══════════════════════════════════════════════════════════════ */

const quickActions = [
  { icon: BookOpen, label: 'Study Notes', href: '/dashboard/notes', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { icon: Brain, label: 'Practice Quiz', href: '/dashboard/quiz', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { icon: Newspaper, label: 'Current Affairs', href: '/dashboard/current-affairs', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { icon: Video, label: 'Video Lectures', href: '/dashboard/lectures', color: 'text-rose-400', bg: 'bg-rose-500/10' },
  { icon: PenTool, label: 'Answer Practice', href: '/dashboard/answer-practice', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { icon: Calendar, label: 'Study Planner', href: '/dashboard/planner', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
];

/* ═══════════════════════════════════════════════════════════════
   BADGES — definitions, earned-state driven by real DB
   ═══════════════════════════════════════════════════════════════ */

const BADGE_DEFS = [
  { id: 'week-warrior', icon: Flame, label: 'Week Warrior', description: '7-day streak', color: 'orange' },
  { id: 'quiz-master', icon: Trophy, label: 'Quiz Master', description: '100 quizzes done', color: 'yellow' },
  { id: 'top-ranker', icon: Medal, label: 'Top Ranker', description: 'Top 100 rank', color: 'blue' },
  { id: 'scholar', icon: Star, label: 'Scholar', description: '90% syllabus', color: 'violet' },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD PAGE
   ═══════════════════════════════════════════════════════════════ */

export default async function DashboardPage() {
  const [user, data] = await Promise.all([getCurrentUser(), fetchDashboardData()]);
  const firstName = user?.name?.split(' ')[0] || 'Aspirant';
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'Good Morning' : currentHour < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="flex flex-col gap-8">
      {/* ─── Header ─── */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-white">
            {greeting}, <span className="text-gradient">{firstName}</span>
          </h1>
          <p className="text-white/40 mt-1">
            {data.isFreshUser
              ? 'Welcome to Chanakya AI. Let\u2019s begin your UPSC journey.'
              : 'Your AI-orchestrated study plan is ready.'}
          </p>
        </div>
        <Link
          href={data.isFreshUser ? '/dashboard/onboarding' : '/dashboard/planner'}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          {data.isFreshUser ? <Rocket className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {data.isFreshUser ? 'Start Onboarding' : 'Start Session'}
        </Link>
      </header>

      {/* ─── Fresh-user welcome banner ─── */}
      {data.isFreshUser && (
        <section className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-br from-blue-950/40 via-black to-orange-950/30 p-6 md:p-8">
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
          <div className="relative grid md:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/60 mb-3">
                <Sparkles className="w-3 h-3 text-blue-400" />
                New here
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-2">
                A blank slate. A 2-year plan. One AI mentor.
              </h2>
              <p className="text-sm text-white/50 max-w-xl leading-relaxed">
                No fake streaks, no borrowed ranks. Everything you see here is yours — built from your
                study sessions, your mocks, your notes. Let\u2019s start with the basics.
              </p>
            </div>
            <div className="flex flex-col gap-2 md:items-end">
              <Link
                href="/dashboard/notes/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all"
              >
                <FileText className="w-4 h-4" />
                Generate your first notes
              </Link>
              <Link
                href="/dashboard/current-affairs"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 text-white/70 text-sm hover:bg-white/5 transition-all"
              >
                <Newspaper className="w-4 h-4" />
                Today\u2019s current affairs
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── Performance Analytics ─── */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-semibold text-white">Performance Analytics</h2>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/5">
            <button className="px-3 py-1 rounded-md text-xs font-medium text-white bg-white/10">Weekly</button>
            <button className="px-3 py-1 rounded-md text-xs font-medium text-white/40 hover:text-white/60 transition-colors">
              Monthly
            </button>
          </div>
        </div>

        <Suspense fallback={<StatsLoading />}>
          <DashboardStats data={data} />
        </Suspense>
      </section>

      {/* ─── AI Search ─── */}
      <form action="/dashboard/search" method="GET" className="relative">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:border-white/10 transition-all group">
          <Sparkles className="w-5 h-5 text-blue-400 shrink-0" />
          <input
            name="q"
            className="flex-1 bg-transparent border-none text-white placeholder:text-white/30 text-base focus:outline-none"
            placeholder="Ask AI anything about UPSC..."
            type="text"
          />
          <button
            type="submit"
            className="px-5 py-2 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            Generate
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            { label: 'Generate Summary', q: 'Summarize today\u2019s Indian Express editorials' },
            { label: 'Create Flashcards', q: 'Flashcards on Fundamental Rights' },
            { label: 'Analyze Trends', q: 'PYQ trends in Indian Polity last 10 years' },
            { label: 'PYQ Analysis', q: 'Prelims 2023 Economy PYQ walkthrough' },
          ].map(({ label, q }) => (
            <Link
              key={label}
              href={`/dashboard/search?q=${encodeURIComponent(q)}`}
              className="px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05] text-xs text-white/40 hover:text-white/60 hover:bg-white/[0.05] transition-all"
            >
              {label}
            </Link>
          ))}
        </div>
      </form>

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
              <p className="text-xs text-white/30">
                {data.studyStreak > 0 ? 'Keep your streak alive!' : 'Study today to start a streak.'}
              </p>
            </div>
            <div className="ml-auto">
              <p className="text-3xl font-display font-bold text-orange-400">{data.studyStreak}</p>
              <p className="text-[10px] text-white/30 text-right uppercase tracking-wider">
                {data.studyStreak === 1 ? 'Day' : 'Days'}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
              const done = data.weekDays[i];
              return (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      done ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-white/20'
                    }`}
                  >
                    {done ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs">–</span>}
                  </div>
                  <span className="text-[10px] text-white/30 font-medium">{day}</span>
                </div>
              );
            })}
          </div>
          {data.bestStreak > data.studyStreak && (
            <p className="text-[11px] text-white/30 mt-4">Best streak: {data.bestStreak} days</p>
          )}
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
                <p className="text-xs text-white/30">
                  {data.earnedBadges.length} of {BADGE_DEFS.length} earned
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {BADGE_DEFS.map((badge) => {
              const earned = data.earnedBadges.includes(badge.id);
              const colorMap: Record<string, string> = {
                orange: 'text-orange-400 bg-orange-500/10',
                yellow: 'text-yellow-400 bg-yellow-500/10',
                blue: 'text-blue-400 bg-blue-500/10',
                violet: 'text-violet-400 bg-violet-500/10',
              };
              return (
                <div
                  key={badge.id}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl ${earned ? '' : 'opacity-30'}`}
                  title={earned ? `${badge.label} — earned` : `Locked: ${badge.description}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[badge.color]}`}>
                    <badge.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] text-white/60 text-center font-medium leading-tight">
                    {badge.label}
                  </span>
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
            {data.recentActivity.length > 0 && (
              <Link href="/dashboard/progress" className="text-xs text-blue-400 hover:underline">
                View all
              </Link>
            )}
          </div>

          {data.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {data.recentActivity.map((item) => {
                const kindStyle: Record<ActivityItem['kind'], { icon: typeof FileText; color: string; bg: string }> = {
                  note: { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                  quiz: { icon: Brain, color: 'text-violet-400', bg: 'bg-violet-500/10' },
                  ca: { icon: Newspaper, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                  video: { icon: Video, color: 'text-rose-400', bg: 'bg-rose-500/10' },
                  practice: { icon: PenTool, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                };
                const s = kindStyle[item.kind];
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors"
                  >
                    <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}>
                      <s.icon className={`w-4 h-4 ${s.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.label}</p>
                      <p className="text-xs text-white/30">{item.timeLabel}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/20" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center text-center py-8 gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
                <Activity className="w-5 h-5 text-white/30" />
              </div>
              <p className="text-sm text-white/50 max-w-xs">
                Nothing here yet. Your notes, quizzes, and current-affairs reads will appear as you study.
              </p>
              <Link
                href="/dashboard/notes/new"
                className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                Create your first note <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
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
                {data.mentorTip ??
                  (data.isFreshUser
                    ? 'Welcome. I\u2019ll shape a study plan the moment you generate your first notes or attempt a mock. Pick a subject below to begin.'
                    : 'Share what you\u2019re working on today and I\u2019ll tailor your next step. Ask me anything — syllabus, strategy, or subject doubts.')}
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

      {/* ─── AI Performance Insights — only when we have real data ─── */}
      {!data.isFreshUser && data.mockCount > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold text-white mb-4">AI Performance Insights</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <InsightCard
              icon={CheckCircle2}
              color="green"
              title="Syllabus Momentum"
              description={`You\u2019ve tracked ${data.syllabusProgress}% coverage. Next logical chapter will be recommended based on your weak areas.`}
            />
            <InsightCard
              icon={Target}
              color="orange"
              title="Mock Score"
              description={`Your average across ${data.mockCount} mock${data.mockCount === 1 ? '' : 's'} is ${data.mockAverage}/200. Review incorrect answers to lift your ceiling.`}
            />
            <InsightCard
              icon={TrendingUp}
              color="blue"
              title="Streak"
              description={
                data.studyStreak > 0
                  ? `You\u2019re on a ${data.studyStreak}-day run. Consistency compounds — keep going.`
                  : 'Rebuild momentum with a short session today. Even 20 minutes counts.'
              }
            />
          </div>
        </section>
      )}
    </div>
  );
}

function InsightCard({
  icon: Icon,
  color,
  title,
  description,
}: {
  icon: typeof CheckCircle2;
  color: 'green' | 'orange' | 'blue';
  title: string;
  description: string;
}) {
  const map = {
    green: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  }[color];
  return (
    <div className={`p-5 rounded-2xl bg-white/[0.03] border ${map.border} transition-all hover:bg-white/[0.05]`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl ${map.bg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${map.text}`} />
        </div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <p className="text-sm text-white/50 leading-relaxed">{description}</p>
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
