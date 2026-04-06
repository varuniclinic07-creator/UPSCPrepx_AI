'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-provider';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
    variant?: 'icon' | 'dropdown' | 'inline';
    className?: string;
}

/**
 * Theme toggle button component
 */
export function ThemeToggle({ variant = 'icon', className }: ThemeToggleProps) {
    const { theme, setTheme, resolvedTheme } = useTheme();

    if (variant === 'inline') {
        return (
            <div className={cn('flex items-center gap-1 p-1 rounded-lg bg-accent', className)}>
                <ThemeButton
                    active={theme === 'light'}
                    onClick={() => setTheme('light')}
                    icon={<Sun className="w-4 h-4" />}
                    label="Light"
                />
                <ThemeButton
                    active={theme === 'dark'}
                    onClick={() => setTheme('dark')}
                    icon={<Moon className="w-4 h-4" />}
                    label="Dark"
                />
                <ThemeButton
                    active={theme === 'system'}
                    onClick={() => setTheme('system')}
                    icon={<Monitor className="w-4 h-4" />}
                    label="System"
                />
            </div>
        );
    }

    // Icon toggle - cycles through themes
    const handleToggle = () => {
        if (theme === 'light') {
            setTheme('dark');
        } else if (theme === 'dark') {
            setTheme('system');
        } else {
            setTheme('light');
        }
    };

    return (
        <button
            onClick={handleToggle}
            className={cn(
                'relative w-9 h-9 rounded-lg flex items-center justify-center',
                'text-muted-foreground hover:text-foreground',
                'hover:bg-accent transition-colors',
                className
            )}
            title={`Current: ${theme} (${resolvedTheme})`}
        >
            {/* Sun icon */}
            <Sun className={cn(
                'w-5 h-5 absolute transition-all duration-300',
                resolvedTheme === 'light'
                    ? 'rotate-0 scale-100 opacity-100'
                    : 'rotate-90 scale-0 opacity-0'
            )} />

            {/* Moon icon */}
            <Moon className={cn(
                'w-5 h-5 absolute transition-all duration-300',
                resolvedTheme === 'dark'
                    ? 'rotate-0 scale-100 opacity-100'
                    : '-rotate-90 scale-0 opacity-0'
            )} />

            {/* System indicator dot */}
            {theme === 'system' && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" />
            )}
        </button>
    );
}

function ThemeButton({
    active,
    onClick,
    icon,
    label
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                active
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
            )}
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
}
