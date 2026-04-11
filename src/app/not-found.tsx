'use client';

import Link from 'next/link';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Custom 404 Not Found page
 */
export default function NotFound() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="glass-card max-w-lg w-full">
                <CardContent className="p-8 text-center">
                    {/* Icon */}
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                        <FileQuestion className="w-10 h-10 text-primary" />
                    </div>

                    {/* 404 Badge */}
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-accent text-sm font-medium text-muted-foreground mb-4">
                        Error 404
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        Page Not Found
                    </h1>

                    {/* Description */}
                    <p className="text-muted-foreground mb-8">
                        The page you&apos;re looking for doesn&apos;t exist or has been moved to a different location.
                    </p>

                    {/* Suggestions */}
                    <div className="grid grid-cols-2 gap-3 mb-8">
                        <Link
                            href="/dashboard/notes"
                            className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                        >
                            <div className="text-2xl mb-2">📚</div>
                            <div className="font-medium text-foreground text-sm">Study Notes</div>
                            <div className="text-xs text-muted-foreground">Browse your notes</div>
                        </Link>
                        <Link
                            href="/dashboard/quiz"
                            className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                        >
                            <div className="text-2xl mb-2">🧠</div>
                            <div className="font-medium text-foreground text-sm">Practice Quiz</div>
                            <div className="text-xs text-muted-foreground">Test your knowledge</div>
                        </Link>
                        <Link
                            href="/dashboard/current-affairs"
                            className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                        >
                            <div className="text-2xl mb-2">📰</div>
                            <div className="font-medium text-foreground text-sm">Current Affairs</div>
                            <div className="text-xs text-muted-foreground">Daily updates</div>
                        </Link>
                        <Link
                            href="/dashboard/profile"
                            className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                        >
                            <div className="text-2xl mb-2">👤</div>
                            <div className="font-medium text-foreground text-sm">Profile</div>
                            <div className="text-xs text-muted-foreground">Your account</div>
                        </Link>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button onClick={() => window.history.back()} variant="outline">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Go Back
                        </Button>
                        <Button variant="gradient" asChild>
                            <Link href="/dashboard">
                                <Home className="w-4 h-4 mr-2" />
                                Go to Dashboard
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
