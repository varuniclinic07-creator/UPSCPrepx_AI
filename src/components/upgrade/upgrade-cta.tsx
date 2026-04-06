'use client';

// ═══════════════════════════════════════════════════════════════
// UPGRADE CTA COMPONENT
// Shown after feature usage to drive conversion
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';

interface UpgradeCTAProps {
    feature: string;
    usageCount?: number;
    limit?: number;
    variant?: 'banner' | 'modal' | 'inline';
    onDismiss?: () => void;
}

export function UpgradeCTA({
    feature,
    usageCount = 0,
    limit,
    variant = 'banner',
    onDismiss
}: UpgradeCTAProps) {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    const handleDismiss = () => {
        setDismissed(true);
        onDismiss?.();
    };

    const messages: Record<string, { title: string; desc: string }> = {
        notes: {
            title: `You've generated ${usageCount} notes! 📝`,
            desc: 'Upgrade for unlimited note generation and save your progress forever.'
        },
        quiz: {
            title: `Great job on ${usageCount} quizzes! 📊`,
            desc: 'Unlock unlimited quizzes and detailed analytics with Premium.'
        },
        lecture: {
            title: 'Enjoying the lecture? 🎥',
            desc: 'Get up to 50 lectures/month with Premium Plus.'
        },
        default: {
            title: 'Loving UPSC CSE Master? ❤️',
            desc: 'Upgrade to unlock all features and continue your preparation.'
        }
    };

    const { title, desc } = messages[feature] || messages.default;

    if (variant === 'inline') {
        return (
            <div className="bg-gradient-to-r from-primary/10 to-purple-50 rounded-lg p-4 flex items-center justify-between">
                <div>
                    <p className="font-semibold">{title}</p>
                    <p className="text-sm text-gray-600">{desc}</p>
                </div>
                <a
                    href="/pricing"
                    className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap"
                >
                    Upgrade
                </a>
            </div>
        );
    }

    if (variant === 'banner') {
        return (
            <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-white rounded-xl shadow-2xl border p-4 z-50">
                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                >
                    ✕
                </button>
                <div className="flex items-start gap-4">
                    <span className="text-3xl">🚀</span>
                    <div>
                        <p className="font-bold">{title}</p>
                        <p className="text-sm text-gray-600 mb-3">{desc}</p>
                        <div className="flex gap-2">
                            <a
                                href="/pricing"
                                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold"
                            >
                                View Plans
                            </a>
                            <button
                                onClick={handleDismiss}
                                className="text-gray-500 px-4 py-2 text-sm"
                            >
                                Later
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Modal variant
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl max-w-md w-full mx-4 p-8 text-center">
                <span className="text-6xl block mb-4">🎉</span>
                <h2 className="text-2xl font-bold mb-2">{title}</h2>
                <p className="text-gray-600 mb-6">{desc}</p>

                {limit && (
                    <div className="mb-6">
                        <div className="h-2 bg-gray-200 rounded-full">
                            <div
                                className="h-2 bg-primary rounded-full"
                                style={{ width: `${Math.min((usageCount / limit) * 100, 100)}%` }}
                            />
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{usageCount}/{limit} used today</p>
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={handleDismiss}
                        className="flex-1 py-3 border border-gray-200 rounded-lg"
                    >
                        Continue Free
                    </button>
                    <a
                        href="/pricing"
                        className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold"
                    >
                        Upgrade Now
                    </a>
                </div>
            </div>
        </div>
    );
}
