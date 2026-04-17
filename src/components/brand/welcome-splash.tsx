'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogoMark } from './logo';

export interface WelcomeSplashProps {
  /** Unique name for the splash (used for the dismiss cookie/storage key). */
  storageKey?: string;
  /** Show even if dismissed. */
  force?: boolean;
  /** Total duration in ms (default 2600). */
  duration?: number;
  /** Called when splash finishes. */
  onComplete?: () => void;
  /** Override greeting — e.g. the user's first name. */
  greetingName?: string;
}

const DEFAULT_KEY = 'upsc-splash-seen-v1';

/**
 * WelcomeSplash — full-screen brand animation with assembling logo + tagline.
 * Renders on first visit per-session (localStorage gated). Framer-driven.
 */
export function WelcomeSplash({
  storageKey = DEFAULT_KEY,
  force = false,
  duration = 2600,
  onComplete,
  greetingName,
}: WelcomeSplashProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!force) {
      try {
        if (window.sessionStorage.getItem(storageKey)) return;
      } catch {
        /* sessionStorage blocked — still show once per tab */
      }
    }

    setVisible(true);
    const timer = window.setTimeout(() => {
      setVisible(false);
      try {
        window.sessionStorage.setItem(storageKey, '1');
      } catch {
        /* ignore */
      }
      onComplete?.();
    }, duration);

    return () => window.clearTimeout(timer);
  }, [storageKey, force, duration, onComplete]);

  const greeting =
    greetingName && greetingName.trim().length > 0
      ? `Welcome back, ${greetingName}.`
      : 'The Art of UPSC, Reimagined.';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] grid place-items-center bg-black"
          aria-hidden="true"
        >
          {/* Ambient orbs */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1.1, opacity: 0.7 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[140px]"
          />
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1.1, opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, delay: 0.2, ease: 'easeOut' }}
            className="absolute -bottom-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-orange-500/10 blur-[140px]"
          />

          {/* Grid background */}
          <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

          <div className="relative flex flex-col items-center gap-8">
            {/* Logo mark — scales & spins in */}
            <motion.div
              initial={{ scale: 0, rotate: -120, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{
                type: 'spring',
                stiffness: 160,
                damping: 14,
                delay: 0.1,
              }}
              className="relative"
            >
              {/* Rotating halo */}
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                style={{
                  background:
                    'conic-gradient(from 0deg, transparent 0deg 340deg, rgba(59,130,246,0.6) 360deg)',
                  filter: 'blur(18px)',
                }}
              />
              <div className="relative p-6 rounded-full bg-black">
                <LogoMark size={120} glow />
              </div>
            </motion.div>

            {/* Wordmark */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-1.5"
            >
              <div className="flex items-baseline gap-2">
                <span className="font-display text-4xl md:text-5xl font-bold tracking-tight text-white">
                  UPSC&nbsp;PrepX
                </span>
                <span className="font-display text-2xl md:text-3xl font-bold tracking-tight text-gradient-accent">
                  AI
                </span>
              </div>
              <span className="text-[11px] uppercase tracking-[0.3em] text-white/40">
                Chanakya&nbsp;AI&nbsp;·&nbsp;Since&nbsp;2026
              </span>
            </motion.div>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.0 }}
              className="text-sm md:text-base text-white/60 max-w-md text-center"
            >
              {greeting}
            </motion.p>

            {/* Progress bar */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 200, opacity: 1 }}
              transition={{ duration: 0.4, delay: 1.3 }}
              className="h-[2px] rounded-full bg-white/5 overflow-hidden"
            >
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '0%' }}
                transition={{ duration: duration / 1000 - 1.3, ease: 'linear' }}
                className="h-full w-full bg-gradient-to-r from-blue-400 via-white to-orange-400"
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
