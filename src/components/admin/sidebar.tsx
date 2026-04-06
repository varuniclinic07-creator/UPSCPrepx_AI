'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Cpu,
    ToggleLeft,
    UserPlus,
    ArrowLeft,
    Settings,
    Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const adminNavItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/ai-providers', icon: Cpu, label: 'AI Providers' },
    { href: '/admin/features', icon: ToggleLeft, label: 'Features' },
    { href: '/admin/leads', icon: UserPlus, label: 'Leads' },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card/95 backdrop-blur-sm">
            <div className="flex h-full flex-col">
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <span className="text-lg font-bold text-foreground">Admin</span>
                        <span className="text-xs text-muted-foreground block">UPSC Master</span>
                    </div>
                </div>

                {/* Main Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {adminNavItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/admin' && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200',
                                    isActive
                                        ? 'bg-gradient-to-r from-red-500/20 to-orange-500/10 text-foreground border border-red-500/20'
                                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                )}
                            >
                                <item.icon className={cn('w-5 h-5', isActive && 'text-red-500')} />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 space-y-1 border-t border-border">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Back to App</span>
                    </Link>
                    <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
                    >
                        <Settings className="w-5 h-5" />
                        <span className="font-medium">Settings</span>
                    </Link>
                </div>
            </div>
        </aside>
    );
}
