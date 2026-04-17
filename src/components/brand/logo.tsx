'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_MAP: Record<LogoSize, { mark: number; text: string; gap: string }> = {
  xs: { mark: 20, text: 'text-sm', gap: 'gap-2' },
  sm: { mark: 28, text: 'text-base', gap: 'gap-2.5' },
  md: { mark: 36, text: 'text-lg', gap: 'gap-3' },
  lg: { mark: 56, text: 'text-2xl', gap: 'gap-3.5' },
  xl: { mark: 88, text: 'text-4xl', gap: 'gap-4' },
};

export interface LogoMarkProps {
  size?: number;
  className?: string;
  glow?: boolean;
  animated?: boolean;
}

/**
 * LogoMark — pure icon. The mark is a hexagonal badge with two intersecting
 * paths (knowledge/blue × action/orange) meeting at a luminous central node.
 */
export function LogoMark({ size = 36, className, glow = true, animated = false }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn('shrink-0', animated && 'logo-mark-animated', className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logoGradBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="logoGradOrange" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <radialGradient id="logoGradCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        {glow && (
          <filter id="logoGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.6" result="blurred" />
            <feMerge>
              <feMergeNode in="blurred" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {/* Hexagonal badge outline */}
      <path
        d="M32 3 L56.5 17.5 L56.5 46.5 L32 61 L7.5 46.5 L7.5 17.5 Z"
        fill="rgba(255,255,255,0.02)"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1"
      />

      {/* Blue knowledge path — top-left to bottom-right */}
      <path
        d="M16 20 Q24 22 32 32 Q40 42 48 44"
        stroke="url(#logoGradBlue)"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
        filter={glow ? 'url(#logoGlow)' : undefined}
      />

      {/* Orange action path — bottom-left to top-right */}
      <path
        d="M16 44 Q24 42 32 32 Q40 22 48 20"
        stroke="url(#logoGradOrange)"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
        filter={glow ? 'url(#logoGlow)' : undefined}
      />

      {/* Luminous central convergence node */}
      <circle cx="32" cy="32" r="4.5" fill="url(#logoGradCore)" />
      <circle cx="32" cy="32" r="2" fill="#ffffff" />

      {/* Corner accents — subtle wayfinding dots */}
      <circle cx="16" cy="20" r="1.2" fill="#60a5fa" opacity="0.8" />
      <circle cx="48" cy="20" r="1.2" fill="#fb923c" opacity="0.8" />
      <circle cx="16" cy="44" r="1.2" fill="#fb923c" opacity="0.8" />
      <circle cx="48" cy="44" r="1.2" fill="#60a5fa" opacity="0.8" />
    </svg>
  );
}

export interface LogoProps {
  size?: LogoSize;
  className?: string;
  showText?: boolean;
  href?: string;
  variant?: 'default' | 'compact';
  animated?: boolean;
}

/**
 * Logo — full lockup: mark + wordmark. Use `href` to make it a link.
 */
export function Logo({
  size = 'md',
  className,
  showText = true,
  href,
  variant = 'default',
  animated = false,
}: LogoProps) {
  const s = SIZE_MAP[size];

  const content = (
    <div className={cn('flex items-center', s.gap, className)}>
      <LogoMark size={s.mark} animated={animated} />
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn('font-display font-bold tracking-tight text-white', s.text)}>
            {variant === 'compact' ? 'PrepX' : 'UPSC PrepX'}
          </span>
          {variant === 'default' && size !== 'xs' && (
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-medium mt-0.5">
              Chanakya&nbsp;AI
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center group">
        {content}
      </Link>
    );
  }
  return content;
}
