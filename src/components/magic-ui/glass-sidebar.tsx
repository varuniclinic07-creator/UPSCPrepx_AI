'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LucideIcon, Settings, LogOut } from 'lucide-react';

interface NavItem {
    icon: LucideIcon;
    label: string;
    href: string;
    badge?: string;
}

interface GlassSidebarProps {
    logo?: React.ReactNode;
    title: string;
    subtitle?: string;
    navItems: NavItem[];
    user?: {
        name: string;
        email?: string;
        role?: string;
        avatarUrl?: string;
    };
    className?: string;
    children?: React.ReactNode;
}

/**
 * MagicUI Glass Sidebar
 * Apple-style glassy sidebar navigation
 */
export function GlassSidebar({
    logo,
    title,
    subtitle,
    navItems,
    user,
    className,
    children,
}: GlassSidebarProps) {
    const pathname = usePathname();

    return (
        <aside
            className={cn(
                'hidden lg:flex flex-col w-72 glass-sidebar z-40 h-full p-6 justify-between shrink-0',
                className
            )}
        >
            {/* Top Section */}
            <div className="flex flex-col gap-8">
                {/* Brand */}
                <div className="flex items-center gap-3 px-2">
                    {logo || (
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                            <span className="text-white text-lg font-bold">U</span>
                        </div>
                    )}
                    <div className="flex flex-col">
                        <h1 className="text-foreground text-lg font-bold tracking-tight">{title}</h1>
                        {subtitle && (
                            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex flex-col gap-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <SidebarNavItem
                                key={item.href}
                                icon={item.icon}
                                label={item.label}
                                href={item.href}
                                isActive={isActive}
                                badge={item.badge}
                            />
                        );
                    })}
                </nav>

                {/* Additional Content */}
                {children}
            </div>

            {/* Bottom Section - User Profile */}
            {user && (
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
                                <span className="text-muted-foreground text-xs">{user.role || user.email}</span>
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
                            <button
                                className="px-3 py-2 rounded-lg bg-muted/50 hover:bg-destructive/10 border border-border/50 text-muted-foreground hover:text-destructive transition-colors"
                                onClick={() => {/* Handle logout */ }}
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}

interface SidebarNavItemProps {
    icon: LucideIcon;
    label: string;
    href: string;
    isActive?: boolean;
    badge?: string;
}

function SidebarNavItem({ icon: Icon, label, href, isActive, badge }: SidebarNavItemProps) {
    return (
        <Link
            href={href}
            className={cn(
                'group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300',
                isActive
                    ? 'bg-primary/10 border border-primary/20 shadow-[0_0_15px_-3px_hsl(var(--primary)/0.2)]'
                    : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
            )}
        >
            <div className="flex items-center gap-3">
                <Icon
                    className={cn(
                        'w-5 h-5 transition-colors',
                        isActive ? 'text-primary' : 'group-hover:text-primary'
                    )}
                />
                <span className={cn('text-sm font-medium', isActive && 'text-foreground font-semibold')}>
                    {label}
                </span>
            </div>
            {badge && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                    {badge}
                </span>
            )}
            {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
        </Link>
    );
}
