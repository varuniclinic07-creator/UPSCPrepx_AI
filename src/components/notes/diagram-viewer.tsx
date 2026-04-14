'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Loader2, ImageIcon } from 'lucide-react';

interface VisualAid {
  type: 'flowchart' | 'timeline' | 'comparison' | 'hierarchy';
  title: string;
  mermaidCode?: string;
  animationPrompt?: string;
}

interface Props {
  visualAids: VisualAid[];
  noteSlug: string;
}

export function DiagramViewer({ visualAids, noteSlug }: Props) {
  if (!visualAids || visualAids.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
        <ImageIcon className="w-5 h-5 text-purple-600" /> Visual Aids
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visualAids.map((aid, i) => (
          <DiagramCard key={i} aid={aid} noteSlug={noteSlug} index={i} />
        ))}
      </div>
    </div>
  );
}

function DiagramCard({ aid, noteSlug, index }: { aid: VisualAid; noteSlug: string; index: number }) {
  const [mermaidSvg, setMermaidSvg] = useState<string>('');
  const [animating, setAnimating] = useState(false);
  const [animationUrl, setAnimationUrl] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aid.mermaidCode) return;

    // Dynamic import of mermaid
    import('mermaid').then(async (mermaid) => {
      mermaid.default.initialize({ startOnLoad: false, theme: 'neutral' });
      try {
        const { svg } = await mermaid.default.render(`diagram-${index}`, aid.mermaidCode!);
        setMermaidSvg(svg);
      } catch (err) {
        console.error('Mermaid render error:', err);
        setMermaidSvg(`<p class="text-sm text-gray-400">Diagram rendering failed</p>`);
      }
    }).catch(() => {
      setMermaidSvg(`<p class="text-sm text-gray-400">Mermaid not available</p>`);
    });
  }, [aid.mermaidCode, index]);

  const triggerAnimation = async () => {
    if (!aid.animationPrompt) return;
    setAnimating(true);

    try {
      const res = await fetch(`/api/notes/${noteSlug}/animate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagramType: aid.type,
          description: aid.animationPrompt,
          title: aid.title,
        }),
      });
      const data = await res.json();
      if (data.videoUrl) setAnimationUrl(data.videoUrl);
    } catch {
      // Animation generation failed
    }
    setAnimating(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h4 className="font-semibold text-sm text-gray-900">{aid.title}</h4>
        <span className="text-xs text-gray-500 capitalize">{aid.type}</span>
      </div>

      <div className="p-4">
        {animationUrl ? (
          <video src={animationUrl} controls className="w-full rounded-lg" />
        ) : mermaidSvg ? (
          <div
            ref={containerRef}
            className="overflow-auto max-h-64"
            dangerouslySetInnerHTML={{ __html: mermaidSvg }}
          />
        ) : (
          <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 text-sm">
            No diagram available
          </div>
        )}
      </div>

      {aid.animationPrompt && !animationUrl && (
        <div className="px-4 pb-3">
          <button
            onClick={triggerAnimation}
            disabled={animating}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 disabled:opacity-50 transition"
          >
            {animating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            {animating ? 'Generating...' : 'Watch Animation'}
          </button>
        </div>
      )}
    </div>
  );
}
