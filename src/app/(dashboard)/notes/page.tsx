import { Suspense } from 'react';
import Link from 'next/link';
import { Plus, Search, BookOpen, Clock, Tag, Sparkles, ArrowRight, FileText, History, Bookmark } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/auth-config';
import { getNotesByUser } from '@/lib/services/notes-service';
import { BentoGrid, BentoCard } from '@/components/magic-ui/bento-grid';
import { ShimmerButton } from '@/components/magic-ui/shimmer-button';
import { BorderBeamInput } from '@/components/magic-ui/border-beam';
import type { Note } from '@/types';

export const metadata = {
  title: 'Smart Notes',
};

async function NotesList() {
  const user = await getCurrentUser();

  if (!user) {
    return <div>Please login to view notes</div>;
  }

  let notes: Note[] = [];
  try {
    notes = await getNotesByUser(user.id);
  } catch (error) {
    console.error('Error fetching notes:', error);
    notes = [];
  }

  if (notes.length === 0) {
    return (
      <div className="bento-card text-center p-12">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No notes yet</h3>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
          Generate your first AI-powered study notes to start mastering UPSC topics
        </p>
        <Link href="/notes/new">
          <ShimmerButton className="px-6 py-3">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Notes
          </ShimmerButton>
        </Link>
      </div>
    );
  }

  // Group notes by subject for badges
  const subjectColors: Record<string, string> = {
    'Polity': 'primary',
    'Economy': 'secondary',
    'History': 'accent',
    'Geography': 'success',
    'Science': 'warning',
    'Environment': 'success',
  };

  return (
    <BentoGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {notes.map((note) => (
        <Link key={note.id} href={`/notes/${note.id}`}>
          <div className="group relative flex flex-col justify-between p-6 rounded-3xl bg-card/40 border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all duration-500 overflow-hidden cursor-pointer h-full">
            {/* Glow effect */}
            <div className="absolute -right-12 -top-12 w-24 h-24 bg-primary/20 rounded-full blur-[50px] group-hover:bg-primary/30 transition-all duration-500" />

            <div className="flex flex-col gap-4 z-10">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center border border-border/50 text-muted-foreground group-hover:text-primary transition-colors">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className={`badge badge-${subjectColors[note.subject] || 'primary'}`}>
                  {note.subject}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-2">
                  {note.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {note.content?.summary || 'AI-generated comprehensive notes'}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border/30 flex justify-between items-center z-10">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(note.createdAt).toLocaleDateString()}
              </span>
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-card border border-border/50 flex items-center justify-center text-[10px] text-muted-foreground" title="Summary">
                  <FileText className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </BentoGrid>
  );
}

export default function NotesPage() {
  const subjects = [
    { label: 'All', active: true },
    { label: 'Polity', active: false },
    { label: 'Economy', active: false },
    { label: 'History', active: false },
    { label: 'Geography', active: false },
    { label: 'Science', active: false },
    { label: 'Environment', active: false },
  ];

  return (
    <div className="flex flex-col gap-8 animate-slide-down">
      {/* Header */}
      <header className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 self-start w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-primary text-xs font-bold uppercase tracking-wider">AI Generator v2.0</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-light text-foreground leading-[1.1] tracking-tight">
            Smart <span className="font-bold text-gradient">Study Notes</span>
          </h1>
          <p className="text-lg text-muted-foreground font-light max-w-xl">
            Transform complex UPSC topics into summaries, flashcards, and timelines instantly.
          </p>
        </div>
      </header>

      {/* AI Search Section */}
      <section className="relative z-20">
        <BorderBeamInput className="w-full">
          <div className="relative flex items-center w-full h-16 lg:h-20 bg-card rounded-2xl border border-border/50 shadow-lg focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all overflow-hidden">
            <div className="pl-6 pr-4 text-muted-foreground">
              <Sparkles className="w-6 h-6" />
            </div>
            <input
              className="w-full h-full bg-transparent border-none focus:ring-0 focus:outline-none text-foreground placeholder:text-muted-foreground text-lg font-medium"
              placeholder="Enter a topic (e.g., India's Foreign Policy 2024)..."
              type="text"
            />
            <div className="pr-3">
              <Link href="/notes/new">
                <ShimmerButton className="h-10 lg:h-12 px-6 text-sm">
                  Generate
                  <ArrowRight className="w-4 h-4 ml-2" />
                </ShimmerButton>
              </Link>
            </div>
          </div>
        </BorderBeamInput>

        {/* Quick Action Chips */}
        <div className="flex flex-wrap gap-3 mt-6">
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 hover:bg-muted border border-border/50 hover:border-primary/30 transition-all text-sm text-muted-foreground hover:text-foreground group">
            <FileText className="w-4 h-4 text-primary/70 group-hover:text-primary" />
            Generate Summary
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 hover:bg-muted border border-border/50 hover:border-secondary/30 transition-all text-sm text-muted-foreground hover:text-foreground group">
            <BookOpen className="w-4 h-4 text-secondary/70 group-hover:text-secondary" />
            Create Flashcards
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 hover:bg-muted border border-border/50 hover:border-accent/30 transition-all text-sm text-muted-foreground hover:text-foreground group">
            <History className="w-4 h-4 text-amber-400/70 group-hover:text-amber-400" />
            Extract Timeline
          </button>
        </div>
      </section>

      {/* Subject Filter Tags */}
      <div className="flex flex-wrap gap-2">
        {subjects.map((subject) => (
          <button
            key={subject.label}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${subject.active
                ? 'bg-primary/20 text-primary border border-primary/20'
                : 'bg-muted/50 text-muted-foreground hover:text-foreground border border-border/50 hover:border-primary/30'
              }`}
          >
            {subject.label}
          </button>
        ))}
      </div>

      {/* Recently Generated Section */}
      <section className="flex flex-col gap-6">
        <div className="flex items-end justify-between px-1">
          <h2 className="text-2xl font-medium text-foreground tracking-tight">Recently Generated</h2>
          <Link
            href="/notes/all"
            className="text-sm text-primary hover:text-foreground transition-colors flex items-center gap-1"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <Suspense fallback={<NotesLoading />}>
          <NotesList />
        </Suspense>
      </section>
    </div>
  );
}

function NotesLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bento-card h-48 shimmer" />
      ))}
    </div>
  );
}