'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error boundary component to catch React errors
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        this.props.onError?.(error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <ErrorFallback
                    error={this.state.error}
                    onReset={this.handleReset}
                />
            );
        }

        return this.props.children;
    }
}

interface ErrorFallbackProps {
    error?: Error | null;
    onReset?: () => void;
    title?: string;
    description?: string;
}

/**
 * Error fallback UI component
 */
export function ErrorFallback({
    error,
    onReset,
    title = 'Something went wrong',
    description = 'An unexpected error occurred. Please try again.',
}: ErrorFallbackProps) {
    return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
            <Card className="glass-card max-w-md w-full">
                <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>

                    <h2 className="text-xl font-semibold text-foreground mb-2">
                        {title}
                    </h2>

                    <p className="text-muted-foreground mb-6">
                        {description}
                    </p>

                    {error && process.env.NODE_ENV === 'development' && (
                        <div className="mb-6 p-4 rounded-lg bg-red-500/5 border border-red-500/20 text-left">
                            <p className="text-xs font-mono text-red-500 break-all">
                                {error.message}
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        {onReset && (
                            <Button onClick={onReset} variant="outline">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Try Again
                            </Button>
                        )}
                        <Button onClick={() => window.location.reload()} variant="outline">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Reload Page
                        </Button>
                        <Button asChild>
                            <Link href="/dashboard">
                                <Home className="w-4 h-4 mr-2" />
                                Go Home
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Inline error display for non-critical errors
 */
export function InlineError({
    message,
    onRetry,
}: {
    message: string;
    onRetry?: () => void;
}) {
    return (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/5 border border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-500 flex-1">{message}</p>
            {onRetry && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRetry}
                    className="text-red-500 hover:text-red-600"
                >
                    <RefreshCw className="w-4 h-4" />
                </Button>
            )}
        </div>
    );
}
