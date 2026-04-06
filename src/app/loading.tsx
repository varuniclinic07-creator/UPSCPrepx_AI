import { Sparkles } from 'lucide-react';

/**
 * App-level loading page
 */
export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-6 animate-in fade-in duration-500">
                {/* Logo */}
                <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center animate-pulse">
                        <Sparkles className="w-10 h-10 text-white" />
                    </div>
                </div>

                {/* App Name */}
                <div>
                    <h1 className="text-2xl font-bold text-foreground mb-1">
                        UPSC CSE Master
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Loading your learning dashboard...
                    </p>
                </div>

                {/* Loading Spinner */}
                <div className="flex items-center justify-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    );
}
