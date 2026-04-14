'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search, BookOpen, Brain, Newspaper, HelpCircle, Map,
  Loader2, FileText, Filter, ArrowRight,
} from 'lucide-react';

const SUBJECTS = [
  'Polity', 'History', 'Geography', 'Economy',
  'Environment', 'Science', 'Ethics', 'Current Affairs',
];

interface SectionData {
  notes: any[];
  quiz: any[];
  currentAffairs: any[];
  mindmap: any | null;
  pyqs: any[];
}

export default function TopicIntelligencePage() {
  const [query, setQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [data, setData] = useState<SectionData>({
    notes: [], quiz: [], currentAffairs: [], mindmap: null, pyqs: [],
  });

  const fetchTopicData = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

    const params = new URLSearchParams({ topic: query.trim() });
    if (subjectFilter) params.set('subject', subjectFilter);

    try {
      const types = ['notes', 'quiz', 'current_affairs', 'mindmap', 'pyq'] as const;
      const results = await Promise.allSettled(
        types.map((t) =>
          fetch(`/api/content/living?${params.toString()}&type=${t}`)
            .then((r) => (r.ok ? r.json() : { items: [] }))
        ),
      );

      const val = (i: number) =>
        results[i].status === 'fulfilled' ? (results[i] as any).value : { items: [] };

      setData({
        notes: val(0).items ?? [],
        quiz: val(1).items ?? [],
        currentAffairs: val(2).items ?? [],
        mindmap: val(3).items?.[0] ?? null,
        pyqs: val(4).items ?? [],
      });
    } catch (err) {
      console.error('Topic intelligence fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const SkeletonCard = () => (
    <div className="animate-pulse rounded-2xl bg-muted/30 border border-border/30 p-5 space-y-3">
      <div className="h-4 bg-muted/50 rounded w-3/4" /><div className="h-3 bg-muted/40 rounded w-full" /><div className="h-3 bg-muted/40 rounded w-1/2" />
    </div>
  );

  const SectionHeader = ({ icon: Icon, title, count }: { icon: any; title: string; count: number }) => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2"><Icon className="w-5 h-5 text-primary" /><h3 className="text-lg font-semibold text-foreground">{title}</h3></div>
      <span className="text-xs text-muted-foreground bg-muted/40 px-2 py-1 rounded-full">{count} found</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 animate-slide-down">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 self-start w-fit">
          <Brain className="w-3 h-3 text-indigo-500" />
          <span className="text-indigo-500 text-xs font-bold uppercase tracking-wider">
            Knowledge Graph
          </span>
        </div>
        <h1 className="text-4xl lg:text-5xl font-light text-foreground leading-[1.1] tracking-tight">
          Topic <span className="font-bold text-gradient">Intelligence</span>
        </h1>
        <p className="text-lg text-muted-foreground font-light max-w-xl">
          Aggregate all knowledge for any UPSC topic in one place
        </p>
      </header>

      {/* Subject Filter Chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSubjectFilter(null)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            !subjectFilter
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/40 text-muted-foreground hover:bg-muted/60'
          }`}
        >
          <Filter className="w-3 h-3" /> All Subjects
        </button>
        {SUBJECTS.map((s) => (
          <button
            key={s}
            onClick={() => setSubjectFilter(subjectFilter === s ? null : s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              subjectFilter === s
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/40 text-muted-foreground hover:bg-muted/60'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Search Box */}
      <div className="bento-card p-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Enter a topic, e.g. Fundamental Rights, Green Revolution..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchTopicData()}
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted/30 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button
            onClick={fetchTopicData}
            disabled={loading || !query.trim()}
            className="h-12 px-6 rounded-xl bg-primary text-primary-foreground font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            Search
          </button>
        </div>
      </div>

      {/* Results */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {searched && !loading && (
        <div className="space-y-8">
          {/* Notes Section */}
          <section>
            <SectionHeader icon={FileText} title="Notes" count={data.notes.length} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.notes.length > 0 ? data.notes.slice(0, 4).map((n: any, i: number) => (
                <Link key={i} href={`/dashboard/notes/${n.id || n.slug || ''}`}>
                  <div className="group p-5 rounded-2xl bg-card/40 border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all cursor-pointer">
                    <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{n.title || n.topic}</h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{n.summary || n.content?.summary || ''}</p>
                    <span className="inline-flex items-center gap-1 text-xs text-primary mt-2">Read more <ArrowRight className="w-3 h-3" /></span>
                  </div>
                </Link>
              )) : <p className="text-muted-foreground text-sm col-span-2">No notes found for this topic.</p>}
            </div>
          </section>

          {/* Quiz Section */}
          <section>
            <SectionHeader icon={HelpCircle} title="Quiz Questions" count={data.quiz.length} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.quiz.length > 0 ? data.quiz.slice(0, 4).map((q: any, i: number) => (
                <div key={i} className="p-5 rounded-2xl bg-card/40 border border-border/50">
                  <p className="text-foreground text-sm">{q.question || q.question_text}</p>
                  <span className="text-xs text-muted-foreground mt-2 block">{q.subject} - {q.difficulty || 'Medium'}</span>
                </div>
              )) : <p className="text-muted-foreground text-sm col-span-2">No quiz questions found.</p>}
            </div>
          </section>

          {/* Current Affairs Section */}
          <section>
            <SectionHeader icon={Newspaper} title="Current Affairs" count={data.currentAffairs.length} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.currentAffairs.length > 0 ? data.currentAffairs.slice(0, 4).map((a: any, i: number) => (
                <div key={i} className="p-5 rounded-2xl bg-card/40 border border-border/50">
                  <h4 className="font-semibold text-foreground text-sm">{a.title || a.headline}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.summary || a.content}</p>
                  <span className="text-xs text-muted-foreground mt-1 block">{a.date || ''}</span>
                </div>
              )) : <p className="text-muted-foreground text-sm col-span-2">No current affairs found.</p>}
            </div>
          </section>

          {/* Mind Map Section */}
          <section>
            <SectionHeader icon={Map} title="Mind Map" count={data.mindmap ? 1 : 0} />
            {data.mindmap ? (
              <Link href={`/dashboard/mindmaps/${data.mindmap.id || ''}`}>
                <div className="p-5 rounded-2xl bg-card/40 border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all cursor-pointer">
                  <h4 className="font-semibold text-foreground">{data.mindmap.topic || query}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{data.mindmap.nodes?.length || 0} nodes</p>
                  <span className="inline-flex items-center gap-1 text-xs text-primary mt-2">View map <ArrowRight className="w-3 h-3" /></span>
                </div>
              </Link>
            ) : (
              <p className="text-muted-foreground text-sm">No mind map found. <Link href="/dashboard/mindmaps" className="text-primary hover:underline">Generate one</Link></p>
            )}
          </section>

          {/* PYQs Section */}
          <section>
            <SectionHeader icon={BookOpen} title="Related PYQs" count={data.pyqs.length} />
            <div className="grid grid-cols-1 gap-3">
              {data.pyqs.length > 0 ? data.pyqs.slice(0, 5).map((p: any, i: number) => (
                <div key={i} className="p-4 rounded-2xl bg-card/40 border border-border/50">
                  <p className="text-foreground text-sm">{p.question || p.question_text}</p>
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                    {p.year && <span>Year: {p.year}</span>}
                    {p.paper && <span>Paper: {p.paper}</span>}
                    {p.marks && <span>Marks: {p.marks}</span>}
                  </div>
                </div>
              )) : <p className="text-muted-foreground text-sm">No PYQs found for this topic.</p>}
            </div>
          </section>
        </div>
      )}

      {/* Empty State */}
      {!searched && !loading && (
        <div className="bento-card text-center p-12">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-indigo-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Search any UPSC topic</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Enter a topic above to see aggregated notes, quizzes, current affairs, mind maps, and PYQs
          </p>
        </div>
      )}
    </div>
  );
}
