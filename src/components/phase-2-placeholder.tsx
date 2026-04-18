// src/components/phase-2-placeholder.tsx
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { DriftingOrbs, MotionReveal, PulseDot } from '@/components/brand/animated-backdrop';

type Props = {
  title: string;
  tagline: string;
  whatsComing: string[];
  parkedReason: string;
  targetPhase: 'Phase 2A' | 'Phase 2B' | 'Phase 3' | 'Phase 4';
  backHref?: string;
};

export function Phase2Placeholder({
  title, tagline, whatsComing, parkedReason, targetPhase, backHref = '/dashboard',
}: Props) {
  return (
    <div className="relative min-h-[70vh] flex items-center justify-center p-6">
      <DriftingOrbs palette={['rgba(249,115,22,0.18)', 'rgba(59,130,246,0.18)']} />
      <MotionReveal>
        <div className="relative max-w-2xl mx-auto rounded-2xl bg-white/[0.03] border border-white/[0.05] p-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
            <PulseDot color="bg-amber-400" />
            <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">
              Landing in {targetPhase}
            </span>
          </div>
          <h1 className="text-3xl font-light text-white mb-2">{title}</h1>
          <p className="text-white/40 mb-6">{tagline}</p>

          <div className="space-y-4 mb-6">
            <div>
              <h3 className="text-sm font-semibold text-white/80 mb-2">What&apos;s coming</h3>
              <ul className="space-y-1 text-sm text-white/60">
                {whatsComing.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="text-white/30">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/80 mb-2">Why it&apos;s parked</h3>
              <p className="text-sm text-white/60">{parkedReason}</p>
            </div>
          </div>

          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
          >
            Back to dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </MotionReveal>
    </div>
  );
}
