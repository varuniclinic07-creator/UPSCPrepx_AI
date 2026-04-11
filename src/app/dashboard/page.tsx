import { Suspense } from 'react';
import Link from 'next/link';

// Force dynamic rendering to avoid static generation errors with Server Components
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
  CheckCircle2,
  Play,
  FileText,
  Zap,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/auth-config';
import { BentoGrid, BentoCard, BentoCardLarge } from '@/components/magic-ui/bento-grid';
import { StatCard, ProgressStatCard } from '@/components/magic-ui/stat-card';
import { ShimmerButton } from '@/components/magic-ui/shimmer-button';
import { BorderBeamInput } from '@/components/magic-ui/border-beam';

export const metadata = {
  title: 'Dashboard',
};

async function DashboardStats() {
  // In production, fetch real stats from the database
  const stats = {
    syllabusProgress: 34,
    totalSyllabus: 100,
    studyStreak: 12,
    bestStreak: 24,
    studyHours: 142,
    weeklyChange: 12,
    mockAverage: 78,
    mockRank: 'Top 10%',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <ProgressStatCard
        title="Syllabus Completed"
        value={stats.syllabusProgress}
        total={stats.totalSyllabus}
        icon={BookOpen}
        glowColor="hsl(var(--primary))"
      />

      <StatCard
        title="Current Streak"
        value={stats.studyStreak}
        subtitle="Days"
        icon={Flame}
        trend={{ value: 'Keep it up!', direction: 'up' }}
        glowColor="hsl(32, 100%, 50%)"
      >
        <p className="text-xs text-muted-foreground mt-3">Best: {stats.bestStreak} Days</p>
      </StatCard>

      <StatCard
        title="Study Hours"
        value={`${stats.studyHours}h`}
        icon={Clock}
        trend={{ value: `▲ ${stats.weeklyChange}h`, direction: 'up' }}
        glowColor="hsl(var(--secondary))"
      >
        <p className="text-xs text-muted-foreground mt-3">This week</p>
      </StatCard>

      <StatCard
        title="Mock Average"
        value={`${stats.mockAverage}%`}
        icon={Target}
        trend={{ value: stats.mockRank, direction: 'up' }}
        glowColor="hsl(263, 70%, 50%)"
      >
        <p className="text-xs text-muted-foreground mt-3">Last 5 Tests</p>
      </StatCard>
    </div>
  );
}

function AISearchInput() {
  return (
    <BorderBeamInput className="w-full">
      <div className="relative flex items-center w-full h-16 lg:h-20 bg-card rounded-2xl border border-border/50 shadow-lg focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all overflow-hidden">
        <div className="pl-6 pr-4 text-muted-foreground">
          <Sparkles className="w-6 h-6" />
        </div>
        <input
          className="w-full h-full bg-transparent border-none focus:ring-0 focus:outline-none text-foreground placeholder:text-muted-foreground text-lg font-medium"
          placeholder="Ask AI anything about UPSC (e.g., India's Foreign Policy)..."
          type="text"
        />
        <div className="pr-3">
          <ShimmerButton className="h-10 lg:h-12 px-6 text-sm">
            Generate
            <ArrowRight className="w-4 h-4 ml-2" />
          </ShimmerButton>
        </div>
      </div>
    </BorderBeamInput>
  );
}

function QuickActionChips() {
  const chips = [
    { icon: FileText, label: 'Generate Summary', color: 'primary' },
    { icon: Brain, label: 'Create Flashcards', color: 'secondary' },
    { icon: Calendar, label: 'Extract Timeline', color: 'accent' },
    { icon: TrendingUp, label: 'Analyze Trends', color: 'accent' },
  ];

  return (
    <div className="flex flex-wrap gap-3 mt-6">
      {chips.map((chip) => (
        <button
          key={chip.label}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 hover:bg-muted border border-border/50 hover:border-primary/30 transition-all text-sm text-muted-foreground hover:text-foreground group"
        >
          <chip.icon className="w-4 h-4 text-primary/70 group-hover:text-primary" />
          {chip.label}
        </button>
      ))}
    </div>
  );
}

function MainBentoGrid() {
  return (
    <BentoGrid className="grid-cols-1 md:grid-cols-3 auto-rows-[minmax(200px,auto)]">
      {/* Large Card: Smart Study Notes */}
      <BentoCardLarge
        title="Smart Study Notes"
        description="Indian Polity - Chapter 4: Preamble of the Constitution. Summarized with key case laws."
        icon={BookOpen}
        badge={{ text: 'AI Generated', variant: 'primary' }}
        glowColor="hsl(var(--primary))"
        className="p-8"
      >
        <div className="bg-muted/30 backdrop-blur-sm rounded-xl p-4 border border-border/50 mt-4 group-hover:border-primary/20 transition-colors">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h4 className="text-foreground font-semibold">Key Concepts Extracted</h4>
              <p className="text-xs text-muted-foreground">Sovereign, Socialist, Secular, Democratic, Republic</p>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <span className="text-[10px] bg-muted/50 text-muted-foreground px-2 py-1 rounded-md">Kesavananda Bharati Case</span>
            <span className="text-[10px] bg-muted/50 text-muted-foreground px-2 py-1 rounded-md">42nd Amendment</span>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <Link href="/dashboard/notes/latest">
            <ShimmerButton className="px-5 py-2.5 text-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              View Notes
            </ShimmerButton>
          </Link>
          <button className="px-5 py-2.5 rounded-full bg-muted/50 text-foreground text-sm font-medium hover:bg-muted transition-all">
            Regenerate
          </button>
        </div>
      </BentoCardLarge>

      {/* Tall Card: Daily Quiz */}
      <div className="md:row-span-2 bento-card bg-gradient-to-b from-secondary/10 to-card p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-foreground">Daily Quiz</h3>
          <span className="badge badge-primary">History</span>
        </div>

        {/* Score Circle */}
        <div className="flex-1 flex flex-col items-center justify-center my-4">
          <div className="relative w-32 h-32 mb-4">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                className="text-muted/30"
                cx="50" cy="50" r="40"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
              />
              <circle
                className="text-primary"
                cx="50" cy="50" r="40"
                fill="transparent"
                stroke="currentColor"
                strokeDasharray="251.2"
                strokeDashoffset="30"
                strokeLinecap="round"
                strokeWidth="8"
              />
            </svg>
            <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-foreground">88</span>
              <span className="text-xs text-muted-foreground">Score</span>
            </div>
          </div>
          <p className="text-foreground text-lg font-medium mb-1">Excellent!</p>
          <p className="text-muted-foreground text-sm">You're in the top 5% today.</p>
        </div>

        <div className="space-y-3 mt-auto">
          <Link href="/dashboard/quiz/history-5" className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border/50">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold text-xs">H</div>
            <div className="flex-1">
              <p className="text-sm text-foreground font-medium">History Mock #5</p>
              <p className="text-[10px] text-muted-foreground">20 Questions • 30 Mins</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </Link>
          <Link href="/dashboard/quiz/new">
            <ShimmerButton className="w-full py-3 text-sm">
              <Play className="w-4 h-4 mr-2" />
              Start New Quiz
            </ShimmerButton>
          </Link>
        </div>
      </div>

      {/* Medium Card: Current Affairs */}
      <BentoCard
        title="Current Affairs"
        icon={Newspaper}
        glowColor="hsl(var(--secondary))"
        className="relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary via-accent to-primary" />
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-muted-foreground">Today, Jan 15</span>
        </div>
        <div className="space-y-4">
          <Link href="/dashboard/current-affairs/1" className="flex gap-4 items-start group/item cursor-pointer">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-1 block">Economy</span>
              <h4 className="text-foreground text-sm font-medium leading-snug group-hover/item:text-primary transition-colors">
                RBI releases new guidelines for digital lending apps.
              </h4>
            </div>
          </Link>
          <div className="w-full h-px bg-border/50" />
          <Link href="/dashboard/current-affairs/2" className="flex gap-4 items-start group/item cursor-pointer">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider mb-1 block">Environment</span>
              <h4 className="text-foreground text-sm font-medium leading-snug group-hover/item:text-primary transition-colors">
                India's new tiger census shows positive growth trend.
              </h4>
            </div>
          </Link>
        </div>
      </BentoCard>

      {/* AI Assistant Card */}
      <BentoCard
        title="Stuck on a topic?"
        description="Ask your personalized AI tutor for instant clarification."
        icon={Brain}
        glowColor="hsl(var(--accent))"
        className="flex flex-col items-center text-center justify-center"
      >
        <div className="relative w-full mt-4">
          <input
            className="w-full bg-muted/30 text-foreground text-sm rounded-full py-3 px-4 pl-10 border border-border/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            placeholder="Ask anything..."
            type="text"
          />
          <Sparkles className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <button className="absolute right-1 top-1 bg-primary text-primary-foreground p-2 rounded-full w-8 h-8 flex items-center justify-center hover:scale-105 transition-transform">
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </BentoCard>
    </BentoGrid>
  );
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const firstName = user?.name?.split(' ')[0] || 'Aspirant';
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="flex flex-col gap-8 animate-slide-down">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl md:text-4xl font-light text-foreground tracking-tight">
            {greeting}, <span className="font-bold text-gradient">{firstName}</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg font-light">
            Your daily AI-orchestrated study plan is ready.
          </p>
        </div>
        <Link href="/dashboard/planner">
          <ShimmerButton className="px-6 py-3 text-sm">
            <Play className="w-4 h-4 mr-2" />
            Start Session
          </ShimmerButton>
        </Link>
      </header>

      {/* Stats Overview */}
      <Suspense fallback={<StatsLoading />}>
        <DashboardStats />
      </Suspense>

      {/* AI Search Section */}
      <section className="space-y-2">
        <AISearchInput />
        <QuickActionChips />
      </section>

      {/* Main Bento Grid */}
      <MainBentoGrid />
    </div>
  );
}

function StatsLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="stat-card shimmer h-40" />
      ))}
    </div>
  );
}