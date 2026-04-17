'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles,
  BookOpen,
  RefreshCw,
  Share2,
  ChevronLeft,
  ExternalLink,
} from 'lucide-react';
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

const NOTE_TYPES = ['Summary', 'Detailed Analysis', 'Key Facts', 'Prelims Focus'] as const;
type NoteType = (typeof NOTE_TYPES)[number];

const BREVITY_MAP: Record<NoteType, string> = {
  Summary: '250',
  'Detailed Analysis': '1000',
  'Key Facts': '100',
  'Prelims Focus': '500',
};

type GeneratedNote = {
  id?: string;
  topic?: string;
  title?: string;
  subject?: string;
  content?: string;
  contentHtml?: string;
  wordCount?: number;
  keyPoints?: string[];
  sources?: Array<{ name: string; url?: string; type: string }>;
};

function NewNoteInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTopic = (searchParams.get('topic') ?? '').trim();
  const rawType = (searchParams.get('type') ?? '').trim();
  const initialType: NoteType = (NOTE_TYPES as readonly string[]).includes(rawType)
    ? (rawType as NoteType)
    : 'Summary';

  const [topic, setTopic] = useState(initialTopic);
  const [subject, setSubject] = useState('Indian Polity');
  const [noteType, setNoteType] = useState<NoteType>(initialType);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNote, setGeneratedNote] = useState<GeneratedNote | null>(null);

  // If the user lands with ?topic=..., kick off generation automatically once.
  const [autoTriggered, setAutoTriggered] = useState(false);
  useEffect(() => {
    if (initialTopic && !autoTriggered) {
      setAutoTriggered(true);
      // slight delay so first paint shows the form state before the spinner takes over
      const t = setTimeout(() => void handleGenerate(initialTopic, initialType), 150);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTopic, initialType]);

  async function handleGenerate(topicOverride?: string, typeOverride?: NoteType) {
    const effectiveTopic = (topicOverride ?? topic).trim();
    const effectiveType: NoteType = typeOverride ?? noteType;

    if (!effectiveTopic) {
      toast.error('Please enter a topic');
      return;
    }

    setIsGenerating(true);
    setGeneratedNote(null);

    try {
      const brevityLevel = BREVITY_MAP[effectiveType] || '500';

      const response = await fetch('/api/notes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: effectiveTopic,
          subject,
          brevityLevel,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.note) {
        throw new Error(data?.error || 'Failed to generate notes');
      }

      const note: GeneratedNote = data.note;
      setGeneratedNote(note);
      toast.success('Notes generated and saved to your library');
    } catch (error) {
      console.error('Error generating notes:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate notes');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleShare() {
    if (!generatedNote) return;
    const url =
      typeof window !== 'undefined'
        ? generatedNote.id
          ? `${window.location.origin}/dashboard/notes/${generatedNote.id}`
          : window.location.href
        : '';

    try {
      // Prefer native share sheet on mobile, fall back to clipboard.
      if (typeof navigator !== 'undefined' && 'share' in navigator) {
        await navigator.share({
          title: generatedNote.title || generatedNote.topic || 'UPSC PrepX AI notes',
          url,
        });
        return;
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
        return;
      }

      toast.info(url);
    } catch (err) {
      // Share sheet cancels throw AbortError — swallow those silently.
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error('Share failed:', err);
      toast.error('Could not share this note');
    }
  }

  function handleOpenInLibrary() {
    if (!generatedNote?.id) {
      toast.error('This note is still being saved — try again in a moment');
      return;
    }
    router.push(`/dashboard/notes/${generatedNote.id}`);
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-4 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/notes"
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
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
        {/* Input Card */}
        <section className="bg-card rounded-3xl p-1 shadow-lg ring-1 ring-border/50">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Sparkles className="w-6 h-6 text-primary group-focus-within:text-[#D4AF37] transition-colors" />
            </div>
            <input
              className="block w-full rounded-2xl border-0 py-4 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary/20 text-lg font-medium bg-transparent"
              placeholder="Enter a topic for study notes..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isGenerating}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isGenerating) {
                  e.preventDefault();
                  void handleGenerate();
                }
              }}
            />
          </div>

          {/* Note Type Chips */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-3 pb-3">
            {NOTE_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setNoteType(type)}
                disabled={isGenerating}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                  noteType === type
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
                disabled={isGenerating}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  subject === sub.name
                    ? `${sub.color} ring-2 ring-current/30`
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>

          {/* Generate */}
          <div className="px-3 pb-3">
            <ShimmerButton
              className="w-full h-12 text-base font-bold"
              onClick={() => void handleGenerate()}
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
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm z-10">
              AI Generated
            </div>

            <article className="bg-card rounded-3xl p-6 sm:p-8 shadow-lg ring-1 ring-border/50">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <p className="text-muted-foreground">AI is generating your notes...</p>
                  <p className="text-xs text-muted-foreground">
                    This may take 30–60 seconds. We&apos;re pulling from whitelisted UPSC sources in
                    real time.
                  </p>
                </div>
              ) : generatedNote ? (
                <>
                  <div className="border-b border-dashed border-border pb-4 mb-6">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">
                        {subject}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">Just now</span>
                    </div>
                    <h2 className="text-3xl font-bold text-foreground leading-tight">
                      {generatedNote.title || generatedNote.topic || topic}
                    </h2>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      <span className="inline-flex items-center rounded-md bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-700 dark:text-yellow-400 ring-1 ring-inset ring-yellow-500/20">
                        {noteType}
                      </span>
                      {typeof generatedNote.wordCount === 'number' && (
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                          {generatedNote.wordCount} words
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    {generatedNote.contentHtml ? (
                      <div dangerouslySetInnerHTML={{ __html: generatedNote.contentHtml }} />
                    ) : (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: (generatedNote.content || '').replace(/\n/g, '<br/>'),
                        }}
                      />
                    )}
                  </div>

                  {Array.isArray(generatedNote.keyPoints) && generatedNote.keyPoints.length > 0 && (
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

                  {Array.isArray(generatedNote.sources) && generatedNote.sources.length > 0 && (
                    <div className="mt-4 text-xs text-muted-foreground">
                      <span className="font-semibold uppercase tracking-wider">Sources: </span>
                      {generatedNote.sources
                        .map((s) => s?.name)
                        .filter(Boolean)
                        .join(' • ')}
                    </div>
                  )}
                </>
              ) : null}
            </article>
          </section>
        )}
      </main>

      {/* Floating Action Toolbar */}
      {generatedNote && !isGenerating && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <div className="flex items-center gap-1 p-2 pl-4 pr-4 bg-card/90 backdrop-blur-xl shadow-2xl rounded-full border border-border/50 ring-1 ring-white/10">
            <button
              type="button"
              onClick={handleOpenInLibrary}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors text-muted-foreground"
              title="Open in Library"
              aria-label="Open in Library"
            >
              <ExternalLink className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => void handleShare()}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors text-muted-foreground"
              title="Share link"
              aria-label="Share link"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-border mx-2" />
            <button
              onClick={() => void handleGenerate()}
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

export default function NewNotePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <NewNoteInner />
    </Suspense>
  );
}
