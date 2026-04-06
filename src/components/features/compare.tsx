'use client';

// Compare Topics Component
export function Compare() {
    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Compare Topics</h2>
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <h3 className="font-bold mb-2 text-center">President</h3>
                    <ul className="space-y-2 text-sm">
                        <li>• Head of State</li>
                        <li>• Elected indirectly</li>
                        <li>• Term: 5 years</li>
                        <li>• Article 52-62</li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-bold mb-2 text-center">Prime Minister</h3>
                    <ul className="space-y-2 text-sm">
                        <li>• Head of Government</li>
                        <li>• Elected by majority party</li>
                        <li>• Term: Until majority</li>
                        <li>• Article 74-75</li>
                    </ul>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t">
                <button className="w-full bg-primary text-white py-2 rounded-lg">+ Create New Comparison</button>
            </div>
        </div>
    );
}
