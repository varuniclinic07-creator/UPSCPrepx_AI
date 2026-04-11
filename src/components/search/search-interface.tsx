'use client';

// BMAD Phase 4: Feature 18 - RAG Search Engine
// Global Search Interface with REAL API integration (no mock data)
import { useState } from 'react';

interface SearchResult {
    id: string;
    type: 'note' | 'article' | 'video' | 'quiz' | 'current_affairs' | 'scheme';
    title: string;
    content: string;
    source: string;
    source_url?: string;
    book_reference?: {
        book: string;
        chapter: string;
        page?: number;
    };
    syllabus_mapping: string[];
    relevance_score: number;
    highlighted_text: string;
    explainability: {
        why_matched: string;
        key_concepts: string[];
    };
}

interface SearchFilters {
    sources?: string[];
    content_type?: string[];
    syllabus_area?: string[];
}

export function SearchInterface() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTime, setSearchTime] = useState(0);
    const [suggestedAnswer, setSuggestedAnswer] = useState('');
    const [relatedQueries, setRelatedQueries] = useState<string[]>([]);
    const [filters, setFilters] = useState<SearchFilters>({});
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        const startTime = Date.now();

        try {
            const response = await fetch('/api/search/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query,
                    filters,
                    limit: 20
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || 'Search failed');
            }

            const data = await response.json();
            
            setResults(data.results);
            setSearchTime(data.search_time_ms);
            setSuggestedAnswer(data.suggested_answer_snippet);
            setRelatedQueries(data.related_queries);
        } catch (err) {
            console.error('Search error:', err);
            setError(err instanceof Error ? err.message : 'Search failed');
        } finally {
            setLoading(false);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'note': return '📄';
            case 'article': return '📰';
            case 'video': return '🎥';
            case 'quiz': return '❓';
            case 'current_affairs': return '🌍';
            case 'scheme': return '📋';
            default: return '📝';
        }
    };

    const handleFilterChange = (filterType: keyof SearchFilters, value: string[]) => {
        setFilters(prev => ({ ...prev, [filterType]: value }));
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            {/* Search Box */}
            <div className="mb-6">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search UPSC syllabus, notes, videos, PYQs, current affairs..."
                        className="flex-1 px-6 py-4 text-lg border-2 border-blue-200 rounded-xl focus:border-blue-500 outline-none"
                        autoFocus
                    />
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-semibold"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>

                {/* Quick Filters */}
                <div className="flex gap-2 mt-4 flex-wrap">
                    <span className="text-sm text-gray-600 py-2">Filters:</span>
                    {['All', 'Notes', 'Videos', 'Articles', 'Quizzes', 'Current Affairs'].map((filter) => (
                        <button
                            key={filter}
                            onClick={() => {
                                const contentTypes = filter === 'All' ? [] : [filter.toLowerCase().replace(' ', '_')];
                                handleFilterChange('content_type', contentTypes);
                            }}
                            className={`px-4 py-2 rounded-lg text-sm transition ${
                                filter === 'All' && !filters.content_type?.length
                                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                                    : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-700">❌ {error}</p>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Searching across UPSC sources...</p>
                </div>
            )}

            {/* Results */}
            {!loading && results.length > 0 && (
                <div>
                    {/* Search Stats */}
                    <div className="mb-6 flex justify-between items-center bg-blue-50 p-4 rounded-xl">
                        <p className="text-sm text-blue-800 font-medium">
                            ⚡ Found {results.length} results in {searchTime}ms
                        </p>
                    </div>

                    {/* Suggested Answer */}
                    {suggestedAnswer && (
                        <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-xl">
                            <h3 className="text-lg font-semibold text-green-800 mb-2">
                                📝 AI Suggested Answer
                            </h3>
                            <p className="text-gray-700 leading-relaxed">{suggestedAnswer}</p>
                        </div>
                    )}

                    {/* Results */}
                    <div className="space-y-4">
                        {results.map((result) => (
                            <a
                                key={result.id}
                                href={`/content/${result.type}/${result.id}`}
                                className="block bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition border border-gray-100"
                            >
                                <div className="flex items-start gap-4">
                                    <span className="text-4xl">{getTypeIcon(result.type)}</span>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-xl font-bold text-gray-900">{result.title}</h3>
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium uppercase">
                                                {result.type}
                                            </span>
                                            {result.relevance_score > 0.85 && (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                                                    {Math.round(result.relevance_score * 100)}% match
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="text-gray-700 mb-3" dangerouslySetInnerHTML={{ __html: result.highlighted_text }} />
                                        
                                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                                            <span className="flex items-center gap-1">
                                                📚 Source: <strong className="text-gray-700">{result.source}</strong>
                                            </span>
                                            {result.syllabus_mapping.length > 0 && (
                                                <span className="flex items-center gap-1">
                                                    📖 {result.syllabus_mapping.slice(0, 3).join(', ')}
                                                </span>
                                            )}
                                        </div>

                                        {/* Explainability Box */}
                                        {result.explainability && (
                                            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                <p className="text-xs text-gray-600">
                                                    <strong>Why this matched:</strong> {result.explainability.why_matched}
                                                </p>
                                                {result.explainability.key_concepts.length > 0 && (
                                                    <div className="flex gap-2 mt-2 flex-wrap">
                                                        {result.explainability.key_concepts.map((concept, i) => (
                                                            <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                                                                {concept}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>

                    {/* Related Queries */}
                    {relatedQueries.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-lg font-semibold mb-3 text-gray-800">🔍 Related Searches</h3>
                            <div className="flex flex-wrap gap-2">
                                {relatedQueries.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setQuery(q)}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* No Results */}
            {!loading && query && results.length === 0 && !error && (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <p className="text-gray-600 text-lg">😕 No results found for "{query}"</p>
                    <p className="text-gray-500 mt-2">Try different keywords or adjust filters</p>
                </div>
            )}

            {/* Initial State */}
            {!query && !loading && (
                <div className="text-center py-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        🔍 RAG-Powered UPSC Search
                    </h2>
                    <p className="text-gray-600 text-lg mb-6">
                        Search across notes, videos, PYQs, current affairs, and more with AI-powered semantic search
                    </p>
                    <div className="flex justify-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-2">✅ Vector Search</span>
                        <span className="flex items-center gap-2">✅ Source Citations</span>
                        <span className="flex items-center gap-2">✅ AI Answer Snippets</span>
                        <span className="flex items-center gap-2">✅ &lt;1s Response</span>
                    </div>
                </div>
            )}
        </div>
    );
}
