'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCcw, Home, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

export default function AuthError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const [copied, setCopied] = useState(false);
    const [showDetails, setShowDetails] = useState(true);

    useEffect(() => {
        console.error('[Auth Error]', error);
    }, [error]);

    const copyError = () => {
        const errorInfo = `Error: ${error.message}\nDigest: ${error.digest || 'N/A'}\nStack: ${error.stack || 'N/A'}`;
        navigator.clipboard.writeText(errorInfo);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
            <div className="max-w-lg text-center space-y-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-foreground">
                        Something went wrong with authentication
                    </h2>
                    <p className="text-muted-foreground">
                        An error occurred during authentication. Please try again or return to the home page.
                    </p>
                </div>

                <div className="text-left bg-destructive/5 border border-destructive/20 rounded-lg overflow-hidden">
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="w-full flex items-center justify-between p-3 hover:bg-destructive/10 transition-colors"
                    >
                        <span className="text-sm font-medium text-destructive">Error Details</span>
                        {showDetails ? (
                            <ChevronUp className="w-4 h-4 text-destructive" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-destructive" />
                        )}
                    </button>
                    {showDetails && (
                        <div className="p-4 pt-0 space-y-3">
                            <div className="bg-background/50 p-3 rounded border border-border">
                                <p className="text-sm font-medium text-foreground mb-1">Message:</p>
                                <p className="text-sm text-destructive font-mono break-all">
                                    {error.message || 'Unknown error'}
                                </p>
                            </div>
                            {error.stack && (
                                <div className="bg-background/50 p-3 rounded border border-border">
                                    <p className="text-sm font-medium text-foreground mb-1">Stack Trace:</p>
                                    <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap break-all max-h-40 overflow-auto">
                                        {error.stack.split('\n').slice(0, 5).join('\n')}
                                    </pre>
                                </div>
                            )}
                            <button
                                onClick={copyError}
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {copied ? (
                                    <><Check className="w-4 h-4 text-green-500" /> Copied!</>
                                ) : (
                                    <><Copy className="w-4 h-4" /> Copy error details</>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Try Again
                    </button>
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        Go Home
                    </Link>
                </div>

                {error.digest && (
                    <p className="text-xs text-muted-foreground">
                        Error ID: {error.digest}
                    </p>
                )}
            </div>
        </div>
    );
}
