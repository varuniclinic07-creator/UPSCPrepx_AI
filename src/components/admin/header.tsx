'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Shield } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface AdminHeaderProps {
    user?: {
        name?: string;
        email?: string;
        role?: string;
    };
}

// Map routes to breadcrumb labels
const routeLabels: Record<string, string> = {
    '/admin': 'Dashboard',
    '/admin/users': 'Users',
    '/admin/ai-providers': 'AI Providers',
    '/admin/features': 'Features',
    '/admin/leads': 'Leads',
};

export function AdminHeader({ user }: AdminHeaderProps) {
    const pathname = usePathname();

    // Build breadcrumbs from pathname
    const parts = pathname.split('/').filter(Boolean);
    const breadcrumbs = parts.map((part, index) => {
        const path = '/' + parts.slice(0, index + 1).join('/');
        return {
            label: routeLabels[path] || part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
            href: path,
            isLast: index === parts.length - 1,
        };
    });

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur-sm px-6">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm">
                {breadcrumbs.map((crumb, index) => (
                    <div key={crumb.href} className="flex items-center gap-2">
                        {index > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                        {crumb.isLast ? (
                            <span className="font-medium text-foreground">{crumb.label}</span>
                        ) : (
                            <Link
                                href={crumb.href}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {crumb.label}
                            </Link>
                        )}
                    </div>
                ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-4">
                <ThemeToggle />

                {/* Admin badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20">
                    <Shield className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-medium text-red-500 uppercase">
                        {user?.role || 'Admin'}
                    </span>
                </div>

                {/* User info */}
                {user && (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-sm font-medium">
                            {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'A'}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
