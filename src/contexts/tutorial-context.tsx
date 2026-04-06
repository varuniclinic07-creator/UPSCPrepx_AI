'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type TutorialKey =
    | 'dashboard'
    | 'notes'
    | 'notes-new'
    | 'quiz'
    | 'current-affairs'
    | 'videos'
    | 'materials'
    | 'planner'
    | 'bookmarks'
    | 'mind-maps'
    | 'revision'
    | 'profile'
    | 'leaderboard';

interface TutorialContextType {
    activeTutorial: TutorialKey | null;
    openTutorial: (key: TutorialKey) => void;
    closeTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function TutorialProvider({ children }: { children: React.ReactNode }) {
    const [activeTutorial, setActiveTutorial] = useState<TutorialKey | null>(null);

    const openTutorial = useCallback((key: TutorialKey) => {
        setActiveTutorial(key);
    }, []);

    const closeTutorial = useCallback(() => {
        setActiveTutorial(null);
    }, []);

    return (
        <TutorialContext.Provider value={{ activeTutorial, openTutorial, closeTutorial }}>
            {children}
        </TutorialContext.Provider>
    );
}

export function useTutorial() {
    const context = useContext(TutorialContext);
    if (context === undefined) {
        throw new Error('useTutorial must be used within a TutorialProvider');
    }
    return context;
}
