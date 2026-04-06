import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon: LucideIcon;
    iconColor?: string;
    iconBgColor?: string;
}

export function StatCard({
    title,
    value,
    change,
    changeLabel,
    icon: Icon,
    iconColor = 'text-primary',
    iconBgColor = 'bg-primary/10',
}: StatCardProps) {
    const isPositive = change !== undefined && change >= 0;

    return (
        <Card className="glass-card overflow-hidden">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-3xl font-bold text-foreground">{value}</p>

                        {change !== undefined && (
                            <div className="flex items-center gap-1 pt-1">
                                {isPositive ? (
                                    <TrendingUp className="w-4 h-4 text-green-500" />
                                ) : (
                                    <TrendingDown className="w-4 h-4 text-red-500" />
                                )}
                                <span className={cn(
                                    'text-xs font-medium',
                                    isPositive ? 'text-green-500' : 'text-red-500'
                                )}>
                                    {isPositive ? '+' : ''}{change}%
                                </span>
                                {changeLabel && (
                                    <span className="text-xs text-muted-foreground">{changeLabel}</span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center',
                        iconBgColor
                    )}>
                        <Icon className={cn('w-6 h-6', iconColor)} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Stat card with gradient accent
 */
export function GradientStatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    gradientFrom = 'from-blue-500',
    gradientTo = 'to-indigo-600',
}: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    gradientFrom?: string;
    gradientTo?: string;
}) {
    return (
        <Card className="overflow-hidden relative">
            <div className={cn(
                'absolute inset-0 bg-gradient-to-br opacity-10',
                gradientFrom,
                gradientTo
            )} />
            <CardContent className="p-6 relative">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-3xl font-bold text-foreground">{value}</p>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground">{subtitle}</p>
                        )}
                    </div>

                    <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br text-white',
                        gradientFrom,
                        gradientTo
                    )}>
                        <Icon className="w-6 h-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
