'use client';

// Revision Tracker
import { useState } from 'react';

interface RevisionTopic {
    id: string;
    topic: string;
    subject: string;
    lastRevised: string;
    nextRevision: string;
    revisionCount: number;
    confidence: number; // 1-5
}

export function RevisionTracker() {
    const [topics, setTopics] = useState<RevisionTopic[]>([]);

    const markRevised = (id: string) => {
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        setTopics(topics.map(topic =>
            topic.id === id
                ? {
                    ...topic,
                    lastRevised: today,
                    nextRevision: nextWeek,
                    revisionCount: topic.revisionCount + 1
                }
                : topic
        ));
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Revision Tracker</h2>

            {/* Spaced Repetition Info */}
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="font-bold mb-2">Spaced Repetition Schedule:</h3>
                <p className="text-sm text-gray-700">
                    Revise topics at increasing intervals: Day 1, Day 3, Day 7, Day 15, Day 30
                </p>
            </div>

            {/* Topics List */}
            <div className="space-y-3">
                {topics.map(topic => (
                    <div key={topic.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                            <h4 className="font-bold">{topic.topic}</h4>
                            <p className="text-sm text-gray-600">{topic.subject}</p>
                            <p className="text-xs text-gray-500">
                                Last: {new Date(topic.lastRevised).toLocaleDateString()} |
                                Next: {new Date(topic.nextRevision).toLocaleDateString()} |
                                Count: {topic.revisionCount}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            {/* Confidence stars */}
                            {[1, 2, 3, 4, 5].map(star => (
                                <span key={star} className={star <= topic.confidence ? 'text-yellow-500' : 'text-gray-300'}>
                                    ★
                                </span>
                            ))}
                        </div>

                        <button
                            onClick={() => markRevised(topic.id)}
                            className="ml-4 px-4 py-2 bg-green-500 text-white rounded-lg"
                        >
                            Mark Revised
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
