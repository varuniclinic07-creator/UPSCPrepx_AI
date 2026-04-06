'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
}

/**
 * Base skeleton with shimmer animation
 */
export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-lg bg-accent/50',
                'before:absolute before:inset-0',
                'before:translate-x-[-100%]',
                'before:animate-[shimmer_2s_infinite]',
                'before:bg-gradient-to-r',
                'before:from-transparent before:via-white/10 before:to-transparent',
                className
            )}
        />
    );
}

/**
 * Card skeleton with glass effect
 */
export function CardSkeleton({ className }: SkeletonProps) {
    return (
        <div className={cn('glass-card p-6 space-y-4', className)}>
            <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
        </div>
    );
}

/**
 * List item skeleton
 */
export function ListSkeleton({
    count = 3,
    className
}: SkeletonProps & { count?: number }) {
    return (
        <div className={cn('space-y-4', className)}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * Stats grid skeleton
 */
export function StatsSkeleton({
    count = 4,
    className
}: SkeletonProps & { count?: number }) {
    return (
        <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-4', className)}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="glass-card p-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-8 w-16" />
                        </div>
                        <Skeleton className="w-12 h-12 rounded-xl" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * Text block skeleton
 */
export function TextSkeleton({
    lines = 3,
    className
}: SkeletonProps & { lines?: number }) {
    return (
        <div className={cn('space-y-3', className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={cn(
                        'h-4',
                        i === lines - 1 ? 'w-3/4' : 'w-full'
                    )}
                />
            ))}
        </div>
    );
}

/**
 * Page skeleton for full page loading
 */
export function PageSkeleton() {
    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-32 rounded-xl" />
            </div>

            {/* Stats */}
            <StatsSkeleton />

            {/* Content */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
            </div>
        </div>
    );
}

/**
 * Dashboard skeleton
 */
export function DashboardSkeleton() {
    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-80" />
                </div>
                <Skeleton className="h-10 w-40 rounded-xl" />
            </div>

            {/* Stats */}
            <StatsSkeleton count={4} />

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <CardSkeleton key={i} />
                ))}
            </div>

            {/* Two column layout */}
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="glass-card p-6 space-y-4">
                    <Skeleton className="h-6 w-40" />
                    <ListSkeleton count={4} />
                </div>
                <div className="space-y-6">
                    <div className="glass-card p-6 space-y-4">
                        <Skeleton className="h-6 w-32" />
                        <TextSkeleton lines={3} />
                    </div>
                    <div className="glass-card p-6 space-y-4">
                        <Skeleton className="h-6 w-36" />
                        <ListSkeleton count={3} />
                    </div>
                </div>
            </div>
        </div>
    );
}
