import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Brain,
  Newspaper,
  Sparkles,
  Target,
  Zap,
  PenTool,
  Video,
  BarChart3,
  Shield,
  Calendar,
  GraduationCap,
} from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'AI Study Notes',
    description: 'Generate comprehensive notes from any UPSC topic with AI-powered content creation.',
    color: 'from-blue-500/20 to-blue-600/5',
    iconColor: 'text-blue-400',
  },
  {
    icon: Brain,
    title: 'Practice Quizzes',
    description: 'Adaptive quizzes that learn your weak areas and focus on what matters.',
    color: 'from-violet-500/20 to-violet-600/5',
    iconColor: 'text-violet-400',
  },
  {
    icon: Newspaper,
    title: 'Current Affairs',
    description: 'Daily curated current affairs with UPSC-relevant analysis and connections.',
    color: 'from-amber-500/20 to-amber-600/5',
    iconColor: 'text-amber-400',
  },
  {
    icon: Video,
    title: 'Video Lectures',
    description: 'AI-generated video explanations for complex topics across all GS papers.',
    color: 'from-rose-500/20 to-rose-600/5',
    iconColor: 'text-rose-400',
  },
  {
    icon: PenTool,
    title: 'Answer Writing',
    description: 'AI-evaluated mains answer practice with detailed feedback and scoring.',
    color: 'from-emerald-500/20 to-emerald-600/5',
    iconColor: 'text-emerald-400',
  },
  {
    icon: Calendar,
    title: 'Study Planner',
    description: 'Personalized study schedules that adapt to your pace and exam timeline.',
    color: 'from-cyan-500/20 to-cyan-600/5',
    iconColor: 'text-cyan-400',
  },
];

const stats = [
  { value: '50K+', label: 'Questions' },
  { value: '2000+', label: 'Study Notes' },
  { value: '99%', label: 'Uptime' },
  { value: '4.8', label: 'User Rating' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[hsl(222,47%,6%)] text-white relative overflow-hidden">
      {/* Ambient background */}
      <div className="ambient-bg" aria-hidden="true" />
      <div className="ambient-noise" aria-hidden="true" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 command-navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center shadow-lg shadow-primary/20">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-display font-bold tracking-tight">UPSC PrepX</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm text-white/50 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="#stats" className="text-sm text-white/50 hover:text-white transition-colors">
                Stats
              </Link>
              <Link href="/login" className="text-sm text-white/50 hover:text-white transition-colors">
                Login
              </Link>
              <Link
                href="/register"
                className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-medium shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:brightness-110 transition-all"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-36 pb-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered UPSC Preparation</span>
          </div>

          {/* Main heading */}
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Your Command Center
            <br />
            <span className="bg-gradient-to-r from-primary via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              for UPSC Mastery
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            AI-driven study notes, adaptive quizzes, mains answer evaluation, and intelligent scheduling
            &mdash; everything you need to crack the Civil Services Exam.
          </p>

          {/* CTA buttons */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/register"
              className="group px-8 py-3.5 rounded-xl bg-primary text-white font-semibold shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:brightness-110 transition-all flex items-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="px-8 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Floating cards decoration */}
        <div className="relative max-w-6xl mx-auto mt-20 hidden lg:block">
          <div className="absolute -top-10 left-10 w-64 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm animate-float">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Target className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-sm font-medium text-white/80">Today&apos;s Goal</span>
            </div>
            <div className="h-2 rounded-full bg-white/5">
              <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-primary to-blue-400" />
            </div>
            <p className="text-xs text-white/40 mt-2">75% completed</p>
          </div>

          <div className="absolute -top-6 right-16 w-56 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm animate-float" style={{ animationDelay: '2s' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-sm font-medium text-white/80">Score Trend</span>
            </div>
            <div className="flex items-end gap-1 h-10">
              {[40, 55, 45, 70, 65, 80, 85].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-emerald-500/30 to-emerald-400/60" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>

          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-72 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm animate-float" style={{ animationDelay: '4s' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <span className="text-sm font-medium text-white/80">AI Mentor Active</span>
                <p className="text-xs text-white/40">Analyzing your weak areas...</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="relative z-10 py-16 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <div className="text-3xl font-display font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-white/40">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Everything You Need to
              <span className="text-primary"> Succeed</span>
            </h2>
            <p className="text-white/40 max-w-xl mx-auto">
              Comprehensive tools built specifically for UPSC aspirants, powered by cutting-edge AI.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                </div>
                <h3 className="text-lg font-display font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-10 rounded-3xl bg-gradient-to-br from-primary/10 to-blue-600/5 border border-primary/20">
            <Shield className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="font-display text-3xl font-bold mb-4">
              Start Your Free Trial Today
            </h2>
            <p className="text-white/40 mb-8 max-w-lg mx-auto">
              No credit card required. Get instant access to all AI-powered features and start your UPSC preparation journey.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-white font-semibold shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:brightness-110 transition-all"
            >
              Create Free Account
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span className="font-display font-semibold">UPSC PrepX</span>
          </div>
          <p className="text-sm text-white/30">
            &copy; {new Date().getFullYear()} UPSC PrepX-AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
