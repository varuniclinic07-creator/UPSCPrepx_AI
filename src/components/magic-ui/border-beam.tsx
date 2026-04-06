'use client';

import { cn } from '@/lib/utils';

interface BorderBeamProps {
    children: React.ReactNode;
    className?: string;
    containerClassName?: string;
    duration?: number;
    borderWidth?: number;
    colorFrom?: string;
    colorTo?: string;
}

/**
 * MagicUI Border Beam Component
 * Animated rotating gradient border effect
 */
export function BorderBeam({
    children,
    className,
    containerClassName,
    duration = 4,
    borderWidth = 2,
    colorFrom = 'hsl(var(--primary))',
    colorTo = 'hsl(var(--secondary))',
}: BorderBeamProps) {
    return (
        <div className={cn('relative', containerClassName)}>
            {/* Animated Border */}
            <div
                className="absolute inset-0 rounded-[inherit] z-0"
                style={{
                    padding: borderWidth,
                    background: `conic-gradient(from 0deg, transparent 0deg 340deg, ${colorFrom} 360deg)`,
                    animation: `borderBeam ${duration}s linear infinite`,
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                }}
            />
            <div className={cn('relative z-10', className)}>{children}</div>
        </div>
    );
}

/**
 * Border Beam Input Wrapper
 * For input fields with border beam effect
 */
export function BorderBeamInput({
    children,
    className,
    active = false,
}: {
    children: React.ReactNode;
    className?: string;
    active?: boolean;
}) {
    return (
        <div className={cn('relative group', className)}>
            {/* Gradient glow on hover/focus */}
            <div
                className={cn(
                    'absolute -inset-[2px] rounded-2xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 blur-sm transition-opacity duration-500',
                    'bg-gradient-to-r from-transparent via-primary/50 to-transparent',
                    active && 'opacity-100'
                )}
                style={{ backgroundSize: '200% 100%', animation: 'shimmer 2s linear infinite' }}
            />
            <div className="relative">{children}</div>
        </div>
    );
}
