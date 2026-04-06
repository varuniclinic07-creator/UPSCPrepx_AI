import Link from 'next/link';
import { ArrowRight, BookOpen, Brain, Newspaper, Sparkles, CheckCircle2, Star, Trophy, Target, Zap, PenTool, Map, Video, BarChart3, Shield } from 'lucide-react';
import { MagicCard } from '@/components/magic-ui/magic-card';
import { Globe } from '@/components/magic-ui/globe';
import { Particles } from '@/components/magic-ui/particles';
import { Marquee } from '@/components/magic-ui/marquee';

export default function LandingPage() {
  return (
    <div className="min-h-screen gradient-hero">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">UPSC CSE Master</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-full gradient-primary text-white font-medium btn-hover"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <Particles
          className="absolute inset-0 -z-10 animate-fade-in"
          quantity={100}
          ease={80}
          color="#ffffff"
          refresh
        />
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered UPSC Preparation</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up">
            <span className="text-foreground">Master UPSC with</span>
            <br />
            <span className="text-gradient">Artificial Intelligence</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
            Generate comprehensive study notes, practice with AI quizzes, and stay updated with daily current affairs.
            Your intelligent companion for IAS, IPS, IFS success.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <Link
              href="/register"
              className="px-8 py-4 rounded-full gradient-primary text-white font-semibold text-lg btn-hover flex items-center gap-2 shadow-lg shadow-primary/25"
            >
              Start 14-Day Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 rounded-full bg-white dark:bg-gray-800 text-foreground font-semibold text-lg btn-hover border border-border"
            >
              Sign In
            </Link>
          </div>

          <p className="text-sm text-muted-foreground mt-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
            No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Crack UPSC
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive AI-powered tools designed specifically for UPSC Civil Services preparation
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 stagger-children">
            {/* Feature 1 */}
            <MagicCard className="p-8 cursor-pointer shadow-2xl" gradientColor="#262626">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
                <BookOpen className="w-7 h-7 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                📚 Smart Study Notes
              </h3>
              <p className="text-muted-foreground mb-4">
                Generate comprehensive, UPSC-focused notes on any topic. Includes key points, value additions, and PYQ connections.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  AI-generated content
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Mnemonics & memory tricks
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Standard source citations
                </li>
              </ul>
            </MagicCard>

            {/* Feature 2 */}
            <MagicCard className="p-8 cursor-pointer shadow-2xl" gradientColor="#262626">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6">
                <Brain className="w-7 h-7 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                🧠 Practice Quizzes
              </h3>
              <p className="text-muted-foreground mb-4">
                Test your knowledge with AI-generated MCQs. Get instant feedback with detailed explanations.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Prelims-style questions
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Difficulty levels
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Performance tracking
                </li>
              </ul>
            </MagicCard>

            {/* Feature 3 */}
            <MagicCard className="p-8 cursor-pointer shadow-2xl" gradientColor="#262626">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6">
                <Newspaper className="w-7 h-7 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                📰 Daily Current Affairs
              </h3>
              <p className="text-muted-foreground mb-4">
                Stay updated with curated daily current affairs. Each article includes UPSC relevance analysis.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Daily updates
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Category-wise organization
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  UPSC relevance tags
                </li>
              </ul>
            </MagicCard>

            {/* Feature 4: Mains Answer Writing */}
            <MagicCard className="p-8 cursor-pointer shadow-2xl" gradientColor="#262626">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
                <PenTool className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                ✍️ Mains Answer Evaluation
              </h3>
              <p className="text-muted-foreground mb-4">
                Get instant, line-by-line feedback on your Mains answers. AI analyzes structure, keywords, and relevance.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Detailed scoring rubrics
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Model answer generation
                </li>
              </ul>
            </MagicCard>

            {/* Feature 5: Syllabus Navigator */}
            <MagicCard className="p-8 cursor-pointer shadow-2xl" gradientColor="#262626">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 flex items-center justify-center mb-6">
                <Map className="w-7 h-7 text-teal-500" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                🧭 3D Syllabus Tracker
              </h3>
              <p className="text-muted-foreground mb-4">
                Visualize the vast UPSC syllabus as an interactive 3D graph. Track connections between topics and your progress.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Visual progress tracking
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Topic inter-linkages
                </li>
              </ul>
            </MagicCard>

            {/* Feature 6: Video Lessons */}
            <MagicCard className="p-8 cursor-pointer shadow-2xl" gradientColor="#262626">
              <div className="w-14 h-14 rounded-2xl bg-pink-500/10 flex items-center justify-center mb-6">
                <Video className="w-7 h-7 text-pink-500" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                🎥 AI Video Lectures
              </h3>
              <p className="text-muted-foreground mb-4">
                Convert any text topic into an engaging video lesson. Perfect for revising complex concepts visually.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Generated in minutes
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Multi-language support
                </li>
              </ul>
            </MagicCard>

            {/* Feature 7: Ethics Roleplay */}
            <MagicCard className="p-8 cursor-pointer shadow-2xl" gradientColor="#262626">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-indigo-500" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                ⚖️ Ethics Case Studies
              </h3>
              <p className="text-muted-foreground mb-4">
                Master GS-IV with interactive roleplay scenarios. Make decisions as an administrator and get feedback.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Real-world scenarios
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Decision analysis
                </li>
              </ul>
            </MagicCard>

            {/* Feature 8: Gamified Learning */}
            <MagicCard className="p-8 cursor-pointer shadow-2xl" gradientColor="#262626">
              <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center mb-6">
                <Trophy className="w-7 h-7 text-yellow-500" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                🏆 Competitions & Badges
              </h3>
              <p className="text-muted-foreground mb-4">
                Stay motivated by competing on leaderboards. Earn badges for consistency and high scores.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Weekly leaderboards
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Achievement system
                </li>
              </ul>
            </MagicCard>

            {/* Feature 9: Smart Analytics */}
            <MagicCard className="p-8 cursor-pointer shadow-2xl" gradientColor="#262626">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-6">
                <BarChart3 className="w-7 h-7 text-cyan-500" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                📊 Deep Performance Analytics
              </h3>
              <p className="text-muted-foreground mb-4">
                Understand your strengths and weaknesses with detailed graphical reports on your quiz performance.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Subject-wise breakdown
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Improvement trends
                </li>
              </ul>
            </MagicCard>
          </div>
        </div>
      </section>



      {/* Marquee Section */}
      <section className="py-12 px-4 border-y border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-muted-foreground mb-8 text-sm uppercase tracking-widest">Master All Subjects</p>
          <Marquee pauseOnHover className="[--duration:40s]">
            {[
              { icon: BookOpen, label: "History" },
              { icon: Globe, label: "Geography" },
              { icon: Star, label: "Polity" },
              { icon: Brain, label: "Economy" },
              { icon: Zap, label: "Science & Tech" },
              { icon: Newspaper, label: "Current Affairs" },
              { icon: Target, label: "Ethics" },
              { icon: Trophy, label: "Essay" },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-2 mx-8 text-lg font-medium text-muted-foreground hover:text-primary transition-colors cursor-default">
                {item.icon === Globe ? <Globe className="w-5 h-5" /> : <item.icon className="w-5 h-5" />}
                {item.label}
              </div>
            ))}
          </Marquee>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 relative overflow-hidden">
        {/* Globe Background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none -z-10 translate-y-32">
          <Globe className="w-full max-w-[800px] aspect-square" />
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="glass-card p-12 text-center backdrop-blur-xl bg-black/40">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="text-4xl font-bold text-gradient mb-2">10+</div>
                <div className="text-muted-foreground">UPSC Subjects</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-gradient mb-2">AI</div>
                <div className="text-muted-foreground">Powered Content</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-gradient mb-2">24/7</div>
                <div className="text-muted-foreground">Available</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-gradient mb-2">∞</div>
                <div className="text-muted-foreground">Notes Generation</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground">
              Start free, upgrade when you&apos;re ready
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Trial Plan */}
            <div className="glass-card p-8">
              <h3 className="text-xl font-semibold text-foreground mb-2">Trial</h3>
              <div className="text-4xl font-bold text-foreground mb-1">Free</div>
              <p className="text-muted-foreground mb-6">14 days</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>5 Notes per day</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>3 Quizzes per day</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Current Affairs access</span>
                </li>
              </ul>
              <Link
                href="/register"
                className="block w-full py-3 rounded-full border border-border text-center font-medium btn-hover"
              >
                Start Free
              </Link>
            </div>

            {/* Basic Plan */}
            <div className="glass-card p-8 border-2 border-primary relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full gradient-primary text-white text-sm font-medium">
                Popular
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Basic</h3>
              <div className="text-4xl font-bold text-foreground mb-1">₹499<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
              <p className="text-muted-foreground mb-6">Best for serious aspirants</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Unlimited Notes</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Unlimited Quizzes</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Video Lessons</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Essay Evaluation</span>
                </li>
              </ul>
              <Link
                href="/register?plan=basic"
                className="block w-full py-3 rounded-full gradient-primary text-white text-center font-medium btn-hover"
              >
                Get Started
              </Link>
            </div>

            {/* Premium Plan */}
            <div className="glass-card p-8">
              <h3 className="text-xl font-semibold text-foreground mb-2">Premium</h3>
              <div className="text-4xl font-bold text-foreground mb-1">₹999<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
              <p className="text-muted-foreground mb-6">For maximum preparation</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Everything in Basic</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Mock Interview</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Personal Study Planner</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span>Priority Support</span>
                </li>
              </ul>
              <Link
                href="/register?plan=premium"
                className="block w-full py-3 rounded-full border border-border text-center font-medium btn-hover"
              >
                Get Premium
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Start Your UPSC Journey?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of aspirants using AI to prepare smarter, not harder.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full gradient-primary text-white font-semibold text-lg btn-hover shadow-lg shadow-primary/25"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-foreground">UPSC CSE Master</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 UPSC CSE Master. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                Terms
              </Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div >
  );
}