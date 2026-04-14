'use client';

import { useEffect, useState } from 'react';
import { Scale, Loader2, Plus, PenTool, CheckCircle, Video, X, Send, Sparkles } from 'lucide-react';
import { Loading } from '@/components/ui/loading';

interface CaseStudy {
  id: string; title: string; scenario: string; dilemma: string;
  framework: string; subject: string; has_animation: boolean; animation_url?: string | null;
}
interface EvalResult {
  score: number; grade: string; feedback: string; strengths: string[]; improvements: string[];
}

export default function EthicsCaseStudyPage() {
  const [cases, setCases] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeCase, setActiveCase] = useState<CaseStudy | null>(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => { fetchCases(); }, []);

  async function fetchCases() {
    try {
      const res = await fetch('/api/content/knowledge-nodes?subject=Ethics&type=case_study');
      if (res.ok) {
        const data = await res.json();
        setCases((data.nodes || data.items || []).map((n: any) => ({
          id: n.id, title: n.title || n.topic || 'Untitled Case Study',
          scenario: n.content?.scenario || n.scenario || n.content?.description || '',
          dilemma: n.content?.dilemma || n.dilemma || '',
          framework: n.content?.framework || n.framework || '',
          subject: n.subject || 'Ethics',
          has_animation: !!n.animation_url || !!n.content?.animation_url,
          animation_url: n.animation_url || n.content?.animation_url || null,
        })));
      }
    } catch (err) { console.error('Error fetching ethics cases:', err); }
    finally { setLoading(false); }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch('/api/content/knowledge-nodes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: 'Ethics', type: 'case_study', action: 'generate' }),
      });
      if (res.ok) await fetchCases();
    } catch (err) { console.error('Error generating case study:', err); }
    finally { setGenerating(false); }
  }

  async function handleSubmitAnswer() {
    if (!activeCase || !answer.trim()) return;
    setSubmitting(true); setEvalResult(null);
    try {
      const res = await fetch('/api/eval/mains/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_text: `Ethics Case Study: ${activeCase.title}\n\n${activeCase.scenario}\n\nEthical Dilemma: ${activeCase.dilemma}`,
          answer_text: answer.trim(), subject: 'GS4', topic: activeCase.title, word_limit: 300,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const ev = data.evaluation || data;
        setEvalResult({
          score: ev.overall_percentage ?? ev.score ?? 0, grade: ev.grade || '',
          feedback: ev.overall_feedback || ev.feedback || '',
          strengths: ev.strengths || [], improvements: ev.improvements || ev.areas_for_improvement || [],
        });
      }
    } catch (err) { console.error('Error submitting answer:', err); }
    finally { setSubmitting(false); }
  }

  if (loading) return <Loading />;

  // Practice view
  if (activeCase) {
    return (
      <div className="flex flex-col gap-6 animate-slide-down max-w-4xl mx-auto">
        <button onClick={() => { setActiveCase(null); setAnswer(''); setEvalResult(null); }}
          className="self-start text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">&larr; Back to case studies</button>

        <div className="bento-card p-6 space-y-4">
          <h2 className="text-2xl font-bold text-foreground">{activeCase.title}</h2>
          <div>
            <h4 className="text-sm font-semibold text-primary mb-1">Scenario</h4>
            <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{activeCase.scenario}</p>
          </div>
          {activeCase.dilemma && (
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <h4 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-1">Ethical Dilemma</h4>
              <p className="text-foreground text-sm">{activeCase.dilemma}</p>
            </div>
          )}
          {activeCase.framework && (
            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
              <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">Framework for Analysis</h4>
              <p className="text-foreground text-sm whitespace-pre-wrap">{activeCase.framework}</p>
            </div>
          )}
          {activeCase.has_animation && activeCase.animation_url && (
            <button onClick={() => setPreviewUrl(activeCase.animation_url!)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 transition-colors text-sm font-medium">
              <Video className="w-4 h-4" /> Watch Animation
            </button>
          )}
        </div>

        <div className="bento-card p-6 space-y-4">
          <div className="flex items-center gap-2"><PenTool className="w-5 h-5 text-primary" /><h3 className="text-lg font-semibold text-foreground">Write Your Answer</h3></div>
          <textarea value={answer} onChange={(e) => setAnswer(e.target.value)}
            placeholder="Write your answer applying ethical frameworks, stakeholder analysis, and value-based reasoning..."
            className="w-full h-48 p-4 rounded-xl bg-muted/30 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y text-sm" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{answer.trim().split(/\s+/).filter(Boolean).length} words</span>
            <button onClick={handleSubmitAnswer} disabled={submitting || !answer.trim()}
              className="h-10 px-5 rounded-xl bg-primary text-primary-foreground font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all text-sm">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? 'Evaluating...' : 'Submit for Evaluation'}
            </button>
          </div>
        </div>

        {evalResult && (
          <div className="bento-card p-6 space-y-4 border-l-4 border-l-primary">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /><h3 className="text-lg font-semibold text-foreground">Evaluation</h3></div>
              <div className="text-right">
                <span className="text-2xl font-bold text-primary">{evalResult.score}%</span>
                {evalResult.grade && <span className="ml-2 text-sm text-muted-foreground">({evalResult.grade})</span>}
              </div>
            </div>
            {evalResult.feedback && <p className="text-foreground text-sm">{evalResult.feedback}</p>}
            {evalResult.strengths.length > 0 && (
              <div><h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-1">Strengths</h4>
                <ul className="space-y-1">{evalResult.strengths.map((s, i) => <li key={i} className="text-sm text-foreground">+ {s}</li>)}</ul></div>
            )}
            {evalResult.improvements.length > 0 && (
              <div><h4 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-1">Areas for Improvement</h4>
                <ul className="space-y-1">{evalResult.improvements.map((s, i) => <li key={i} className="text-sm text-foreground">- {s}</li>)}</ul></div>
            )}
          </div>
        )}
      </div>
    );
  }

  // List view
  return (
    <div className="flex flex-col gap-8 animate-slide-down">
      <header className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 self-start w-fit">
          <Scale className="w-3 h-3 text-emerald-500" />
          <span className="text-emerald-500 text-xs font-bold uppercase tracking-wider">GS Paper IV</span>
        </div>
        <h1 className="text-4xl lg:text-5xl font-light text-foreground leading-[1.1] tracking-tight">
          Ethics <span className="font-bold text-gradient">Case Studies</span>
        </h1>
        <p className="text-lg text-muted-foreground font-light max-w-xl">Practice ethical reasoning with real-world scenarios and AI evaluation</p>
      </header>

      <button onClick={handleGenerate} disabled={generating}
        className="bento-card p-5 flex items-center gap-4 hover:border-primary/30 hover:bg-card/80 transition-all cursor-pointer">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
          {generating ? <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" /> : <Plus className="w-6 h-6 text-emerald-500" />}
        </div>
        <div className="text-left">
          <h3 className="text-lg font-semibold text-foreground">{generating ? 'Generating...' : 'Generate New Case Study'}</h3>
          <p className="text-sm text-muted-foreground">AI creates a fresh ethics scenario for practice</p>
        </div>
        <Sparkles className="w-5 h-5 text-emerald-500 ml-auto" />
      </button>

      {cases.length === 0 ? (
        <div className="bento-card text-center p-12">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4"><Scale className="w-8 h-8 text-emerald-500" /></div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No case studies yet</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">Generate your first ethics case study to begin practicing</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cases.map((cs) => (
            <div key={cs.id} className="group relative flex flex-col p-6 rounded-2xl bg-card/40 border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all overflow-hidden">
              <div className="absolute -right-12 -top-12 w-24 h-24 bg-emerald-500/10 rounded-full blur-[50px] group-hover:bg-emerald-500/20 transition-all duration-500" />
              <h4 className="font-semibold text-foreground mb-2">{cs.title}</h4>
              <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{cs.scenario}</p>
              {cs.dilemma && <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 line-clamp-1">Dilemma: {cs.dilemma}</p>}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/30">
                <button onClick={() => setActiveCase(cs)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium">
                  <PenTool className="w-3.5 h-3.5" /> Practice
                </button>
                {cs.has_animation && cs.animation_url && (
                  <button onClick={() => setPreviewUrl(cs.animation_url!)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 transition-colors text-sm font-medium">
                    <Video className="w-3.5 h-3.5" /> Animation
                  </button>
                )}
              </div>
            </div>
          ))}
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
