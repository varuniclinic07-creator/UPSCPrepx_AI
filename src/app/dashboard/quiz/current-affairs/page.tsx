'use client';

// Current Affairs Quiz
import { useState } from 'react';

interface Question {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    category: string;
}

export default function CurrentAffairsQuizPage() {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [score, setScore] = useState(0);

    const questions: Question[] = [
        {
            id: '1',
            question: 'Which country hosted the G20 Summit in 2023?',
            options: ['India', 'Japan', 'USA', 'Brazil'],
            correctAnswer: 0,
            explanation: 'India hosted the G20 Summit in New Delhi in September 2023.',
            category: 'International Relations'
        }
    ];

    const handleAnswer = (answerIdx: number) => {
        setSelectedAnswer(answerIdx);
        setShowExplanation(true);

        if (answerIdx === questions[currentQuestion].correctAnswer) {
            setScore(score + 1);
        }
    };

    const nextQuestion = () => {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowExplanation(false);
    };

    if (currentQuestion >= questions.length) {
        return (
            <div className="container mx-auto p-6 max-w-2xl">
                <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                    <h2 className="text-3xl font-bold mb-4">Quiz Complete!</h2>
                    <p className="text-5xl font-bold text-primary mb-4">
                        {score}/{questions.length}
                    </p>
                    <p className="text-xl mb-6">
                        You got {Math.round((score / questions.length) * 100)}% correct
                    </p>
                    <button
                        onClick={() => {
                            setCurrentQuestion(0);
                            setScore(0);
                        }}
                        className="bg-primary text-white px-6 py-3 rounded-lg"
                    >
                        Retake Quiz
                    </button>
                </div>
            </div>
        );
    }

    const question = questions[currentQuestion];

    return (
        <div className="container mx-auto p-6 max-w-2xl">
            <div className="bg-white rounded-lg shadow-lg p-6">
                {/* Progress */}
                <div className="flex justify-between mb-4 text-sm text-gray-600">
                    <span>Question {currentQuestion + 1}/{questions.length}</span>
                    <span>Score: {score}</span>
                </div>

                {/* Question */}
                <h3 className="text-xl font-bold mb-4">{question.question}</h3>

                {/* Options */}
                <div className="space-y-3 mb-6">
                    {question.options.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => !showExplanation && handleAnswer(idx)}
                            disabled={showExplanation}
                            className={`w-full p-4 text-left rounded-lg border-2 transition ${showExplanation
                                    ? idx === question.correctAnswer
                                        ? 'border-green-500 bg-green-50'
                                        : idx === selectedAnswer
                                            ? 'border-red-500 bg-red-50'
                                            : 'border-gray-200'
                                    : 'border-gray-200 hover:border-primary'
                                }`}
                        >
                            {option}
                            {showExplanation && idx === question.correctAnswer && (
                                <span className="ml-2 text-green-600">✓ Correct</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Explanation */}
                {showExplanation && (
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <h4 className="font-bold mb-2">Explanation:</h4>
                        <p>{question.explanation}</p>
                    </div>
                )}

                {/* Next Button */}
                {showExplanation && (
                    <button
                        onClick={nextQuestion}
                        className="w-full bg-primary text-white py-3 rounded-lg"
                    >
                        Next Question →
                    </button>
                )}
            </div>
        </div>
    );
}
