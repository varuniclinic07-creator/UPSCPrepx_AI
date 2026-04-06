'use client';

// Web Search UI
import { useState } from 'react';

export function WebSearchUI() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const search = async () => {
        if (!query.trim()) return;
        setLoading(true);
        try {
            const res = await fetch('/api/agentic/web-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, maxResults: 10 })
            });
            const data = await res.json();
            setResults(data.results || []);
        } catch (e) {
            console.error('Search error:', e);
        }
        setLoading(false);
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">UPSC Web Search</h2>
            <div className="flex gap-2 mb-6">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && search()}
                    placeholder="Search UPSC-relevant content..."
                    className="flex-1 px-4 py-3 border rounded-lg"
                />
                <button onClick={search} disabled={loading} className="px-8 py-3 bg-primary text-white rounded-lg">
                    {loading ? '...' : 'Search'}
                </button>
            </div>
            <div className="space-y-4">
                {results.map((r, idx) => (
                    <div key={idx} className="p-4 border rounded-lg hover:shadow">
                        <h3 className="font-bold text-primary">{r.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{r.snippet}</p>
                        <a href={r.url} target="_blank" className="text-xs text-gray-400">{r.url}</a>
                    </div>
                ))}
            </div>
        </div>
    );
}
