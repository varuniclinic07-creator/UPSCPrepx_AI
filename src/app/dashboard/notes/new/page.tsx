'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Sparkles, BookOpen, RefreshCw, Bookmark, Share2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ShimmerButton } from '@/components/magic-ui/shimmer-button';

const UPSC_SUBJECTS = [
  { name: 'Indian Polity', color: 'bg-blue-500/10 text-blue-600' },
  { name: 'Economy', color: 'bg-green-500/10 text-green-600' },
  { name: 'History', color: 'bg-amber-500/10 text-amber-600' },
  { name: 'Geography', color: 'bg-teal-500/10 text-teal-600' },
  { name: 'Environment', color: 'bg-emerald-500/10 text-emerald-600' },
  { name: 'Science & Tech', color: 'bg-purple-500/10 text-purple-600' },
];

const NOTE_TYPES = ['Summary', 'Detailed Analysis', 'Key Facts', 'Prelims Focus'];

export default function NewNotePage() {
  const router = useRouter();
  const [topic, setTopic] = useState('Article 21 Protection of Life');
  const [subject, setSubject] = useState('Indian Polity');
  const [noteType, setNoteType] = useState('Summary');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNote, setGeneratedNote] = useState<any>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setIsGenerating(true);
    setGeneratedNote(null);

    try {
      // Map noteType to API brevityLevel
      const brevityMap: Record<string, string> = {
        'Summary': '250',
        'Detailed Analysis': '1000',
        'Key Facts': '100',
        'Prelims Focus': '500',
      };
      const brevityLevel = brevityMap[noteType] || '500';

      const response = await fetch('/api/notes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), subject, brevityLevel }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate notes');
      }

      setGeneratedNote(data.note);
      toast.success('Notes generated successfully!');
    } catch (error) {
      console.error('Error generating notes:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate notes');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-4 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/notes" className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
        </div>
        <h1 className="font-bold text-lg tracking-tight">Smart Notes</h1>
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-[#D4AF37] p-[2px]">
          <div className="w-full h-full rounded-full bg-background flex items-center justify-center text-primary font-bold text-sm">
            AI
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Input Card - Paper Style */}
        <section className="bg-card rounded-3xl p-1 shadow-lg ring-1 ring-border/50">
          {/* Topic Input */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Sparkles className="w-6 h-6 text-primary group-focus-within:text-[#D4AF37] transition-colors" />
            </div>
            <input
              className="block w-full rounded-2xl border-0 py-4 pl-12 pr-12 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary/20 text-lg font-medium bg-transparent"
              placeholder="Enter a topic for study notes..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isGenerating}
            />
            <div className="absolute inset-y-0 right-2 flex items-center">
              <button className="p-2 bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors">
                <Mic className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Note Type Chips */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-3 pb-3">
            {NOTE_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setNoteType(type)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${noteType === type
                    ? 'bg-primary/10 border border-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Subject Pills */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-3 pb-3">
            {UPSC_SUBJECTS.map((sub) => (
              <button
                key={sub.name}
                onClick={() => setSubject(sub.name)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${subject === sub.name
                    ? `${sub.color} ring-2 ring-current/30`
                    : 'bg-muted text-muted-foreground'
                  }`}
              >
                {sub.name}
              </button>
            ))}
          </div>

          {/* Magic Generate Button */}
          <div className="px-3 pb-3">
            <ShimmerButton
              className="w-full h-12 text-base font-bold"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate Smart Notes'}
            </ShimmerButton>
          </div>
        </section>

        {/* Generated Content Preview */}
        {(generatedNote || isGenerating) && (
          <section className="relative">
            {/* AI Generated Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm z-10">
              AI Generated
            </div>

            {/* Paper Card */}
            <article className="bg-card rounded-3xl p-6 sm:p-8 shadow-lg ring-1 ring-border/50">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <p className="text-muted-foreground">AI is generating your notes...</p>
                  <p className="text-xs text-muted-foreground">This may take 30-60 seconds</p>
                </div>
              ) : generatedNote ? (
                <>
                  {/* Title & Meta */}
                  <div className="border-b border-dashed border-border pb-4 mb-6">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">{subject}</span>
                      <span className="text-xs font-medium text-muted-foreground">Just now</span>
                    </div>
                    <h2 className="text-3xl font-bold text-foreground leading-tight">
                      {generatedNote.title || topic}
                    </h2>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      <span className="inline-flex items-center rounded-md bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-700 dark:text-yellow-400 ring-1 ring-inset ring-yellow-500/20">
                        {noteType}
                      </span>
                    </div>
                  </div>

                  {/* Content Body */}
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: generatedNote.content?.replace(/\n/g, '<br/>') || '' }} />
                  </div>

                  {/* Prelims Byte Box */}
                  {generatedNote.keyPoints && (
                    <div className="mt-6 bg-muted/50 rounded-xl p-4 border-l-4 border-primary">
                      <h4 className="text-sm font-bold text-primary mb-2 uppercase flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        Key Points
                      </h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {generatedNote.keyPoints.map((point: string, i: number) => (
                          <li key={i} className="flex gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#D4AF37]" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : null}
            </article>
          </section>
        )}
      </main>

      {/* Floating Action Toolbar */}
      {generatedNote && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <div className="flex items-center gap-1 p-2 pl-4 pr-4 bg-card/90 backdrop-blur-xl shadow-2xl rounded-full border border-border/50 ring-1 ring-white/10">
            <button
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors text-muted-foreground"
              onClick={() => toast.success('Saved to library!')}
            >
              <Bookmark className="w-5 h-5" />
            </button>
            <button
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors text-muted-foreground"
              onClick={() => toast.info('Share feature coming soon!')}
            >
              <Share2 className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-border mx-2" />
            <button
              onClick={handleGenerate}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}