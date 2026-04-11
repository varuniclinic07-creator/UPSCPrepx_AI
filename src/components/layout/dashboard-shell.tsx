'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AuroraBackground } from '@/components/magic-ui/aurora-background';
import { FloatingDock } from '@/components/magic-ui/floating-dock';
import { TutorialProvider, useTutorial, TutorialKey } from '@/contexts/tutorial-context';
import { TutorialModal } from '@/components/tutorial/tutorial-modal';
import {
    LayoutDashboard,
    BookOpen,
    Brain,
    Newspaper,
    Video,
    FileText,
    Calendar,
    Star,
    Map,
    RotateCcw,
    User,
    Settings,
    LogOut,
    Sparkles,
    GraduationCap,
    HelpCircle,
} from 'lucide-react';

interface DashboardShellProps {
    children: React.ReactNode;
    user: {
        name: string;
        email: string;
        role?: string;
        avatarUrl?: string;
    };
}

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: BookOpen, label: 'Study Notes', href: '/dashboard/notes' },
    { icon: Brain, label: 'Practice Quiz', href: '/dashboard/quiz' },
    { icon: Newspaper, label: 'Current Affairs', href: '/dashboard/current-affairs' },
    { icon: Video, label: 'Video Lectures', href: '/dashboard/videos' },
    { icon: FileText, label: 'Materials', href: '/dashboard/materials' },
    { icon: Calendar, label: 'Study Planner', href: '/dashboard/planner' },
    { icon: Star, label: 'Bookmarks', href: '/dashboard/bookmarks' },
    { icon: Map, label: 'Mind Maps', href: '/dashboard/mindmaps' },
    { icon: RotateCcw, label: 'Revision', href: '/dashboard/revision' },
];

const dockItems = [
    { icon: LayoutDashboard, label: 'Home', href: '/dashboard' },
    { icon: BookOpen, label: 'Notes', href: '/dashboard/notes' },
    { icon: Calendar, label: 'Schedule', href: '/dashboard/planner' },
    { icon: User, label: 'Profile', href: '/dashboard/profile' },
];

/**
 * Dashboard Shell Component
 * Apple-style dashboard layout with glass sidebar, aurora background, and floating dock
 */
export function DashboardShell({ children, user }: DashboardShellProps) {
    return (
        <TutorialProvider>
            <DashboardShellInner user={user}>{children}</DashboardShellInner>
        </TutorialProvider>
    );
}

// Helper to map pathname to TutorialKey
function getTutorialKey(pathname: string): TutorialKey {
    if (pathname === '/dashboard') return 'dashboard';
    if (pathname === '/dashboard/notes/new') return 'notes-new';
    if (pathname.startsWith('/dashboard/notes')) return 'notes';
    if (pathname.startsWith('/dashboard/quiz')) return 'quiz';
    if (pathname.startsWith('/dashboard/current-affairs')) return 'current-affairs';
    if (pathname.startsWith('/dashboard/videos')) return 'videos';
    if (pathname.startsWith('/dashboard/materials')) return 'materials';
    if (pathname.startsWith('/dashboard/planner')) return 'planner';
    if (pathname.startsWith('/dashboard/bookmarks')) return 'bookmarks';
    if (pathname.startsWith('/dashboard/mindmaps')) return 'mind-maps';
    if (pathname.startsWith('/dashboard/revision')) return 'revision';
    if (pathname.startsWith('/dashboard/profile')) return 'profile';
    if (pathname.startsWith('/dashboard/leaderboard')) return 'leaderboard';
    return 'dashboard';
}

function DashboardShellInner({ children, user }: DashboardShellProps) {
    const pathname = usePathname();
    const { openTutorial } = useTutorial();

    return (
        <AuroraBackground className="min-h-screen">
            <div className="flex h-screen w-full relative">
                {/* Glass Sidebar (Desktop) */}
                <aside
                    role="complementary"
                    aria-label="Main navigation sidebar"
                    className="hidden lg:flex flex-col w-72 glass-sidebar z-40 h-full p-6 justify-between shrink-0 fixed left-0 top-0"
                >
                    {/* Top Section */}
                    <div className="flex flex-col gap-8">
                        {/* Brand */}
                        <div className="flex items-center gap-3 px-2">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20" aria-hidden="true">
                                <GraduationCap className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-foreground text-lg font-bold tracking-tight">UPSC CSE Master</h1>
                                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                    AI Powered
                                </p>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav aria-label="Main navigation" className="flex flex-col gap-1.5">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        aria-current={isActive ? 'page' : undefined}
                                        className={cn(
                                            'group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300',
                                            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                                            isActive
                                                ? 'bg-primary/10 border border-primary/20 shadow-[0_0_15px_-3px_hsl(var(--primary)/0.2)]'
                                                : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                                        )}
                                    >
                                        <item.icon
                                            className={cn(
                                                'w-5 h-5 transition-colors',
                                                isActive ? 'text-primary' : 'group-hover:text-primary'
                                            )}
                                            aria-hidden="true"
                                        />
                                        <span className={cn('text-sm font-medium', isActive && 'text-foreground font-semibold')}>
                                            {item.label}
                                        </span>
                                        {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" aria-hidden="true" />}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Bottom Section - User Profile */}
                    <div className="flex flex-col gap-4">
                        <div className="glass-panel p-4 rounded-2xl flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                {user.avatarUrl ? (
                                    <div
                                        className="w-10 h-10 rounded-full bg-cover bg-center border-2 border-primary/20"
                                        style={{ backgroundImage: `url(${user.avatarUrl})` }}
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <span className="text-foreground text-sm font-medium">{user.name}</span>
                                    <span className="text-muted-foreground text-xs">{user.role || 'Member'}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Link
                                    href="/dashboard/profile"
                                    className="flex-1 py-2 flex items-center justify-center gap-2 rounded-lg bg-muted/50 hover:bg-muted border border-border/50 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <Settings className="w-4 h-4" />
                                    Settings
                                </Link>
                                <button className="px-3 py-2 rounded-lg bg-muted/50 hover:bg-destructive/10 border border-border/50 text-muted-foreground hover:text-destructive transition-colors">
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                            {/* Help Button */}
                            <button
                                onClick={() => openTutorial(getTutorialKey(pathname))}
                                className="w-full py-2 flex items-center justify-center gap-2 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-xs font-medium transition-colors"
                            >
                                <HelpCircle className="w-4 h-4" />
                                Page Tutorial
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 w-full lg:pl-72 min-h-screen">
                    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-10 pb-24 lg:pb-10">
                        {children}
                    </div>
                </main>

                {/* Floating Dock (Mobile & Tablet) */}
                <div className="lg:hidden">
                    <FloatingDock
                        items={dockItems}
                        centerItem={{
                            icon: Sparkles,
                            label: 'AI Tutor',
                            href: '/dashboard/notes/new',
                            highlight: true,
                        }}
                    />
                </div>
            </div>
            <TutorialModal />
        </AuroraBackground >
    );
}
