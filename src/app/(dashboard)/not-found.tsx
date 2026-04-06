import Link from 'next/link';
import { Home } from 'lucide-react';

export default function DashboardNotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
            <div className="max-w-md text-center space-y-6">
                <h1 className="text-6xl font-bold text-primary">404</h1>
                <h2 className="text-2xl font-bold text-foreground">Page Not Found</h2>
                <p className="text-muted-foreground">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                    <Home className="w-4 h-4" />
                    Back to Dashboard
                </Link>
            </div>
        </div>
    );
}
