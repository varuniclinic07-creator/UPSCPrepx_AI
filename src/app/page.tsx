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
  Shield,
  Calendar,
  BrainCircuit,
  Activity,
  Flame,
  CheckCircle2,
  Globe2,
  FileSearch,
  Layers,
} from 'lucide-react';
import { Logo, LogoMark } from '@/components/brand/logo';

const features = [
  {
    icon: BookOpen,
    title: 'AI Study Notes',
    description: 'Generate comprehensive, syllabus-mapped notes on any topic — Polity, Economy, History, Geography, Science — in seconds.',
    color: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
  },
  {
    icon: Brain,
    title: 'Adaptive Quizzes',
    description: 'Prelims-calibre MCQs that learn your weak areas and redirect effort where it matters most.',
    color: 'bg-violet-500/10',
    iconColor: 'text-violet-400',
  },
  {
    icon: Newspaper,
    title: 'Current Affairs, Curated',
    description: 'Real-time ingestion from The Hindu, PIB, PRS, VisionIAS, DrishtiIAS — distilled into UPSC-relevant briefs.',
    color: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
  },
  {
    icon: Video,
    title: 'AI Video Lectures',
    description: 'Concept-visualised Manim + Remotion animations for the topics students find hardest to grasp.',
    color: 'bg-rose-500/10',
    iconColor: 'text-rose-400',
  },
  {
    icon: PenTool,
    title: 'Mains Evaluation',
    description: 'Upload a hand-written answer. Get structural, content, and example-quality feedback in minutes.',
    color: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
  },
  {
    icon: Calendar,
    title: 'Personal Planner',
    description: 'A 2-year Prelims + Mains schedule that adapts to your study hours, mock scores, and exam date.',
    color: 'bg-cyan-500/10',
    iconColor: 'text-cyan-400',
  },
];

const capabilities = [
  { icon: Globe2, value: '40+', label: 'Whitelisted UPSC sources' },
  { icon: FileSearch, value: '3', label: 'Agentic research systems' },
  { icon: Layers, value: '2y', label: 'Structured syllabus coverage' },
  { icon: Shield, value: 'E2E', label: 'Encrypted & private' },
];

const storytellingSections = [
  {
    icon: BrainCircuit,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10',
    title: 'Reads like a book.\nThinks like a mentor.',
    description:
      'Chanakya AI parses the full UPSC syllabus — then adapts to your voice. Ask a question, get a lecture. Share a topic, get a mind-map. No cold templates.',
    preview: <NotesPreview />,
  },
  {
    icon: Target,
    iconColor: 'text-orange-400',
    iconBg: 'bg-orange-500/10',
    title: 'Flawless Evaluation.\nMains & Prelims.',
    description:
      'Upload an answer. Get structural feedback, content scoring, and example-quality suggestions — benchmarked against top-50 scripts.',
    preview: <EvaluationPreview />,
  },
  {
    icon: Activity,
    iconColor: 'text-green-400',
    iconBg: 'bg-green-500/10',
    title: 'Command your prep.\nZero blind spots.',
    description:
      'Every mock, every note, every current-affair read feeds a single progress model. See exactly where you stand — and where to spend the next 60 minutes.',
    preview: <ProgressPreview />,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="ambient-bg" aria-hidden="true" />
      <div className="ambient-noise" aria-hidden="true" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 command-navbar">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          <div className="flex items-center justify-between py-5">
            <Logo size="sm" href="/" />
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm text-white/50 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="#capabilities" className="text-sm text-white/50 hover:text-white transition-colors">
                Capabilities
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
      <section className="relative z-10 min-h-[90vh] flex flex-col items-center justify-center px-6 pt-24">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-500/5 blur-[150px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-orange-500/5 blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">Chanakya AI is Online</span>
          </div>

          <h1 className="font-display text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-[1.05] mb-6">
            <span className="text-gradient">UPSC.</span>
            <br />
            <span className="text-gradient">Reimagined.</span>
          </h1>

          <p className="text-xl md:text-2xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            Personalized strategy, predictive analytics, and an AI mentor that never sleeps — built for serious aspirants.
          </p>

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

        {/* ── Bento Demo Cards (marketing illustration) ── */}
        <div className="relative max-w-6xl mx-auto mt-20 hidden lg:grid grid-cols-3 gap-5 px-8">
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Target className="w-4 h-4 text-orange-400" />
              </div>
              <span className="text-sm font-medium text-white/80">Rank Prediction</span>
              <span className="ml-auto text-[9px] uppercase tracking-wider text-white/30">Sample</span>
            </div>
            <div className="mb-3">
              <span className="text-3xl font-display font-bold text-orange-400">85%</span>
              <span className="text-xs text-white/30 ml-2">probability</span>
            </div>
            <div className="h-2 rounded-full bg-white/5">
              <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-orange-500 to-orange-400" />
            </div>
            <p className="text-xs text-white/30 mt-2">Illustrative — your actual probability updates with every mock.</p>
          </div>

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
                Explain Article 370 and its abrogation impact on J&amp;K...
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-white/70">
                Article 370 granted special autonomy to J&amp;K under Part XXI of the Constitution...
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-sm font-medium text-white/80">Daily Target</span>
              <span className="ml-auto text-[9px] uppercase tracking-wider text-white/30">Sample</span>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Read Economy Chapter 5', done: true },
                { label: 'Solve 50 MCQs — Polity', done: true },
                { label: 'Write 1 Mains Answer', done: false },
                { label: 'Current Affairs Review', done: false },
              ].map((task) => (
                <div key={task.label} className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border ${
                      task.done ? 'bg-blue-500 border-blue-500' : 'border-white/20'
                    } flex items-center justify-center`}
                  >
                    {task.done && <span className="text-white text-xs">&#10003;</span>}
                  </div>
                  <span className={`text-sm ${task.done ? 'text-white/50 line-through' : 'text-white/70'}`}>
                    {task.label}
                  </span>
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
              <p className="text-lg text-white/50 leading-relaxed max-w-md">{section.description}</p>
            </div>
            <div className={`${i % 2 === 1 ? 'lg:order-1' : ''}`}>{section.preview}</div>
          </div>
        ))}
      </section>

      {/* ═══════════ CAPABILITY STATS ═══════════ */}
      <section id="capabilities" className="relative z-10 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3 text-white">
              What&rsquo;s under the hood
            </h2>
            <p className="text-white/40 max-w-xl mx-auto text-base">
              Real capabilities, not vanity counters. This is what ships with every account.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {capabilities.map((c) => (
              <div
                key={c.label}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                  <c.icon className="w-5 h-5 text-white/70" />
                </div>
                <div className="text-3xl font-display font-bold text-white mb-1">{c.value}</div>
                <div className="text-xs text-white/40 uppercase tracking-wider">{c.label}</div>
              </div>
            ))}
          </div>
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
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-orange-500/5 pointer-events-none" />
            <div className="relative z-10">
              <LogoMark size={56} className="mx-auto mb-6" />
              <h2 className="font-display text-4xl font-bold mb-4 text-gradient">Start Your Free Trial</h2>
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
          <Logo size="xs" />
          <p className="text-sm text-white/30">
            &copy; {new Date().getFullYear()} UPSC PrepX AI · Chanakya AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PREVIEW COMPONENTS — static, purely illustrative
   ═══════════════════════════════════════════════════════════════ */

function NotesPreview() {
  return (
    <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05] min-h-[280px]">
      <div className="flex items-center gap-2 mb-4 text-xs text-white/40">
        <BookOpen className="w-3 h-3 text-blue-400" />
        Polity · Fundamental Rights
        <span className="ml-auto text-[9px] uppercase tracking-wider text-white/20">Sample</span>
      </div>
      <h4 className="font-display font-semibold text-white mb-3 text-lg">
        Article 21 — Right to Life &amp; Personal Liberty
      </h4>
      <div className="space-y-2 text-sm text-white/60 leading-relaxed">
        <p>
          <span className="text-blue-400">→</span> Protects any person from deprivation of life or liberty except by procedure established by law.
        </p>
        <p>
          <span className="text-blue-400">→</span> Maneka Gandhi v. Union of India (1978) expanded the scope to include a fair, just, and reasonable procedure.
        </p>
        <p>
          <span className="text-blue-400">→</span> Subsequent rulings embedded: right to privacy (K.S. Puttaswamy), clean environment, education, and dignified death.
        </p>
      </div>
      <div className="mt-4 flex gap-2">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">GS-2</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40">Prelims + Mains</span>
      </div>
    </div>
  );
}

function EvaluationPreview() {
  const criteria = [
    { label: 'Introduction', score: 8, max: 10 },
    { label: 'Body — Structure', score: 14, max: 20 },
    { label: 'Examples & Data', score: 7, max: 10 },
    { label: 'Conclusion', score: 6, max: 10 },
  ];
  return (
    <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05] min-h-[280px]">
      <div className="flex items-center gap-2 mb-5 text-xs text-white/40">
        <PenTool className="w-3 h-3 text-orange-400" />
        Mains GS-4 · Ethics Case Study
        <span className="ml-auto text-[9px] uppercase tracking-wider text-white/20">Sample</span>
      </div>
      <div className="flex items-baseline gap-2 mb-5">
        <span className="text-4xl font-display font-bold text-orange-400">35</span>
        <span className="text-sm text-white/30">/ 50</span>
        <span className="ml-auto text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">+4 vs avg</span>
      </div>
      <div className="space-y-2.5">
        {criteria.map((c) => (
          <div key={c.label}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-white/50">{c.label}</span>
              <span className="text-white/40 font-mono">
                {c.score}/{c.max}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-orange-400"
                style={{ width: `${(c.score / c.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressPreview() {
  const subjects = [
    { name: 'Polity', pct: 72, color: 'from-blue-500 to-blue-400' },
    { name: 'History', pct: 58, color: 'from-violet-500 to-violet-400' },
    { name: 'Geography', pct: 44, color: 'from-emerald-500 to-emerald-400' },
    { name: 'Economy', pct: 31, color: 'from-amber-500 to-amber-400' },
  ];
  return (
    <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05] min-h-[280px]">
      <div className="flex items-center gap-2 mb-5 text-xs text-white/40">
        <Activity className="w-3 h-3 text-green-400" />
        Progress Snapshot
        <span className="ml-auto text-[9px] uppercase tracking-wider text-white/20">Sample</span>
      </div>
      <div className="space-y-4">
        {subjects.map((s) => (
          <div key={s.name}>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-white/70 font-medium">{s.name}</span>
              <span className="text-white/40 font-mono text-xs">{s.pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div className={`h-full bg-gradient-to-r ${s.color} rounded-full`} style={{ width: `${s.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-2 text-xs text-white/50 pt-4 border-t border-white/5">
        <Flame className="w-3.5 h-3.5 text-orange-400" />
        Focus next: <span className="text-orange-400 font-medium">Economy fundamentals</span>
        <CheckCircle2 className="w-3.5 h-3.5 text-white/20 ml-auto" />
      </div>
    </div>
  );
}
