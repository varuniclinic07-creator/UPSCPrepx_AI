import { Suspense } from 'react';
import Link from 'next/link';
import { Plus, Search, BookOpen, Clock, Tag, Sparkles, ArrowRight, FileText, History, Bookmark } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/auth-config';
import { getNotesByUser } from '@/lib/services/notes-service';
import { BentoGrid, BentoCard } from '@/components/magic-ui/bento-grid';
import { ShimmerButton } from '@/components/magic-ui/shimmer-button';
import { BorderBeamInput } from '@/components/magic-ui/border-beam';
import { QuickGenerate } from '@/components/living-content/quick-generate';
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
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-sm text-center p-12">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No notes yet</h3>
        <p className="text-white/40 mb-6 max-w-sm mx-auto">
          Generate your first AI-powered study notes to start mastering UPSC topics
        </p>
        <Link href="/dashboard/notes/new">
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
          <div className="group relative flex flex-col justify-between p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.05] transition-all duration-500 overflow-hidden cursor-pointer h-full">
            {/* Glow effect */}
            <div className="absolute -right-12 -top-12 w-24 h-24 bg-blue-500/10 rounded-full blur-[50px] group-hover:bg-blue-500/20 transition-all duration-500" />

            <div className="flex flex-col gap-4 z-10">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/[0.05] text-white/40 group-hover:text-blue-400 transition-colors">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className={`badge badge-${subjectColors[note.subject] || 'primary'}`}>
                  {note.subject}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors line-clamp-2">
                  {note.title}
                </h3>
                <p className="text-sm text-white/40 line-clamp-2">
                  {note.content?.summary || 'AI-generated comprehensive notes'}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.05] flex justify-between items-center z-10">
              <span className="text-xs text-white/40 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(note.createdAt).toLocaleDateString()}
              </span>
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-[10px] text-white/40" title="Summary">
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 self-start w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">AI Generator v2.0</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-light text-white leading-[1.1] tracking-tight">
            Smart <span className="font-bold text-gradient">Study Notes</span>
          </h1>
          <p className="text-lg text-white/40 font-light max-w-xl">
            Transform complex UPSC topics into summaries, flashcards, and timelines instantly.
          </p>
        </div>
      </header>

      {/* AI Search Section */}
      <section className="relative z-20">
        <BorderBeamInput className="w-full">
          <div className="relative flex items-center w-full h-16 lg:h-20 bg-white/[0.03] rounded-2xl border border-white/[0.05] shadow-lg focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all overflow-hidden">
            <div className="pl-6 pr-4 text-white/40">
              <Sparkles className="w-6 h-6" />
            </div>
            <input
              className="w-full h-full bg-transparent border-none focus:ring-0 focus:outline-none text-white placeholder:text-white/40 text-lg font-medium"
              placeholder="Enter a topic (e.g., India's Foreign Policy 2024)..."
              type="text"
            />
            <div className="pr-3">
              <Link href="/dashboard/notes/new">
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
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/[0.08] border border-white/[0.05] hover:border-white/[0.1] transition-all text-sm text-white/40 hover:text-white group">
            <FileText className="w-4 h-4 text-blue-400/70 group-hover:text-blue-400" />
            Generate Summary
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/[0.08] border border-white/[0.05] hover:border-white/[0.1] transition-all text-sm text-white/40 hover:text-white group">
            <BookOpen className="w-4 h-4 text-secondary/70 group-hover:text-secondary" />
            Create Flashcards
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/[0.08] border border-white/[0.05] hover:border-white/[0.1] transition-all text-sm text-white/40 hover:text-white group">
            <History className="w-4 h-4 text-amber-400/70 group-hover:text-amber-400" />
            Extract Timeline
          </button>
        </div>
      </section>

      {/* Living Content — Quick Generate */}
      <QuickGenerate mode="notes" />

      {/* Subject Filter Tags */}
      <div className="flex flex-wrap gap-2">
        {subjects.map((subject) => (
          <button
            key={subject.label}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${subject.active
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                : 'bg-white/5 text-white/40 hover:text-white border border-white/[0.05] hover:border-white/[0.1]'
              }`}
          >
            {subject.label}
          </button>
        ))}
      </div>

      {/* Recently Generated Section */}
      <section className="flex flex-col gap-6">
        <div className="flex items-end justify-between px-1">
          <h2 className="text-2xl font-medium text-white tracking-tight">Recently Generated</h2>
          <Link
            href="/dashboard/notes/all"
            className="text-sm text-blue-400 hover:text-white transition-colors flex items-center gap-1"
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
        <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-sm h-48 shimmer" />
      ))}
    </div>
  );
}
