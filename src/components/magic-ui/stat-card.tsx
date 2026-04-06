'use client';

import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: LucideIcon;
    trend?: {
        value: string;
        direction: 'up' | 'down';
        label?: string;
    };
    glowColor?: string;
    className?: string;
    children?: React.ReactNode;
}

/**
 * MagicUI Stat Card
 * Dashboard statistics card with glow effect
 */
export function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    glowColor = 'hsl(var(--primary))',
    className,
    children,
}: StatCardProps) {
    const cardId = `stat-${title.toLowerCase().replace(/\s+/g, '-')}`;

    return (
        <div
            className={cn(
                'stat-card group',
                className
            )}
            role="region"
            aria-labelledby={`${cardId}-title`}
            aria-describedby={`${cardId}-value`}
        >
            {/* Glow effect */}
            <div
                className="stat-card-glow"
                style={{ background: glowColor }}
                aria-hidden="true"
            />

            {/* Header with icon and trend */}
            <div className="flex justify-between items-start z-10">
                {Icon && (
                    <div
                        className="p-2.5 rounded-xl bg-muted/50 text-muted-foreground group-hover:text-primary transition-colors"
                        aria-hidden="true"
                    >
                        <Icon className="w-5 h-5" />
                    </div>
                )}
                {trend && (
                    <span
                        className={cn(
                            'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold',
                            trend.direction === 'up'
                                ? 'bg-green-500/10 text-green-500'
                                : 'bg-red-500/10 text-red-500'
                        )}
                        role="status"
                        aria-label={`Trend: ${trend.direction === 'up' ? 'increasing' : 'decreasing'} ${trend.value}`}
                    >
                        {trend.direction === 'up' ? (
                            <TrendingUp className="w-3 h-3" aria-hidden="true" />
                        ) : (
                            <TrendingDown className="w-3 h-3" aria-hidden="true" />
                        )}
                        {trend.value}
                    </span>
                )}
            </div>

            {/* Main content */}
            <div className="z-10 mt-auto">
                <h3
                    id={`${cardId}-title`}
                    className="text-muted-foreground text-sm font-medium mb-1"
                >
                    {title}
                </h3>
                <div className="flex items-end gap-2">
                    <span
                        id={`${cardId}-value`}
                        className="text-3xl font-bold text-foreground"
                        aria-live="polite"
                    >
                        {value}
                    </span>
                    {subtitle && <span className="text-sm text-muted-foreground mb-1">{subtitle}</span>}
                </div>
                {children}
            </div>
        </div>
    );
}

/**
 * Progress Stat Card
 * Stat card with progress bar
 */
export function ProgressStatCard({
    title,
    value,
    total,
    icon,
    glowColor,
    className,
}: Omit<StatCardProps, 'value' | 'subtitle'> & { value: number; total: number }) {
    const percentage = Math.round((value / total) * 100);

    return (
        <StatCard
            title={title}
            value={`${percentage}%`}
            subtitle={`of ${total}`}
            icon={icon}
            glowColor={glowColor}
            className={className}
        >
            <div className="w-full bg-muted/50 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </StatCard>
    );
}

/**
 * Shiny Stat Card
 * Stat card with shiny text animation
 */
export function ShinyStatCard(props: StatCardProps) {
    return (
        <StatCard {...props}>
            <div className="flex items-end gap-2">
                <span className="text-3xl font-bold shiny-text">{props.value}</span>
                {props.subtitle && (
                    <span className="text-sm text-muted-foreground mb-1">{props.subtitle}</span>
                )}
            </div>
        </StatCard>
    );
}
