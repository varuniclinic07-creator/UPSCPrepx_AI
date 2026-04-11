'use client';

import { useState } from 'react';
import { Calculator, Send } from 'lucide-react';
import { ShimmerButton } from '@/components/magic-ui/shimmer-button';

export default function MathSolverPage() {
    const [equation, setEquation] = useState('');
    const [solution, setSolution] = useState<any>(null);
    const [solving, setSolving] = useState(false);

    const handleSolve = async () => {
        setSolving(true);
        try {
            const res = await fetch('/api/math/solve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ equation })
            });
            const data = await res.json();
            setSolution(data.solution);
        } catch (error) {
            console.error('Failed to solve:', error);
        } finally {
            setSolving(false);
        }
    };

    return (
        <div className="flex flex-col gap-8">
            <header>
                <h1 className="text-4xl font-bold">Math <span className="text-gradient">Solver</span></h1>
                <p className="text-muted-foreground">AI-powered step-by-step solutions</p>
            </header>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <input
                        type="text"
                        value={equation}
                        onChange={(e) => setEquation(e.target.value)}
                        placeholder="Enter equation, e.g., 2x + 5 = 15"
                        className="w-full h-12 px-4 bg-card border rounded-xl"
                    />
                    <ShimmerButton onClick={handleSolve} disabled={!equation || solving} className="w-full">
                        <Calculator className="w-5 h-5 mr-2" />
                        {solving ? 'Solving...' : 'Solve'}
                    </ShimmerButton>
                </div>

                {solution && (
                    <div className="bento-card p-6 space-y-4">
                        <h3 className="font-bold">Solution: {solution.solution}</h3>
                        <div className="space-y-2">
                            {solution.steps?.map((step: any, i: number) => (
                                <div key={i} className="p-3 bg-muted/20 rounded-lg">
                                    <p className="text-sm font-medium">Step {step.step}</p>
                                    <p className="text-sm text-muted-foreground">{step.explanation}</p>
                                    <p className="text-sm font-mono">{step.result}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
