'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface DockItem {
    icon: LucideIcon;
    label: string;
    href: string;
}

interface FloatingDockProps {
    items: DockItem[];
    className?: string;
    centerItem?: {
        icon: LucideIcon;
        label: string;
        href: string;
        highlight?: boolean;
    };
}

/**
 * MagicUI Floating Dock
 * macOS-style floating navigation dock
 */
export function FloatingDock({ items, className, centerItem }: FloatingDockProps) {
    const pathname = usePathname();

    // Split items for center layout
    const halfIndex = Math.floor(items.length / 2);
    const leftItems = items.slice(0, halfIndex);
    const rightItems = items.slice(halfIndex);

    return (
        <nav
            role="navigation"
            aria-label="Quick navigation"
            className={cn(
                'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
                'bg-card/40 backdrop-blur-xl border border-border/50',
                'p-2 rounded-full flex items-center gap-1',
                'shadow-2xl shadow-black/10 dark:shadow-black/30',
                'animate-dock-slide-up',
                className
            )}
        >
            {/* Left Items */}
            {leftItems.map((item) => (
                <DockButton
                    key={item.href}
                    icon={item.icon}
                    label={item.label}
                    href={item.href}
                    isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                />
            ))}

            {/* Center Item (Highlighted) */}
            {centerItem && (
                <>
                    <div className="w-px h-6 bg-border/50 mx-1" aria-hidden="true" />
                    <DockButton
                        icon={centerItem.icon}
                        label={centerItem.label}
                        href={centerItem.href}
                        isActive={pathname === centerItem.href}
                        highlight={centerItem.highlight}
                    />
                    <div className="w-px h-6 bg-border/50 mx-1" />
                </>
            )}

            {/* Right Items */}
            {rightItems.map((item) => (
                <DockButton
                    key={item.href}
                    icon={item.icon}
                    label={item.label}
                    href={item.href}
                    isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                />
            ))}
        </nav>
    );
}

interface DockButtonProps {
    icon: LucideIcon;
    label: string;
    href: string;
    isActive?: boolean;
    highlight?: boolean;
}

function DockButton({ icon: Icon, label, href, isActive, highlight }: DockButtonProps) {
    return (
        <Link
            href={href}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
                'relative p-3 rounded-full transition-all duration-200 group',
                'text-muted-foreground hover:text-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                isActive && 'bg-primary/20 text-primary hover:bg-primary/30',
                highlight && !isActive && 'bg-primary/10 text-primary scale-110 hover:bg-primary hover:text-primary-foreground'
            )}
        >
            <Icon className="w-5 h-5" aria-hidden="true" />

            {/* Tooltip */}
            <span
                role="tooltip"
                className={cn(
                    'absolute bottom-full left-1/2 -translate-x-1/2 mb-2',
                    'px-2 py-1 rounded bg-foreground text-background text-[10px] font-medium',
                    'opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-200',
                    'pointer-events-none whitespace-nowrap'
                )}
            >
                {label}
            </span>
        </Link>
    );
}

/**
 * Simple Floating Dock without center item
 */
export function SimpleDock({ items, className }: Omit<FloatingDockProps, 'centerItem'>) {
    const pathname = usePathname();

    return (
        <nav
            role="navigation"
            aria-label="Quick navigation"
            className={cn(
                'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
                'bg-card/40 backdrop-blur-xl border border-border/50',
                'p-2 rounded-full flex items-center gap-1',
                'shadow-2xl shadow-black/10 dark:shadow-black/30',
                'animate-dock-slide-up',
                className
            )}
        >
            {items.map((item) => (
                <DockButton
                    key={item.href}
                    icon={item.icon}
                    label={item.label}
                    href={item.href}
                    isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                />
            ))}
        </nav>
    );
}
