'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
}

/**
 * App-level error page for runtime errors
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
    useEffect(() => {
        // Log error to console in development
        console.error('App Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="glass-card max-w-lg w-full">
                <CardContent className="p-8 text-center">
                    {/* Icon */}
                    <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-10 h-10 text-red-500" />
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        Oops! Something went wrong
                    </h1>

                    {/* Description */}
                    <p className="text-muted-foreground mb-6">
                        We apologize for the inconvenience. An unexpected error occurred while loading this page.
                    </p>

                    {/* Error details (dev only) */}
                    {process.env.NODE_ENV === 'development' && error.message && (
                        <div className="mb-6 p-4 rounded-lg bg-red-500/5 border border-red-500/20 text-left overflow-auto">
                            <p className="text-xs font-mono text-red-500 break-all">
                                {error.message}
                            </p>
                            {error.digest && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    Error ID: {error.digest}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button onClick={reset} variant="outline">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Try Again
                        </Button>
                        <Button onClick={() => window.history.back()} variant="outline">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Go Back
                        </Button>
                        <Button variant="gradient" asChild>
                            <Link href="/dashboard">
                                <Home className="w-4 h-4 mr-2" />
                                Dashboard
                            </Link>
                        </Button>
                    </div>

                    {/* Help text */}
                    <p className="text-xs text-muted-foreground mt-8">
                        If this problem persists, please contact support or try refreshing the page.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
