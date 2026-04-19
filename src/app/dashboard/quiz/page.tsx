import { Suspense } from 'react';
import Link from 'next/link';

// Force dynamic rendering to avoid static generation errors with Server Components
export const dynamic = 'force-dynamic';
import { Brain, Clock, Trophy, CheckCircle, Play, Flame, Target, ArrowRight, Zap, BookOpen, History, Globe } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/auth-config';
import { getQuizzesByUser, getUserQuizStats } from '@/lib/services/quiz-service';
import { StatCard } from '@/components/magic-ui/stat-card';
import { BentoGrid } from '@/components/magic-ui/bento-grid';
import { ShimmerButton } from '@/components/magic-ui/shimmer-button';
import { QuickGenerate } from '@/components/living-content/quick-generate';
import { DriftingOrbs, MotionReveal, PulseDot } from '@/components/brand/animated-backdrop';
import type { Quiz } from '@/types';

export const metadata = {
  title: 'Practice Quiz',
};

async function QuizList({ subject, difficulty }: { subject: string; difficulty: string }) {
  const user = await getCurrentUser();

  if (!user) {
    return <div>Please login to view quizzes</div>;
  }

  let quizzes: Quiz[] = [];
  try {
    quizzes = await getQuizzesByUser(user.id);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    quizzes = [];
  }

  if (subject && subject !== 'All') {
    quizzes = quizzes.filter((q) => q.subject?.toLowerCase() === subject.toLowerCase());
  }
  if (difficulty && difficulty !== 'All') {
    quizzes = quizzes.filter((q) =>
      q.questions?.some((qq) => qq.difficulty?.toLowerCase() === difficulty.toLowerCase()),
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.05] text-center p-12">
        <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
          <Brain className="w-8 h-8 text-violet-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No quizzes yet</h3>
        <p className="text-white/40 mb-6 max-w-sm mx-auto">
          Generate your first AI-powered quiz to test your UPSC knowledge
        </p>
        <Link href="/dashboard/quiz/new">
          <ShimmerButton className="px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-white/90 hover:scale-105 active:scale-95 transition-all">
            <Zap className="w-4 h-4 mr-2" />
            Generate Quiz
          </ShimmerButton>
        </Link>
      </div>
    );
  }

  const categoryIcons: Record<string, typeof Brain> = {
    'Polity': Target,
    'Economy': Globe,
    'History': History,
    'Geography': Globe,
    'Science': Zap,
  };

  const categoryColors: Record<string, string> = {
    'Polity': 'primary',
    'Economy': 'secondary',
    'History': 'accent',
    'Geography': 'success',
    'Science': 'warning',
  };

  return (
    <BentoGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {quizzes.map((quiz) => {
        const questionsCount = quiz.questions?.length || quiz.totalQuestions || 0;
        const Icon = categoryIcons[quiz.subject] || Brain;
        const color = categoryColors[quiz.subject] || 'primary';

        return (
          <Link key={quiz.id} href={`/dashboard/quiz/${quiz.id}`}>
            <div className="group relative flex flex-col justify-between p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.05] transition-all duration-500 overflow-hidden cursor-pointer h-full min-h-[200px]">
              {/* Glow */}
              <div className={`absolute -right-12 -top-12 w-24 h-24 bg-${color}/20 rounded-full blur-[50px] group-hover:bg-${color}/30 transition-all duration-500`} />

              <div className="flex flex-col gap-4 z-10">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/[0.05] text-white/40 group-hover:text-blue-400 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`badge badge-${color}`}>
                    {quiz.subject}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors line-clamp-2">
                    {quiz.topic}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-white/40 mt-2">
                    <span className="flex items-center gap-1">
                      <Brain className="w-4 h-4" />
                      {questionsCount} Q
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {quiz.timeLimit || questionsCount * 2} min
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/[0.05] flex justify-between items-center z-10">
                <span className="text-xs text-white/40 font-medium">Start quiz</span>
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                  <Play className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </BentoGrid>
  );
}

async function QuizStats() {
  const user = await getCurrentUser();
  if (!user) return null;

  let stats = { totalAttempts: 0, averageScore: 0, passRate: 0, totalTimeTaken: 0 };
  let bestSubject = '—';
  try {
    stats = await getUserQuizStats(user.id);
    // Derive best-performing subject from recent quizzes when there's data.
    const quizzes = await getQuizzesByUser(user.id);
    if (quizzes.length > 0) {
      const bySubject: Record<string, number> = {};
      for (const q of quizzes) bySubject[q.subject] = (bySubject[q.subject] || 0) + 1;
      bestSubject =
        Object.entries(bySubject).sort(([, a], [, b]) => b - a)[0]?.[0] ?? '—';
    }
  } catch (err) {
    console.error('[quiz] stats fetch failed:', err);
  }

  const isFresh = stats.totalAttempts === 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Quizzes Taken"
        value={stats.totalAttempts}
        icon={Brain}
        glowColor="hsl(var(--accent))"
      />
      <StatCard
        title="Average Score"
        value={isFresh ? '—' : `${stats.averageScore}%`}
        icon={Trophy}
        glowColor="hsl(142, 76%, 36%)"
      />
      <StatCard
        title={isFresh ? 'Most Practiced' : 'Most Practiced'}
        value={bestSubject}
        icon={CheckCircle}
        glowColor="hsl(var(--primary))"
      />
      <StatCard
        title="Pass Rate"
        value={isFresh ? '—' : `${stats.passRate}%`}
        subtitle={isFresh ? 'take a quiz to start' : 'all attempts'}
        icon={Flame}
        glowColor="hsl(32, 100%, 50%)"
      />
    </div>
  );
}

function CategorySelector({ active }: { active: string }) {
  const categories = [
    { icon: BookOpen, label: 'All', slug: 'All' },
    { icon: Target, label: 'Polity', slug: 'Polity' },
    { icon: Globe, label: 'Economy', slug: 'Economy' },
    { icon: History, label: 'History', slug: 'History' },
    { icon: Globe, label: 'Geography', slug: 'Geography' },
    { icon: Zap, label: 'Science', slug: 'Science' },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {categories.map((cat) => {
        const isActive = active === cat.slug || (cat.slug === 'All' && !active);
        const href =
          cat.slug === 'All'
            ? '/dashboard/quiz'
            : `/dashboard/quiz?subject=${encodeURIComponent(cat.slug)}`;
        return (
          <Link
            key={cat.label}
            href={href}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all text-sm font-medium ${
              isActive
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]'
                : 'bg-white/5 text-white/40 hover:text-white border border-white/[0.05] hover:border-white/[0.1]'
            }`}
          >
            <cat.icon className="w-4 h-4" />
            {cat.label}
          </Link>
        );
      })}
    </div>
  );
}

function DifficultySelector({ active, subject }: { active: string; subject: string }) {
  const difficulties = [
    { label: 'All', slug: 'All' },
    { label: 'Easy', slug: 'easy', color: 'text-green-500' },
    { label: 'Medium', slug: 'medium', color: 'text-amber-500' },
    { label: 'Hard', slug: 'hard', color: 'text-red-500' },
  ];

  return (
    <div className="flex gap-2">
      {difficulties.map((diff) => {
        const isActive = active === diff.slug || (diff.slug === 'All' && !active);
        const params = new URLSearchParams();
        if (subject && subject !== 'All') params.set('subject', subject);
        if (diff.slug !== 'All') params.set('difficulty', diff.slug);
        const href = `/dashboard/quiz${params.toString() ? `?${params.toString()}` : ''}`;
        return (
          <Link
            key={diff.label}
            href={href}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              isActive
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                : `bg-white/[0.03] text-white/40 hover:text-white border border-white/[0.05] hover:border-white/[0.1] ${diff.color || ''}`
            }`}
          >
            {diff.label}
          </Link>
        );
      })}
    </div>
  );
}

type QuizSearchParams = { subject?: string; difficulty?: string };

export default async function QuizPage({
  searchParams,
}: {
  searchParams: Promise<QuizSearchParams>;
}) {
  const resolved = await searchParams;
  const subject = (resolved.subject ?? 'All').trim();
  const difficulty = (resolved.difficulty ?? 'All').trim();

  return (
    <div className="relative flex flex-col gap-8 animate-slide-down">
      {/* Animated backdrop for the hero — drifting orbs, respects prefers-reduced-motion */}
      <div className="relative">
        <DriftingOrbs palette={['rgba(139,92,246,0.22)', 'rgba(59,130,246,0.22)']} />
        <MotionReveal>
          <header className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div className="flex flex-col gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 self-start w-fit">
                <PulseDot color="bg-violet-400" />
                <span className="text-violet-400 text-xs font-bold uppercase tracking-wider">
                  Adaptive Quiz Engine
                </span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-light text-white leading-[1.1] tracking-tight">
                Practice <span className="font-bold text-gradient">Quiz</span>
              </h1>
              <p className="text-lg text-white/40 font-light max-w-xl">
                Test your knowledge with AI-generated UPSC-style questions. Every attempt updates
                your mastery map.
              </p>
            </div>
            <Link href="/dashboard/quiz/new">
              <ShimmerButton className="px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-white/90 hover:scale-105 active:scale-95 transition-all text-sm">
                <Play className="w-4 h-4 mr-2" />
                Start New Quiz
              </ShimmerButton>
            </Link>
          </header>
        </MotionReveal>
      </div>

      <MotionReveal delay={0.08}>
        <QuickGenerate mode="quiz" />
      </MotionReveal>

      <MotionReveal delay={0.12}>
        <Suspense fallback={<StatsSkeleton />}>
          <QuizStats />
        </Suspense>
      </MotionReveal>

      <MotionReveal delay={0.18}>
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <CategorySelector active={subject} />
          <DifficultySelector active={difficulty} subject={subject} />
        </div>
      </MotionReveal>

      <section className="flex flex-col gap-6">
        <div className="flex items-end justify-between px-1">
          <h2 className="text-2xl font-medium text-white tracking-tight">
            {subject && subject !== 'All' ? `${subject} quizzes` : 'Your Quizzes'}
          </h2>
          <Link
            href="/dashboard/quiz"
            className="text-sm text-blue-400 hover:text-white transition-colors flex items-center gap-1"
          >
            Show all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <Suspense fallback={<QuizLoading />}>
          <QuizList subject={subject} difficulty={difficulty} />
        </Suspense>
      </section>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 rounded-2xl bg-white/[0.03] border border-white/[0.05] shimmer" />
      ))}
    </div>
  );
}

function QuizLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.05] h-52 shimmer" />
      ))}
    </div>
  );
}
