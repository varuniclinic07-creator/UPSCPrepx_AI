'use client';

import React from 'react';
import { useTutorial, TutorialKey } from '@/contexts/tutorial-context';
import { tutorialContent } from '@/lib/tutorials/content';
import { X, ChevronRight, Lightbulb } from 'lucide-react';

/**
 * TutorialModal - Displays step-by-step tutorial for the active page
 */
export function TutorialModal() {
    const { activeTutorial, closeTutorial } = useTutorial();

    if (!activeTutorial) return null;

    const content = tutorialContent[activeTutorial];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="glass-card max-w-lg w-full p-6 rounded-2xl shadow-2xl animate-scale-in">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Lightbulb className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">{content.title}</h2>
                            <p className="text-sm text-muted-foreground">{content.subtitle}</p>
                        </div>
                    </div>
                    <button
                        onClick={closeTutorial}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        aria-label="Close tutorial"
                    >
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Steps */}
                <ul className="space-y-4 mb-6">
                    {content.steps.map((step, index) => (
                        <li key={index} className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                                {index + 1}
                            </div>
                            <div>
                                <h4 className="font-semibold text-foreground">{step.title}</h4>
                                <p className="text-sm text-muted-foreground">{step.description}</p>
                            </div>
                        </li>
                    ))}
                </ul>

                {/* Footer */}
                <div className="flex justify-end">
                    <button
                        onClick={closeTutorial}
                        className="px-5 py-2.5 rounded-full gradient-primary text-white font-medium text-sm flex items-center gap-2 btn-hover"
                    >
                        Got it! <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
