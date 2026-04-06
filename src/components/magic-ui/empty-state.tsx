'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    BookOpen,
    Brain,
    Newspaper,
    Search,
    FileText,
    Plus,
    type LucideIcon
} from 'lucide-react';

interface EmptyStateProps {
    icon?: LucideIcon | string;
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
    onAction?: () => void;
    className?: string;
    variant?: 'default' | 'card' | 'inline';
    iconColor?: string;
}

const iconMap: Record<string, LucideIcon> = {
    notes: BookOpen,
    quiz: Brain,
    'current-affairs': Newspaper,
    search: Search,
    document: FileText,
};

/**
 * Empty state component for no-data scenarios
 */
export function EmptyState({
    icon,
    title,
    description,
    actionLabel,
    actionHref,
    onAction,
    className,
    variant = 'default',
    iconColor = 'text-primary',
}: EmptyStateProps) {
    // Resolve icon
    let IconComponent: LucideIcon | null = null;
    let emojiIcon: string | null = null;

    if (typeof icon === 'string') {
        if (iconMap[icon]) {
            IconComponent = iconMap[icon];
        } else {
            emojiIcon = icon;
        }
    } else if (icon) {
        IconComponent = icon;
    }

    const content = (
        <div className={cn(
            'flex flex-col items-center text-center',
            variant === 'inline' ? 'py-8' : 'p-12',
            className
        )}>
            {/* Icon */}
            <div className={cn(
                'rounded-2xl flex items-center justify-center mb-4',
                variant === 'inline' ? 'w-12 h-12' : 'w-16 h-16',
                'bg-primary/10'
            )}>
                {emojiIcon ? (
                    <span className={variant === 'inline' ? 'text-2xl' : 'text-3xl'}>
                        {emojiIcon}
                    </span>
                ) : IconComponent ? (
                    <IconComponent className={cn(
                        iconColor,
                        variant === 'inline' ? 'w-6 h-6' : 'w-8 h-8'
                    )} />
                ) : (
                    <FileText className={cn(
                        iconColor,
                        variant === 'inline' ? 'w-6 h-6' : 'w-8 h-8'
                    )} />
                )}
            </div>

            {/* Text */}
            <h3 className={cn(
                'font-semibold text-foreground mb-2',
                variant === 'inline' ? 'text-base' : 'text-lg'
            )}>
                {title}
            </h3>
            <p className={cn(
                'text-muted-foreground max-w-sm',
                variant === 'inline' ? 'text-sm mb-4' : 'mb-6'
            )}>
                {description}
            </p>

            {/* Action */}
            {(actionLabel && actionHref) && (
                <Button variant="gradient" asChild>
                    <Link href={actionHref}>
                        <Plus className="w-4 h-4 mr-2" />
                        {actionLabel}
                    </Link>
                </Button>
            )}
            {(actionLabel && onAction && !actionHref) && (
                <Button variant="gradient" onClick={onAction}>
                    <Plus className="w-4 h-4 mr-2" />
                    {actionLabel}
                </Button>
            )}
        </div>
    );

    if (variant === 'card') {
        return (
            <Card className="glass-card">
                <CardContent className="p-0">
                    {content}
                </CardContent>
            </Card>
        );
    }

    return content;
}

/**
 * Common empty state presets
 */
export function NotesEmptyState() {
    return (
        <EmptyState
            icon={BookOpen}
            iconColor="text-blue-500"
            title="No notes yet"
            description="Generate your first AI-powered study notes to get started"
            actionLabel="Generate Notes"
            actionHref="/notes/new"
            variant="card"
        />
    );
}

export function QuizEmptyState() {
    return (
        <EmptyState
            icon={Brain}
            iconColor="text-purple-500"
            title="No quizzes yet"
            description="Generate your first AI-powered quiz to test your knowledge"
            actionLabel="Generate Quiz"
            actionHref="/quiz/new"
            variant="card"
        />
    );
}

export function CurrentAffairsEmptyState() {
    return (
        <EmptyState
            icon={Newspaper}
            iconColor="text-orange-500"
            title="No current affairs available"
            description="Check back later for daily UPSC-relevant news and analysis"
            variant="card"
        />
    );
}

export function SearchEmptyState({ query }: { query: string }) {
    return (
        <EmptyState
            icon={Search}
            iconColor="text-gray-500"
            title="No results found"
            description={`We couldn't find anything matching "${query}". Try a different search term.`}
            variant="inline"
        />
    );
}
