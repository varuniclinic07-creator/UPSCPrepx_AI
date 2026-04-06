'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, Brain, Sparkles, Zap, Timer, Target, Trophy } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ShimmerButton } from '@/components/magic-ui/shimmer-button';

const UPSC_SUBJECTS = [
  { name: 'Indian Polity', icon: '⚖️', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  { name: 'Economy', icon: '💰', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  { name: 'History', icon: '📜', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  { name: 'Geography', icon: '🌍', color: 'bg-teal-500/10 text-teal-600 border-teal-500/20' },
  { name: 'Environment', icon: '🌿', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  { name: 'Science & Tech', icon: '🔬', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  { name: 'Current Affairs', icon: '📰', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
  { name: 'Art & Culture', icon: '🎭', color: 'bg-pink-500/10 text-pink-600 border-pink-500/20' },
];

const DIFFICULTY_LEVELS = [
  { id: 'easy', label: 'Easy', emoji: '🟢', time: '5 min', color: 'border-green-500 bg-green-500/10' },
  { id: 'medium', label: 'Medium', emoji: '🟡', time: '10 min', color: 'border-yellow-500 bg-yellow-500/10' },
  { id: 'hard', label: 'Hard', emoji: '🔴', time: '15 min', color: 'border-red-500 bg-red-500/10' },
];

const QUESTION_COUNTS = [5, 10, 15, 20, 25];

export default function NewQuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [topic, setTopic] = useState(searchParams.get('topic') || '');
  const [subject, setSubject] = useState(searchParams.get('subject') || 'Indian Polity');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), subject, difficulty, questionCount }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate quiz');
      }

      toast.success('Quiz generated successfully!');
      router.push(`/quiz/${data.quiz.id}`);
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate quiz');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedDifficulty = DIFFICULTY_LEVELS.find(d => d.id === difficulty);

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-4 bg-background/80 backdrop-blur-md border-b border-border/50">
        <Link href="/quiz" className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="font-bold text-lg tracking-tight flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-500" />
          Quiz Generator
        </h1>
        <div className="w-10" />
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Stats Preview Card */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-2xl p-4 text-center border border-border/50">
            <Target className="w-6 h-6 mx-auto text-primary mb-2" />
            <div className="text-2xl font-bold text-foreground">{questionCount}</div>
            <div className="text-xs text-muted-foreground">Questions</div>
          </div>
          <div className="bg-card rounded-2xl p-4 text-center border border-border/50">
            <Timer className="w-6 h-6 mx-auto text-[#D4AF37] mb-2" />
            <div className="text-2xl font-bold text-foreground">{selectedDifficulty?.time}</div>
            <div className="text-xs text-muted-foreground">Estimated</div>
          </div>
          <div className="bg-card rounded-2xl p-4 text-center border border-border/50">
            <Trophy className="w-6 h-6 mx-auto text-amber-500 mb-2" />
            <div className="text-2xl font-bold text-foreground">+{questionCount * 10}</div>
            <div className="text-xs text-muted-foreground">Points</div>
          </div>
        </div>

        {/* Main Form Card */}
        <section className="bg-card rounded-3xl p-1 shadow-lg ring-1 ring-border/50">
          {/* Topic Input */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Sparkles className="w-6 h-6 text-purple-500 group-focus-within:text-[#D4AF37] transition-colors" />
            </div>
            <input
              className="block w-full rounded-2xl border-0 py-4 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary/20 text-lg font-medium bg-transparent"
              placeholder="Enter a topic (e.g., Fundamental Rights)"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isGenerating}
            />
          </div>

          {/* Subject Selection */}
          <div className="px-4 py-3">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-3">
              Select Subject
            </label>
            <div className="grid grid-cols-2 gap-2">
              {UPSC_SUBJECTS.map((sub) => (
                <button
                  key={sub.name}
                  onClick={() => setSubject(sub.name)}
                  disabled={isGenerating}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${subject === sub.name
                      ? `${sub.color} ring-2 ring-current/30`
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                >
                  <span>{sub.icon}</span>
                  {sub.name}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div className="px-4 py-3 border-t border-border/50">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-3">
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTY_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setDifficulty(level.id)}
                  disabled={isGenerating}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${difficulty === level.id
                      ? level.color
                      : 'border-transparent bg-muted/50 hover:bg-muted'
                    }`}
                >
                  <span className="text-2xl block mb-1">{level.emoji}</span>
                  <span className="text-sm font-bold text-foreground">{level.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div className="px-4 py-3 border-t border-border/50">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-3">
              Number of Questions
            </label>
            <div className="flex gap-2">
              {QUESTION_COUNTS.map((count) => (
                <button
                  key={count}
                  onClick={() => setQuestionCount(count)}
                  disabled={isGenerating}
                  className={`flex-1 py-3 rounded-xl border-2 transition-all font-bold ${questionCount === count
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div className="p-4">
            <ShimmerButton
              className="w-full h-14 text-base font-bold"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating Quiz...
                </div>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Start Quiz Challenge
                </>
              )}
            </ShimmerButton>
          </div>
        </section>

        {/* Features List */}
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl p-5 border border-purple-500/20">
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#D4AF37]" />
            Quiz Features
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              '📝 UPSC Prelims-style MCQs',
              '📖 Detailed explanations',
              '❌ Option elimination tips',
              '📚 PYQ references',
              '📊 Instant score',
              '🏆 Leaderboard ranking',
            ].map((item, i) => (
              <div key={i} className="text-muted-foreground">{item}</div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}