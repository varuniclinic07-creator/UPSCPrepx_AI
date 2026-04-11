import { Suspense } from 'react';
import Link from 'next/link';

// Force dynamic rendering to avoid static generation errors with Server Components
export const dynamic = 'force-dynamic';
import { Brain, Clock, Trophy, CheckCircle, Play, Flame, Target, ArrowRight, Zap, BookOpen, History, Globe } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/auth-config';
import { getQuizzesByUser } from '@/lib/services/quiz-service';
import { StatCard, ProgressStatCard } from '@/components/magic-ui/stat-card';
import { BentoGrid } from '@/components/magic-ui/bento-grid';
import { ShimmerButton } from '@/components/magic-ui/shimmer-button';
import type { Quiz } from '@/types';

export const metadata = {
  title: 'Practice Quiz',
};

async function QuizList() {
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

  if (quizzes.length === 0) {
    return (
      <div className="bento-card text-center p-12">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <Brain className="w-8 h-8 text-accent" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No quizzes yet</h3>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
          Generate your first AI-powered quiz to test your UPSC knowledge
        </p>
        <Link href="/dashboard/quiz/new">
          <ShimmerButton className="px-6 py-3">
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
          <Link key={quiz.id} href={`/quiz/${quiz.id}`}>
            <div className="group relative flex flex-col justify-between p-6 rounded-3xl bg-card/40 border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all duration-500 overflow-hidden cursor-pointer h-full min-h-[200px]">
              {/* Glow */}
              <div className={`absolute -right-12 -top-12 w-24 h-24 bg-${color}/20 rounded-full blur-[50px] group-hover:bg-${color}/30 transition-all duration-500`} />

              <div className="flex flex-col gap-4 z-10">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center border border-border/50 text-muted-foreground group-hover:text-primary transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`badge badge-${color}`}>
                    {quiz.subject}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-2">
                    {quiz.topic}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
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

              <div className="mt-6 pt-4 border-t border-border/30 flex justify-between items-center z-10">
                <span className="text-xs text-muted-foreground font-medium">Start quiz</span>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
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

function QuizStats() {
  const stats = {
    totalQuizzes: 15,
    avgScore: 72,
    bestSubject: 'Polity',
    streak: 5,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Quizzes Taken"
        value={stats.totalQuizzes}
        icon={Brain}
        glowColor="hsl(var(--accent))"
      />
      <StatCard
        title="Average Score"
        value={`${stats.avgScore}%`}
        icon={Trophy}
        trend={{ value: '+5%', direction: 'up' }}
        glowColor="hsl(142, 76%, 36%)"
      />
      <StatCard
        title="Best Subject"
        value={stats.bestSubject}
        icon={CheckCircle}
        glowColor="hsl(var(--primary))"
      />
      <StatCard
        title="Day Streak"
        value={stats.streak}
        subtitle="days"
        icon={Flame}
        trend={{ value: 'Keep going!', direction: 'up' }}
        glowColor="hsl(32, 100%, 50%)"
      />
    </div>
  );
}

function CategorySelector() {
  const categories = [
    { icon: BookOpen, label: 'All Subjects', active: true },
    { icon: Target, label: 'Polity', active: false },
    { icon: Globe, label: 'Economy', active: false },
    { icon: History, label: 'History', active: false },
    { icon: Globe, label: 'Geography', active: false },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {categories.map((cat) => (
        <button
          key={cat.label}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all text-sm font-medium ${cat.active
              ? 'bg-primary/20 text-primary border border-primary/20 shadow-[0_0_15px_-3px_hsl(var(--primary)/0.3)]'
              : 'bg-muted/50 text-muted-foreground hover:text-foreground border border-border/50 hover:border-primary/30'
            }`}
        >
          <cat.icon className="w-4 h-4" />
          {cat.label}
        </button>
      ))}
    </div>
  );
}

function DifficultySelector() {
  const difficulties = [
    { label: 'All', active: true },
    { label: 'Easy', active: false, color: 'text-green-500' },
    { label: 'Medium', active: false, color: 'text-amber-500' },
    { label: 'Hard', active: false, color: 'text-red-500' },
  ];

  return (
    <div className="flex gap-2">
      {difficulties.map((diff) => (
        <button
          key={diff.label}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${diff.active
              ? 'bg-primary/20 text-primary border border-primary/20'
              : `bg-muted/30 text-muted-foreground hover:text-foreground border border-border/30 hover:border-primary/20 ${diff.color || ''}`
            }`}
        >
          {diff.label}
        </button>
      ))}
    </div>
  );
}

export default function QuizPage() {
  return (
    <div className="flex flex-col gap-8 animate-slide-down">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 self-start w-fit">
            <Zap className="w-3 h-3 text-accent" />
            <span className="text-accent text-xs font-bold uppercase tracking-wider">AI Quiz Engine</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-light text-foreground leading-[1.1] tracking-tight">
            Practice <span className="font-bold text-gradient">Quiz</span>
          </h1>
          <p className="text-lg text-muted-foreground font-light max-w-xl">
            Test your knowledge with AI-generated UPSC-style questions
          </p>
        </div>
        <Link href="/dashboard/quiz/new">
          <ShimmerButton className="px-6 py-3 text-sm">
            <Play className="w-4 h-4 mr-2" />
            Start New Quiz
          </ShimmerButton>
        </Link>
      </header>

      {/* Stats */}
      <QuizStats />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <CategorySelector />
        <DifficultySelector />
      </div>

      {/* Quiz List */}
      <section className="flex flex-col gap-6">
        <div className="flex items-end justify-between px-1">
          <h2 className="text-2xl font-medium text-foreground tracking-tight">Your Quizzes</h2>
          <Link
            href="/dashboard/quiz/history"
            className="text-sm text-primary hover:text-foreground transition-colors flex items-center gap-1"
          >
            View history <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <Suspense fallback={<QuizLoading />}>
          <QuizList />
        </Suspense>
      </section>
    </div>
  );
}

function QuizLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bento-card h-52 shimmer" />
      ))}
    </div>
  );
}