'use client';

// Doubt Clearing Component
import { useState } from 'react';

export function DoubtClearing() {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');

    const askQuestion = async () => {
        if (!question.trim()) return;
        // TODO: Call AI API
        setAnswer('This is an AI-generated answer to your question. The AI is processing your query...');
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Ask Your Doubts</h2>
            <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Type your question here..."
                className="w-full h-32 p-4 border rounded-lg mb-4"
            />
            <button onClick={askQuestion} className="w-full bg-primary text-white py-3 rounded-lg mb-4">
                Ask AI Mentor
            </button>
            {answer && (
                <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-bold mb-2">AI Response:</h3>
                    <p>{answer}</p>
                </div>
            )}
        </div>
    );
}
