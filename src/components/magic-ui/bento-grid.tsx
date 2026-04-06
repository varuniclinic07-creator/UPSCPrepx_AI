'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface BentoGridProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * MagicUI Bento Grid Container
 * Modern grid layout for dashboard cards
 */
export function BentoGrid({ children, className }: BentoGridProps) {
    return (
        <div
            className={cn(
                'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6',
                'auto-rows-[minmax(200px,auto)]',
                className
            )}
        >
            {children}
        </div>
    );
}

interface BentoCardProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    className?: string;
    children?: React.ReactNode;
    header?: React.ReactNode;
    footer?: React.ReactNode;
    onClick?: () => void;
    glowColor?: string;
    badge?: {
        text: string;
        variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning';
    };
}

/**
 * MagicUI Bento Card
 * Card with hover effects and glow for bento grids
 */
export function BentoCard({
    title,
    description,
    icon: Icon,
    className,
    children,
    header,
    footer,
    onClick,
    glowColor = 'hsl(var(--primary))',
    badge,
}: BentoCardProps) {
    return (
        <div
            className={cn(
                'group relative overflow-hidden rounded-3xl',
                'bg-card border border-border/50 p-6',
                'transition-all duration-300 ease-out',
                'hover:-translate-y-1 hover:shadow-bento hover:border-primary/30',
                onClick && 'cursor-pointer',
                className
            )}
            onClick={onClick}
        >
            {/* Glow effect on hover */}
            <div
                className="absolute -right-12 -top-12 w-32 h-32 rounded-full blur-[60px] transition-opacity duration-500 opacity-0 group-hover:opacity-50"
                style={{ background: glowColor }}
            />

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                {header || (
                    <div className="flex items-center justify-between mb-4">
                        {Icon && (
                            <div className="p-2.5 rounded-xl bg-muted/50 text-muted-foreground group-hover:text-primary transition-colors">
                                <Icon className="w-5 h-5" />
                            </div>
                        )}
                        {badge && (
                            <span
                                className={cn(
                                    'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border',
                                    badge.variant === 'primary' && 'bg-primary/10 text-primary border-primary/20',
                                    badge.variant === 'secondary' && 'bg-secondary/10 text-secondary border-secondary/20',
                                    badge.variant === 'accent' && 'bg-accent/10 text-accent border-accent/20',
                                    badge.variant === 'success' && 'bg-green-500/10 text-green-500 border-green-500/20',
                                    badge.variant === 'warning' && 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                                    !badge.variant && 'bg-primary/10 text-primary border-primary/20'
                                )}
                            >
                                {badge.text}
                            </span>
                        )}
                    </div>
                )}

                {/* Main Content */}
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                        {title}
                    </h3>
                    {description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
                    )}
                    {children}
                </div>

                {/* Footer */}
                {footer && <div className="mt-4 pt-4 border-t border-border/50">{footer}</div>}
            </div>
        </div>
    );
}

/**
 * Large Bento Card (spans 2 columns)
 */
export function BentoCardLarge(props: BentoCardProps) {
    return <BentoCard {...props} className={cn('md:col-span-2', props.className)} />;
}

/**
 * Tall Bento Card (spans 2 rows)
 */
export function BentoCardTall(props: BentoCardProps) {
    return <BentoCard {...props} className={cn('md:row-span-2', props.className)} />;
}
