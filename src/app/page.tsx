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
  BrainCircuit,
  Activity,
} from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'AI Study Notes',
    description: 'Generate comprehensive notes from any UPSC topic with AI-powered content creation.',
    color: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
  },
  {
    icon: Brain,
    title: 'Practice Quizzes',
    description: 'Adaptive quizzes that learn your weak areas and focus on what matters.',
    color: 'bg-violet-500/10',
    iconColor: 'text-violet-400',
  },
  {
    icon: Newspaper,
    title: 'Current Affairs',
    description: 'Daily curated current affairs with UPSC-relevant analysis and connections.',
    color: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
  },
  {
    icon: Video,
    title: 'Video Lectures',
    description: 'AI-generated video explanations for complex topics across all GS papers.',
    color: 'bg-rose-500/10',
    iconColor: 'text-rose-400',
  },
  {
    icon: PenTool,
    title: 'Mains Evaluation',
    description: 'AI-evaluated mains answer practice with detailed feedback and scoring.',
    color: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
  },
  {
    icon: Calendar,
    title: 'Smart Planner',
    description: 'Personalized study schedules that adapt to your pace and exam timeline.',
    color: 'bg-cyan-500/10',
    iconColor: 'text-cyan-400',
  },
];

const stats = [
  { value: '50K+', label: 'Questions' },
  { value: '2000+', label: 'Study Notes' },
  { value: '99%', label: 'Uptime' },
  { value: '4.8', label: 'User Rating' },
];

const storytellingSections = [
  {
    icon: BrainCircuit,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10',
    title: 'Reads like a book.\nThinks like a mentor.',
    description: 'Chanakya AI understands the UPSC syllabus deeply. It generates study notes, explains concepts, and adapts to your learning style — 24/7.',
  },
  {
    icon: Target,
    iconColor: 'text-orange-400',
    iconBg: 'bg-orange-500/10',
    title: 'Flawless Evaluation.\nMains & Prelims.',
    description: 'Upload your answer papers for instant AI evaluation. Get structural feedback, content scoring, and actionable improvement tips.',
  },
  {
    icon: Activity,
    iconColor: 'text-green-400',
    iconBg: 'bg-green-500/10',
    title: 'Command your prep.\nZero blind spots.',
    description: 'Track every metric. Subject mastery, mock test trends, study hours, and rank prediction — all in one dashboard.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Ambient background */}
      <div className="ambient-bg" aria-hidden="true" />
      <div className="ambient-noise" aria-hidden="true" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 command-navbar">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          <div className="flex items-center justify-between py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                <span className="text-black text-lg font-display font-bold">P</span>
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
                className="px-5 py-2 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 hover:scale-105 active:scale-95 transition-all"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══════════ HERO SECTION ═══════════ */}
      <section className="relative z-10 min-h-[90vh] flex flex-col items-center justify-center px-6">
        {/* Decorative blur orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-500/5 blur-[150px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-orange-500/5 blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">Chanakya AI is Online</span>
          </div>

          {/* Main heading — Apple-style large text gradient */}
          <h1 className="font-display text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-[1.05] mb-6">
            <span className="text-gradient">UPSC.</span>
            <br />
            <span className="text-gradient">Reimagined.</span>
          </h1>

          <p className="text-xl md:text-2xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            Personalized strategy, predictive analytics, and an AI mentor that never sleeps — built for serious aspirants.
          </p>

          {/* CTA buttons */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/register"
              className="group px-8 py-3.5 rounded-full bg-white text-black font-semibold hover:bg-white/90 hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)] flex items-center gap-2"
            >
              Open Platform
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="px-8 py-3.5 rounded-full bg-white/5 border border-white/10 text-white/60 font-medium hover:bg-white/10 hover:text-white transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* ── Bento Demo Cards ── */}
        <div className="relative max-w-6xl mx-auto mt-20 hidden lg:grid grid-cols-3 gap-5 px-8">
          {/* Card 1: Rank Prediction */}
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Target className="w-4 h-4 text-orange-400" />
              </div>
              <span className="text-sm font-medium text-white/80">Rank Prediction</span>
            </div>
            <div className="mb-3">
              <span className="text-3xl font-display font-bold text-orange-400">85%</span>
              <span className="text-xs text-white/30 ml-2">probability</span>
            </div>
            <div className="h-2 rounded-full bg-white/5">
              <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-orange-500 to-orange-400" />
            </div>
            <p className="text-xs text-white/30 mt-2">Selection probability based on current progress</p>
          </div>

          {/* Card 2: AI Chat Demo */}
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-blue-500/20 backdrop-blur-sm shadow-[0_0_40px_rgba(59,130,246,0.1)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-sm font-medium text-white/80">Chanakya AI</span>
              <span className="ml-auto text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">Live</span>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-white/5 text-sm text-white/60">
                Explain Article 370 and its abrogation impact on J&K...
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-white/70">
                Article 370 granted special autonomy to J&K under Part XXI of the Constitution...
              </div>
            </div>
          </div>

          {/* Card 3: Daily Target */}
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-sm font-medium text-white/80">Daily Target</span>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Read Economy Chapter 5', done: true },
                { label: 'Solve 50 MCQs — Polity', done: true },
                { label: 'Write 1 Mains Answer', done: false },
                { label: 'Current Affairs Review', done: false },
              ].map((task) => (
                <div key={task.label} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border ${task.done ? 'bg-blue-500 border-blue-500' : 'border-white/20'} flex items-center justify-center`}>
                    {task.done && <span className="text-white text-xs">&#10003;</span>}
                  </div>
                  <span className={`text-sm ${task.done ? 'text-white/50 line-through' : 'text-white/70'}`}>{task.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ STORYTELLING SECTIONS ═══════════ */}
      <section className="relative z-10 py-20 px-6 md:px-12 lg:px-24 space-y-32">
        {storytellingSections.map((section, i) => (
          <div key={i} className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
              <div className={`w-12 h-12 rounded-xl ${section.iconBg} flex items-center justify-center mb-6`}>
                <section.icon className={`w-6 h-6 ${section.iconColor}`} />
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-6 whitespace-pre-line text-gradient">
                {section.title}
              </h2>
              <p className="text-lg text-white/50 leading-relaxed max-w-md">
                {section.description}
              </p>
            </div>
            <div className={`p-8 rounded-2xl bg-white/[0.03] border border-white/[0.05] min-h-[280px] flex items-center justify-center ${i % 2 === 1 ? 'lg:order-1' : ''}`}>
              <div className="text-center text-white/20">
                <section.icon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-sm">Interactive preview</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ═══════════ STATS SECTION ═══════════ */}
      <section id="stats" className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <div className="text-4xl font-display font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-white/40">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ FEATURES GRID ═══════════ */}
      <section id="features" className="relative z-10 py-20 px-6 md:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4 text-gradient">
              Everything You Need
            </h2>
            <p className="text-white/40 max-w-xl mx-auto text-lg">
              Comprehensive tools built specifically for UPSC aspirants, powered by cutting-edge AI.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                </div>
                <h3 className="text-lg font-display font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-white/[0.03] border border-white/[0.05] relative overflow-hidden">
            {/* Decorative glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-orange-500/5 pointer-events-none" />
            <div className="relative z-10">
              <Shield className="w-12 h-12 text-blue-400 mx-auto mb-6" />
              <h2 className="font-display text-4xl font-bold mb-4 text-gradient">
                Start Your Free Trial
              </h2>
              <p className="text-white/40 mb-8 max-w-lg mx-auto">
                No credit card required. Get instant access to all AI-powered features and start your UPSC preparation journey.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-black font-semibold hover:bg-white/90 hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)]"
              >
                Create Free Account
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <span className="text-black text-sm font-display font-bold">P</span>
            </div>
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
