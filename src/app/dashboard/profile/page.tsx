import { redirect } from 'next/navigation';
import Link from 'next/link';

// Force dynamic rendering to avoid static generation errors with Server Components
export const dynamic = 'force-dynamic';
import { Mail, Calendar, Award, BookOpen, Brain, Newspaper, Settings, Crown, Clock, Flame, Target, ArrowRight } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/auth-config';
import { StatCard } from '@/components/magic-ui/stat-card';
import { ShimmerButton } from '@/components/magic-ui/shimmer-button';

export const metadata = {
  title: 'Profile',
};

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Mock stats - in production, fetch from database
  const stats = {
    notesCreated: 24,
    quizzesCompleted: 18,
    articlesRead: 56,
    avgQuizScore: 72,
    studyStreak: 12,
    totalStudyTime: '48h 30m',
  };

  const subscriptionInfo = {
    tier: user.subscriptionTier || 'trial',
    expiresAt: user.subscriptionEndsAt,
    daysLeft: user.subscriptionEndsAt
      ? Math.max(0, Math.ceil((new Date(user.subscriptionEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0,
  };

  const achievements = [
    { icon: '📚', title: 'First Note', desc: 'Created first note', unlocked: true },
    { icon: '🧠', title: 'Quiz Master', desc: '10 quizzes completed', unlocked: true },
    { icon: '🔥', title: 'Week Warrior', desc: '7 day streak', unlocked: true },
    { icon: '⭐', title: 'Perfect Score', desc: '100% on a quiz', unlocked: false },
    { icon: '📰', title: 'News Buff', desc: '50 articles read', unlocked: true },
    { icon: '🎯', title: 'Focused', desc: '5 hours study', unlocked: false },
    { icon: '🏅', title: 'All Rounder', desc: 'All subjects covered', unlocked: false },
    { icon: '👑', title: 'Champion', desc: 'Top 10% score', unlocked: false },
  ];

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 animate-slide-down">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl lg:text-5xl font-light text-foreground leading-[1.1] tracking-tight">
            Your <span className="font-bold text-gradient">Profile</span>
          </h1>
          <p className="text-lg text-muted-foreground font-light">
            Manage your account and view your progress
          </p>
        </div>
        <Link href="/settings">
          <ShimmerButton className="px-6 py-3 text-sm" background="hsl(var(--muted))">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </ShimmerButton>
        </Link>
      </header>

      {/* Profile Card */}
      <div className="bento-card p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          {user.avatarUrl ? (
            <div
              className="w-24 h-24 rounded-2xl bg-cover bg-center border-4 border-primary/20 shadow-lg shadow-primary/10"
              style={{ backgroundImage: `url(${user.avatarUrl})` }}
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl gradient-primary flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-primary/20">
              {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-foreground">{user.name || 'UPSC Aspirant'}</h2>
            <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2 mt-1">
              <Mail className="w-4 h-4" />
              {user.email}
            </p>
            <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2 mt-1">
              <Calendar className="w-4 h-4" />
              UPSC CSE Master Member
            </p>

            {/* Subscription Badge */}
            <div className="mt-4">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${subscriptionInfo.tier === 'premium'
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_15px_-3px_hsl(45,100%,50%,0.3)]'
                  : subscriptionInfo.tier === 'basic'
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-muted/50 text-muted-foreground border border-border/50'
                }`}>
                <Crown className="w-4 h-4" />
                {subscriptionInfo.tier.charAt(0).toUpperCase() + subscriptionInfo.tier.slice(1)} Plan
                {subscriptionInfo.tier === 'trial' && subscriptionInfo.daysLeft > 0 && (
                  <span className="text-xs opacity-70">({subscriptionInfo.daysLeft} days left)</span>
                )}
              </span>
            </div>
          </div>

          {/* Upgrade Button */}
          {subscriptionInfo.tier !== 'premium' && (
            <Link href="/pricing">
              <ShimmerButton className="px-6 py-3 text-sm">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Plan
              </ShimmerButton>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          title="Notes Created"
          value={stats.notesCreated}
          icon={BookOpen}
          glowColor="hsl(var(--primary))"
        />
        <StatCard
          title="Quizzes Done"
          value={stats.quizzesCompleted}
          icon={Brain}
          glowColor="hsl(var(--accent))"
        />
        <StatCard
          title="Articles Read"
          value={stats.articlesRead}
          icon={Newspaper}
          glowColor="hsl(var(--secondary))"
        />
        <StatCard
          title="Avg Quiz Score"
          value={`${stats.avgQuizScore}%`}
          icon={Target}
          trend={{ value: '+5%', direction: 'up' }}
          glowColor="hsl(142, 76%, 36%)"
        />
        <StatCard
          title="Day Streak"
          value={stats.studyStreak}
          icon={Flame}
          trend={{ value: 'Keep going!', direction: 'up' }}
          glowColor="hsl(32, 100%, 50%)"
        />
        <StatCard
          title="Study Time"
          value={stats.totalStudyTime}
          icon={Clock}
          glowColor="hsl(263, 70%, 50%)"
        />
      </div>

      {/* Achievements */}
      <div className="bento-card p-6">
        <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <span className="text-xl">🏆</span> Achievements
        </h3>
        <p className="text-muted-foreground text-sm mb-6">Your milestones and badges</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {achievements.map((achievement, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border text-center transition-all group cursor-pointer ${achievement.unlocked
                  ? 'border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/10'
                  : 'border-border/30 bg-muted/10 opacity-50'
                }`}
            >
              <span className="text-3xl block mb-2">{achievement.icon}</span>
              <p className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">{achievement.title}</p>
              <p className="text-xs text-muted-foreground">{achievement.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link href="/dashboard/notes" className="bento-card p-6 flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">View All Notes</h3>
            <p className="text-sm text-muted-foreground">Access your study materials</p>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </Link>

        <Link href="/dashboard/quiz" className="bento-card p-6 flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-all">
            <Brain className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">Quiz History</h3>
            <p className="text-sm text-muted-foreground">Review your quiz performance</p>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
    </div>
  );
}