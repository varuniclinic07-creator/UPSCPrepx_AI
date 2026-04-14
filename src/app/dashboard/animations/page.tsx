'use client';

import { useEffect, useState } from 'react';
import { Play, Loader2, Plus, Video, Clock, CheckCircle, AlertCircle, Sparkles, Film, X } from 'lucide-react';
import { Loading } from '@/components/ui/loading';

interface AnimationItem {
  id: string; topic: string; subject: string; description: string;
  status: 'queued' | 'rendering' | 'completed' | 'failed';
  duration: number | null; video_url: string | null; created_at: string;
}

const STATUS_CFG: Record<string, { color: string; label: string; icon: any }> = {
  queued: { color: 'amber', label: 'Queued', icon: Clock },
  rendering: { color: 'blue', label: 'Rendering...', icon: Loader2 },
  completed: { color: 'green', label: 'Completed', icon: CheckCircle },
  failed: { color: 'red', label: 'Failed', icon: AlertCircle },
};

const ANIM_TYPES = [
  { value: 'concept', label: 'Concept Explanation' },
  { value: 'case_study', label: 'Case Study' },
  { value: 'diagram', label: 'Diagram / Flowchart' },
];

export default function AnimationsPage() {
  const [animations, setAnimations] = useState<AnimationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formTopic, setFormTopic] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formType, setFormType] = useState('concept');

  useEffect(() => { fetchAnimations(); }, []);

  async function fetchAnimations() {
    try {
      const res = await fetch('/api/content/queue?content_type=animation_prompt');
      if (res.ok) {
        const data = await res.json();
        setAnimations((data.items || data.queue || []).map((item: any) => ({
          id: item.id, topic: item.topic || item.payload?.topic || 'Untitled',
          subject: item.subject || item.payload?.subject || '',
          description: item.description || item.payload?.description || '',
          status: item.status || 'queued', duration: item.duration || item.payload?.duration || null,
          video_url: item.video_url || item.result_url || null, created_at: item.created_at,
        })));
      }
    } catch (err) { console.error('Error fetching animations:', err); }
    finally { setLoading(false); }
  }

  async function handleGenerate() {
    if (!formTopic.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/content/queue', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_type: 'animation_prompt', topic: formTopic.trim(), subject: formSubject.trim() || undefined, animation_type: formType }),
      });
      if (res.ok) { setDialogOpen(false); setFormTopic(''); setFormSubject(''); setFormType('concept'); await fetchAnimations(); }
    } catch (err) { console.error('Error generating animation:', err); }
    finally { setGenerating(false); }
  }

  if (loading) return <Loading />;
  const completed = animations.filter((a) => a.status === 'completed').length;
  const inProgress = animations.filter((a) => a.status === 'rendering' || a.status === 'queued').length;

  return (
    <div className="flex flex-col gap-8 animate-slide-down">
      <header className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 self-start w-fit">
          <Film className="w-3 h-3 text-violet-500" />
          <span className="text-violet-500 text-xs font-bold uppercase tracking-wider">Manim Studio</span>
        </div>
        <h1 className="text-4xl lg:text-5xl font-light text-foreground leading-[1.1] tracking-tight">
          Animation <span className="font-bold text-gradient">Gallery</span>
        </h1>
        <p className="text-lg text-muted-foreground font-light max-w-xl">Visual explanations powered by Manim for complex UPSC concepts</p>
      </header>

      <div className="grid grid-cols-3 gap-4">
        {[{ v: animations.length, l: 'Total', c: 'foreground' }, { v: completed, l: 'Completed', c: 'green-500' }, { v: inProgress, l: 'In Progress', c: 'amber-500' }].map((s) => (
          <div key={s.l} className="bento-card p-4 text-center">
            <p className={`text-2xl font-bold text-${s.c}`}>{s.v}</p>
            <p className="text-xs text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </div>

      <button onClick={() => setDialogOpen(true)} className="bento-card p-5 flex items-center gap-4 hover:border-primary/30 hover:bg-card/80 transition-all cursor-pointer">
        <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center"><Plus className="w-6 h-6 text-violet-500" /></div>
        <div className="text-left">
          <h3 className="text-lg font-semibold text-foreground">Generate Animation</h3>
          <p className="text-sm text-muted-foreground">Create a Manim animation for any UPSC concept</p>
        </div>
        <Sparkles className="w-5 h-5 text-violet-500 ml-auto" />
      </button>

      {animations.length === 0 ? (
        <div className="bento-card text-center p-12">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4"><Video className="w-8 h-8 text-violet-500" /></div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No animations yet</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">Generate your first Manim animation to visualize complex concepts</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {animations.map((anim) => {
            const cfg = STATUS_CFG[anim.status] || STATUS_CFG.queued;
            const StatusIcon = cfg.icon;
            return (
              <div key={anim.id} className="group relative flex flex-col p-5 rounded-2xl bg-card/40 border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all overflow-hidden">
                <div className="relative aspect-video bg-gradient-to-br from-violet-500/10 via-primary/5 to-secondary/10 rounded-xl mb-4 flex items-center justify-center border border-border/30 overflow-hidden">
                  {anim.status === 'completed' && anim.video_url ? (
                    <button onClick={() => setPreviewUrl(anim.video_url)} className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors">
                      <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><Play className="w-6 h-6 text-violet-600 ml-0.5" /></div>
                    </button>
                  ) : anim.status === 'rendering' ? (
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  ) : <Video className="w-10 h-10 text-muted-foreground/30" />}
                </div>
                <h4 className="font-semibold text-foreground text-sm truncate">{anim.topic}</h4>
                {anim.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{anim.description}</p>}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                  {anim.subject && <span className="text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">{anim.subject}</span>}
                  <span className={`inline-flex items-center gap-1 text-xs font-medium text-${cfg.color}-500`}>
                    <StatusIcon className={`w-3 h-3 ${anim.status === 'rendering' ? 'animate-spin' : ''}`} />{cfg.label}
                  </span>
                  {anim.duration && <span className="text-xs text-muted-foreground">{anim.duration}s</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 rounded-2xl bg-card border border-border p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Generate Animation</h3>
              <button onClick={() => setDialogOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Topic</label>
                <input type="text" placeholder="e.g. Plate Tectonics, Parliamentary System..." value={formTopic} onChange={(e) => setFormTopic(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-muted/30 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Subject (optional)</label>
                <input type="text" placeholder="e.g. Geography, Polity..." value={formSubject} onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-muted/30 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Animation Type</label>
                <select value={formType} onChange={(e) => setFormType(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-muted/30 border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                  {ANIM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <button onClick={handleGenerate} disabled={generating || !formTopic.trim()}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generating ? 'Generating...' : 'Generate Animation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setPreviewUrl(null)}>
          <div className="w-full max-w-3xl mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end mb-2"><button onClick={() => setPreviewUrl(null)} className="text-white/70 hover:text-white"><X className="w-6 h-6" /></button></div>
            <video src={previewUrl} controls autoPlay className="w-full rounded-xl shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
