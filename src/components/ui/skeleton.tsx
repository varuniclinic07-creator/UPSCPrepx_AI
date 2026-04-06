'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
}

/**
 * Skeleton - Loading placeholder per ux-designer agent patterns
 */
export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                'animate-pulse rounded-md bg-muted/50',
                className
            )}
        />
    );
}

/**
 * CardSkeleton - Skeleton for card components
 */
export function CardSkeleton({ className }: SkeletonProps) {
    return (
        <div className={cn('rounded-2xl border border-border/50 p-6 space-y-4', className)}>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-full" />
            </div>
        </div>
    );
}

/**
 * TableSkeleton - Skeleton for table rows
 */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
    return (
        <tr className="border-b border-border/50">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="p-4">
                    <Skeleton className="h-4 w-full" />
                </td>
            ))}
        </tr>
    );
}

/**
 * PageSkeleton - Full page loading state
 */
export function PageSkeleton() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-32 rounded-full" />
            </div>
            <div className="grid md:grid-cols-3 gap-6">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
            </div>
        </div>
    );
}

/**
 * ListSkeleton - Skeleton for list items
 */
export function ListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border/50">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}
