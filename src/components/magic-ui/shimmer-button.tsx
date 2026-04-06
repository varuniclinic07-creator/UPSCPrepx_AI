'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    shimmerColor?: string;
    shimmerSize?: string;
    borderRadius?: string;
    shimmerDuration?: string;
    background?: string;
    isLoading?: boolean;
}

/**
 * MagicUI Shimmer Button
 * Button with animated shimmer shine effect on hover
 */
export function ShimmerButton({
    children,
    className,
    shimmerColor = 'rgba(255, 255, 255, 0.4)',
    shimmerSize = '0.1em',
    borderRadius = '9999px',
    shimmerDuration = '1.5s',
    background = 'hsl(var(--primary))',
    isLoading = false,
    disabled,
    ...props
}: ShimmerButtonProps) {
    return (
        <button
            className={cn(
                'group relative overflow-hidden font-bold text-primary-foreground',
                'px-8 py-4 transition-all duration-300',
                'hover:scale-[1.02] active:scale-[0.98]',
                'shadow-[0_0_20px_hsl(var(--primary)/0.3)]',
                'hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)]',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                className
            )}
            style={{
                borderRadius,
                background,
            }}
            disabled={disabled || isLoading}
            aria-busy={isLoading}
            aria-disabled={disabled || isLoading}
            {...props}
        >
            {/* Shimmer overlay */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
                style={{
                    background: `linear-gradient(90deg, transparent 0%, ${shimmerColor} 50%, transparent 100%)`,
                    animation: `shimmer ${shimmerDuration} infinite`,
                    transform: 'translateX(-100%)',
                }}
                aria-hidden="true"
            />

            {/* Button content */}
            <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                    children
                )}
            </span>
        </button>
    );
}

/**
 * Gradient Shimmer Button
 * Button with gradient background and shimmer effect
 */
export function GradientShimmerButton({
    children,
    className,
    isLoading = false,
    disabled,
    ...props
}: Omit<ShimmerButtonProps, 'background' | 'shimmerColor'>) {
    return (
        <ShimmerButton
            className={cn(
                'bg-gradient-to-r from-primary via-blue-500 to-secondary',
                className
            )}
            shimmerColor="rgba(255, 255, 255, 0.5)"
            isLoading={isLoading}
            disabled={disabled}
            {...props}
        >
            {children}
        </ShimmerButton>
    );
}
