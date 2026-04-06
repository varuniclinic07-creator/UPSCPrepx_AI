'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextValue {
    theme: Theme;
    resolvedTheme: 'dark' | 'light';
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'upsc-theme';

/**
 * Theme provider component
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('system');
    const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');
    const [mounted, setMounted] = useState(false);

    // Get system preference
    const getSystemTheme = (): 'dark' | 'light' => {
        if (typeof window === 'undefined') return 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    // Apply theme to DOM
    const applyTheme = (newTheme: Theme) => {
        const root = document.documentElement;
        const resolved = newTheme === 'system' ? getSystemTheme() : newTheme;

        root.classList.remove('light', 'dark');
        root.classList.add(resolved);
        setResolvedTheme(resolved);
    };

    // Set theme
    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem(STORAGE_KEY, newTheme);
        applyTheme(newTheme);
    };

    // Initialize theme on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem(STORAGE_KEY) as Theme | null;
        const initialTheme = savedTheme || 'system';

        setThemeState(initialTheme);
        applyTheme(initialTheme);
        setMounted(true);

        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (theme === 'system') {
                applyTheme('system');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Prevent flash on initial load
    if (!mounted) {
        return (
            <div style={{ visibility: 'hidden' }}>
                {children}
            </div>
        );
    }

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

/**
 * Hook to access theme context
 */
export function useTheme(): ThemeContextValue {
    const context = useContext(ThemeContext);

    if (context === undefined) {
        // Return default values if not in provider
        return {
            theme: 'system',
            resolvedTheme: 'dark',
            setTheme: () => { },
        };
    }

    return context;
}
