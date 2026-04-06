'use client';

// Flashcards Component
import { useState } from 'react';

interface Flashcard {
    id: string;
    front: string;
    back: string;
    category: string;
}

export function Flashcards() {
    const [cards] = useState<Flashcard[]>([
        { id: '1', front: 'Article 14', back: 'Equality before law', category: 'Polity' },
        { id: '2', front: 'Article 21', back: 'Right to life and personal liberty', category: 'Polity' }
    ]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);

    const nextCard = () => { setCurrentIndex((currentIndex + 1) % cards.length); setFlipped(false); };
    const prevCard = () => { setCurrentIndex((currentIndex - 1 + cards.length) % cards.length); setFlipped(false); };

    const card = cards[currentIndex];

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Flashcards</h2>
            <div className="text-center">
                <div
                    onClick={() => setFlipped(!flipped)}
                    className="w-full h-48 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
                >
                    <p className="text-2xl font-bold text-white p-6">{flipped ? card.back : card.front}</p>
                </div>
                <p className="mt-2 text-sm text-gray-500">Click to flip • {currentIndex + 1}/{cards.length}</p>
                <div className="flex justify-center gap-4 mt-4">
                    <button onClick={prevCard} className="px-6 py-2 border rounded-lg">← Previous</button>
                    <button onClick={nextCard} className="px-6 py-2 bg-primary text-white rounded-lg">Next →</button>
                </div>
            </div>
        </div>
    );
}
