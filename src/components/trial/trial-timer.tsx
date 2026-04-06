'use client';

// ═══════════════════════════════════════════════════════════════
// TRIAL COUNTDOWN TIMER
// Creates urgency for trial-to-paid conversion
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';

interface TrialTimerProps {
    endsAt: string | Date;
    onExpire?: () => void;
}

export function TrialTimer({ endsAt, onExpire }: TrialTimerProps) {
    const [timeLeft, setTimeLeft] = useState<{
        hours: number;
        minutes: number;
        seconds: number;
    } | null>(null);

    useEffect(() => {
        const endTime = new Date(endsAt).getTime();

        const updateTimer = () => {
            const now = Date.now();
            const diff = endTime - now;

            if (diff <= 0) {
                setTimeLeft(null);
                onExpire?.();
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft({ hours, minutes, seconds });
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [endsAt, onExpire]);

    if (!timeLeft) {
        return (
            <div className="bg-red-100 border border-red-300 rounded-lg p-4 text-center">
                <p className="text-red-600 font-bold">Your trial has expired!</p>
                <a href="/pricing" className="text-primary underline">Upgrade now to continue</a>
            </div>
        );
    }

    const isUrgent = timeLeft.hours < 6;

    return (
        <div className={`rounded-lg p-4 ${isUrgent ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600">Trial time remaining:</p>
                    <div className="flex gap-2 mt-1">
                        <TimeBlock value={timeLeft.hours} label="hrs" urgent={isUrgent} />
                        <span className="text-2xl font-bold">:</span>
                        <TimeBlock value={timeLeft.minutes} label="min" urgent={isUrgent} />
                        <span className="text-2xl font-bold">:</span>
                        <TimeBlock value={timeLeft.seconds} label="sec" urgent={isUrgent} />
                    </div>
                </div>
                <a
                    href="/pricing"
                    className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90"
                >
                    Upgrade Now
                </a>
            </div>
            {isUrgent && (
                <p className="text-red-600 text-sm mt-2">
                    ⚠️ Less than 6 hours left! Don't lose your progress.
                </p>
            )}
        </div>
    );
}

function TimeBlock({ value, label, urgent }: { value: number; label: string; urgent: boolean }) {
    return (
        <div className="text-center">
            <div className={`text-2xl font-bold ${urgent ? 'text-red-600' : 'text-gray-800'}`}>
                {value.toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-gray-500">{label}</div>
        </div>
    );
}
