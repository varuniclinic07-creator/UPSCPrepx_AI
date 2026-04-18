'use client';

/**
 * Shared animated-graphics primitives used across feature pages and the
 * dashboard. Pure client-side, no heavy deps beyond framer-motion which
 * is already in the tree. Every primitive respects prefers-reduced-motion
 * and degrades gracefully to a static render.
 */

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Slow-drifting orbs behind a hero or empty-state card. Purely decorative.
 * Pass a `palette` tuple of two CSS colors; defaults to blue/violet.
 */
export function DriftingOrbs({
  palette = ['rgba(59,130,246,0.25)', 'rgba(139,92,246,0.22)'],
  className = '',
}: {
  palette?: [string, string];
  className?: string;
}) {
  const reduced = useReducedMotion();
  const dur = reduced ? 0 : 18;
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <motion.span
        className="absolute -top-24 -left-24 block h-72 w-72 rounded-full blur-[90px]"
        style={{ background: palette[0] }}
        animate={reduced ? undefined : { x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.span
        className="absolute -bottom-32 -right-24 block h-80 w-80 rounded-full blur-[110px]"
        style={{ background: palette[1] }}
        animate={reduced ? undefined : { x: [0, -30, 0], y: [0, -40, 0] }}
        transition={{ duration: dur + 4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

/**
 * Low-density particle field. Uses CSS-only animated dots so we don't pay
 * a canvas cost. Good for dashboard heroes.
 */
export function ParticleField({
  count = 24,
  className = '',
}: {
  count?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const dots = Array.from({ length: count }, (_, i) => i);
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {dots.map((i) => {
        const top = (i * 37) % 100;
        const left = (i * 53) % 100;
        const size = ((i % 4) + 1) * 2;
        const delay = (i % 10) * 0.35;
        return (
          <motion.span
            key={i}
            className="absolute block rounded-full bg-white/30"
            style={{ top: `${top}%`, left: `${left}%`, width: size, height: size }}
            initial={{ opacity: 0 }}
            animate={reduced ? { opacity: 0.25 } : { opacity: [0, 0.5, 0], y: [0, -12, 0] }}
            transition={reduced ? undefined : { duration: 6, delay, repeat: Infinity }}
          />
        );
      })}
    </div>
  );
}

/**
 * Animated reveal wrapper — fades + slides its children into view with a
 * small stagger. Used as the top-level wrapper for feature-page sections.
 */
export function MotionReveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 0.61, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Pulsing status dot for "live" indicators. Color from Tailwind palette.
 */
export function PulseDot({ color = 'bg-emerald-400' }: { color?: string }) {
  return (
    <span className="relative inline-flex h-2 w-2">
      <span className={`absolute inline-flex h-full w-full rounded-full ${color} opacity-70 animate-ping`} />
      <span className={`relative inline-flex h-2 w-2 rounded-full ${color}`} />
    </span>
  );
}

/**
 * Subtle animated gradient border — wraps a child and pulses a conic
 * gradient behind it. Good for hero CTA cards.
 */
export function GradientAura({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <div className={`relative ${className}`}>
      <motion.span
        aria-hidden
        className="absolute -inset-[1px] rounded-[inherit] opacity-70 blur-sm"
        style={{
          background:
            'conic-gradient(from 0deg, rgba(59,130,246,0.4), rgba(139,92,246,0.4), rgba(212,175,55,0.35), rgba(59,130,246,0.4))',
        }}
        animate={reduced ? undefined : { rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
      />
      <div className="relative rounded-[inherit]">{children}</div>
    </div>
  );
}
