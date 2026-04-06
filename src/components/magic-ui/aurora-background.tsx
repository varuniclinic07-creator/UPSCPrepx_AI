'use client';

import { cn } from '@/lib/utils';

interface AuroraBackgroundProps {
    children: React.ReactNode;
    className?: string;
    showGlows?: boolean;
}

/**
 * MagicUI Aurora Background
 * Ambient gradient glow background wrapper
 */
export function AuroraBackground({ children, className, showGlows = true }: AuroraBackgroundProps) {
    return (
        <div className={cn('relative min-h-screen', className)}>
            {/* Aurora gradient overlay */}
            <div className="aurora-bg fixed inset-0 pointer-events-none z-0" />

            {/* Floating glow orbs */}
            {showGlows && (
                <>
                    <div className="aurora-glow aurora-glow-1" />
                    <div className="aurora-glow aurora-glow-2" />
                </>
            )}

            {/* Content */}
            <div className="relative z-10">{children}</div>
        </div>
    );
}

/**
 * Gradient Mesh Background
 * More complex mesh gradient background
 */
export function GradientMeshBackground({
    children,
    className
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('relative min-h-screen overflow-hidden', className)}>
            {/* Mesh gradient layers */}
            <div
                className="fixed inset-0 pointer-events-none z-0"
                style={{
                    background: `
            radial-gradient(at 0% 0%, hsl(var(--primary) / 0.15) 0px, transparent 50%),
            radial-gradient(at 80% 0%, hsl(var(--secondary) / 0.15) 0px, transparent 50%),
            radial-gradient(at 0% 50%, hsl(var(--accent) / 0.1) 0px, transparent 50%),
            radial-gradient(at 80% 50%, hsl(var(--primary) / 0.08) 0px, transparent 50%),
            radial-gradient(at 0% 100%, hsl(var(--secondary) / 0.1) 0px, transparent 50%),
            radial-gradient(at 100% 100%, hsl(var(--accent) / 0.1) 0px, transparent 50%)
          `,
                }}
            />

            {/* Content */}
            <div className="relative z-10">{children}</div>
        </div>
    );
}

/**
 * Hero Background
 * Gradient background for hero sections
 */
export function HeroBackground({
    children,
    className
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('relative gradient-hero', className)}>
            {/* Subtle noise texture overlay */}
            <div
                className="absolute inset-0 opacity-[0.02] pointer-events-none"
                style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
                }}
            />

            {/* Content */}
            <div className="relative z-10">{children}</div>
        </div>
    );
}

/**
 * Grid Background
 * Dotted or lined grid background pattern
 */
export function GridBackground({
    children,
    className,
    variant = 'dots'
}: {
    children: React.ReactNode;
    className?: string;
    variant?: 'dots' | 'lines';
}) {
    return (
        <div className={cn('relative', className)}>
            <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: variant === 'dots'
                        ? 'radial-gradient(hsl(var(--primary)) 1px, transparent 1px)'
                        : 'linear-gradient(hsl(var(--border) / 0.5) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.5) 1px, transparent 1px)',
                    backgroundSize: variant === 'dots' ? '20px 20px' : '40px 40px',
                }}
            />
            <div className="relative z-10">{children}</div>
        </div>
    );
}
