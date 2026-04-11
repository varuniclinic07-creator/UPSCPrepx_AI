'use client';

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-16',
    md: 'h-6 w-24',
    lg: 'h-8 w-32',
    xl: 'h-12 w-48',
  };

  return (
    <div className={cn('animate-pulse rounded-md bg-muted', sizeClasses[size], className)} />
  );
}

interface LoadingPageProps {
  message?: string;
}

export function LoadingPage({ message = 'Loading...' }: LoadingPageProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header skeleton */}
        <div className="space-y-3">
          <div className="animate-pulse rounded-md bg-muted h-8 w-3/4 mx-auto" />
          <div className="animate-pulse rounded-md bg-muted h-4 w-1/2 mx-auto" />
        </div>
        {/* Card skeletons */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/50 p-6 space-y-3">
            <div className="animate-pulse rounded-md bg-muted h-4 w-full" />
            <div className="animate-pulse rounded-md bg-muted h-4 w-5/6" />
            <div className="animate-pulse rounded-md bg-muted h-4 w-4/6" />
          </div>
          <div className="rounded-2xl border border-border/50 p-6 space-y-3">
            <div className="animate-pulse rounded-md bg-muted h-4 w-full" />
            <div className="animate-pulse rounded-md bg-muted h-4 w-3/4" />
          </div>
        </div>
      </div>
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}

interface LoadingCardProps {
  className?: string;
}

export function LoadingCard({ className }: LoadingCardProps) {
  return (
    <div className={cn('rounded-2xl border bg-card p-6 space-y-4', className)}>
      <div className="flex items-center gap-4">
        <div className="animate-pulse rounded-xl bg-muted h-12 w-12" />
        <div className="flex-1 space-y-2">
          <div className="animate-pulse rounded-md bg-muted h-4 w-1/3" />
          <div className="animate-pulse rounded-md bg-muted h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="animate-pulse rounded-md bg-muted h-3 w-full" />
        <div className="animate-pulse rounded-md bg-muted h-3 w-5/6" />
        <div className="animate-pulse rounded-md bg-muted h-3 w-4/6" />
      </div>
    </div>
  );
}

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
    />
  );
}

export function LoadingDots() {
  return (
    <div className="flex items-center gap-1">
      <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

// Alias for convenience
export const Loading = LoadingSpinner;
