'use client';

// ═══════════════════════════════════════════════════════════════
// FEEDBACK WIDGET
// In-app feedback collection
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';

interface FeedbackWidgetProps {
    userId?: string;
    context?: string;
}

export function FeedbackWidget({ userId, context }: FeedbackWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [type, setType] = useState<'feedback' | 'bug' | 'feature'>('feedback');
    const [message, setMessage] = useState('');
    const [rating, setRating] = useState<number | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, message, rating, userId, context }),
            });

            if (!res.ok) {
                const text = await res.text();
                console.error('Feedback submission failed:', text);
                setError('Failed to send feedback. Please try again.');
            } else {
                setSubmitted(true);
                setTimeout(() => {
                    setIsOpen(false);
                    setSubmitted(false);
                    setMessage('');
                    setRating(null);
                }, 2000);
            }
        } catch (err) {
            console.error('Feedback submission error:', err);
            setError('Network error. Please check your connection and try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary/90 z-40"
                title="Send Feedback"
            >
                💬
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 bg-white rounded-xl shadow-2xl w-80 z-50 overflow-hidden">
            {/* Header */}
            <div className="bg-primary text-white p-4 flex justify-between items-center">
                <h3 className="font-semibold">Send Feedback</h3>
                <button onClick={() => setIsOpen(false)} className="hover:opacity-80">✕</button>
            </div>

            {submitted ? (
                <div className="p-8 text-center">
                    <span className="text-4xl block mb-4">🙏</span>
                    <p className="font-semibold">Thank you!</p>
                    <p className="text-sm text-gray-500">Your feedback helps us improve.</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="p-4">
                    {/* Type Selection */}
                    <div className="flex gap-2 mb-4">
                        {[
                            { value: 'feedback', label: '💭 Feedback', color: 'blue' },
                            { value: 'bug', label: '🐛 Bug', color: 'red' },
                            { value: 'feature', label: '💡 Feature', color: 'green' }
                        ].map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setType(opt.value as any)}
                                className={`flex-1 py-2 rounded-lg text-sm ${type === opt.value
                                        ? 'bg-primary text-white'
                                        : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Rating (for feedback only) */}
                    {type === 'feedback' && (
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">How would you rate us?</p>
                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className="text-2xl hover:scale-110 transition-transform"
                                    >
                                        {rating && rating >= star ? '⭐' : '☆'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Message */}
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={
                            type === 'bug'
                                ? 'Describe the issue...'
                                : type === 'feature'
                                    ? 'What feature would you like?'
                                    : 'Share your thoughts...'
                        }
                        className="w-full h-24 p-3 border rounded-lg resize-none text-sm"
                        required
                    />

                    {/* Error Display */}
                    {error && (
                        <p className="text-red-500 text-sm mt-2">{error}</p>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full mt-3 bg-primary text-white py-2 rounded-lg font-semibold disabled:opacity-50"
                    >
                        {submitting ? 'Sending...' : 'Send Feedback'}
                    </button>
                </form>
            )}
        </div>
    );
}
