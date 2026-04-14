'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Props {
  jobId: string;
  topic: string;
  subject: string;
  initialStatus: string;
  initialProgress: number;
  initialPhase?: string;
}

const PHASE_LABELS: Record<string, string> = {
  outline: 'Generating outline...',
  scripting: 'Writing scripts...',
  visuals: 'Creating visuals...',
  audio: 'Generating voiceover...',
  compiling: 'Assembling video...',
};

export function LectureProgressCard({ jobId, topic, subject, initialStatus, initialProgress, initialPhase }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [progress, setProgress] = useState(initialProgress);
  const [phase, setPhase] = useState(initialPhase || '');

  useEffect(() => {
    if (status === 'ready' || status === 'failed' || status === 'cancelled') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/lectures/${jobId}/status`);
        const data = await res.json();
        if (data.status) setStatus(data.status);
        if (data.progress_percent != null) setProgress(data.progress_percent);
        if (data.current_phase) setPhase(data.current_phase);
        if (data.status === 'ready' || data.status === 'failed') clearInterval(interval);
      } catch { /* ignore polling errors */ }
    }, 8000);

    return () => clearInterval(interval);
  }, [jobId, status]);

  const phaseLabel = PHASE_LABELS[phase] || phase || 'Queued...';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{topic}</h3>
          <p className="text-xs text-gray-500">{subject}</p>
        </div>
        {status === 'ready' && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
        {status === 'failed' && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
        {(status === 'queued' || status === 'processing' || status === 'outline' || status === 'scripting' || status === 'visuals' || status === 'audio' || status === 'compiling') && (
          <Loader2 className="w-5 h-5 text-saffron-500 animate-spin flex-shrink-0" />
        )}
        {status === 'queued' && <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />}
      </div>

      {status !== 'ready' && status !== 'failed' && (
        <>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-saffron-500 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(progress, 2)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">{phaseLabel} ({Math.round(progress)}%)</p>
        </>
      )}

      {status === 'failed' && (
        <p className="text-xs text-red-600">{phase || 'Generation failed'}</p>
      )}
    </div>
  );
}
