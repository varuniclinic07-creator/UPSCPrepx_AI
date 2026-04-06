'use client';

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

type Language = 'en' | 'hi';

const STORAGE_KEY = 'upsc-language';

/**
 * Language toggle component for English/Hindi
 */
export function LanguageToggle({ className }: { className?: string }) {
    const [language, setLanguage] = useState<Language>('en');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
        if (saved && (saved === 'en' || saved === 'hi')) {
            setLanguage(saved);
        }
        setMounted(true);
    }, []);

    const toggleLanguage = () => {
        const newLang: Language = language === 'en' ? 'hi' : 'en';
        setLanguage(newLang);
        localStorage.setItem(STORAGE_KEY, newLang);

        // Trigger re-render in components that use translations
        window.dispatchEvent(new CustomEvent('languageChange', { detail: newLang }));
    };

    if (!mounted) {
        return (
            <div className={cn('w-9 h-9', className)} />
        );
    }

    return (
        <button
            onClick={toggleLanguage}
            className={cn(
                'relative w-9 h-9 rounded-lg flex items-center justify-center',
                'text-muted-foreground hover:text-foreground',
                'hover:bg-accent transition-colors',
                className
            )}
            title={`Switch to ${language === 'en' ? 'Hindi' : 'English'}`}
        >
            <Globe className="w-5 h-5" />
            <span className="absolute -bottom-0.5 -right-0.5 px-1 text-[10px] font-medium bg-primary text-primary-foreground rounded">
                {language.toUpperCase()}
            </span>
        </button>
    );
}

/**
 * Inline language toggle with labels
 */
export function LanguageToggleInline({ className }: { className?: string }) {
    const [language, setLanguage] = useState<Language>('en');

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
        if (saved && (saved === 'en' || saved === 'hi')) {
            setLanguage(saved);
        }
    }, []);

    const handleChange = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem(STORAGE_KEY, lang);
        window.dispatchEvent(new CustomEvent('languageChange', { detail: lang }));
    };

    return (
        <div className={cn('flex items-center gap-1 p-1 rounded-lg bg-accent', className)}>
            <button
                onClick={() => handleChange('en')}
                className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                    language === 'en'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                )}
            >
                <span>English</span>
            </button>
            <button
                onClick={() => handleChange('hi')}
                className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                    language === 'hi'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                )}
            >
                <span className="font-hindi">हिंदी</span>
            </button>
        </div>
    );
}

/**
 * Hook to get current language
 */
export function useLanguage() {
    const [language, setLanguage] = useState<Language>('en');

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
        if (saved && (saved === 'en' || saved === 'hi')) {
            setLanguage(saved);
        }

        const handleLanguageChange = (e: CustomEvent<Language>) => {
            setLanguage(e.detail);
        };

        window.addEventListener('languageChange', handleLanguageChange as EventListener);
        return () => {
            window.removeEventListener('languageChange', handleLanguageChange as EventListener);
        };
    }, []);

    return language;
}
