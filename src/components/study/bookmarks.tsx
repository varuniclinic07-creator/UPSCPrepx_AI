'use client';

// Bookmarks System
import { useState } from 'react';

interface Bookmark {
    id: string;
    type: 'article' | 'note' | 'video' | 'scheme';
    title: string;
    url: string;
    category: string;
    addedAt: string;
    tags: string[];
}

export function Bookmarks() {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('all');

    const categories = ['Current Affairs', 'Notes', 'Lectures', 'Schemes'];

    const removeBookmark = (id: string) => {
        setBookmarks(bookmarks.filter(b => b.id !== id));
    };

    const filteredBookmarks = selectedCategory === 'all'
        ? bookmarks
        : bookmarks.filter(b => b.category === selectedCategory);

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Bookmarks</h2>

            {/* Category Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
                <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2 rounded-lg ${selectedCategory === 'all' ? 'bg-primary text-white' : 'bg-gray-100'
                        }`}
                >
                    All ({bookmarks.length})
                </button>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-lg whitespace-nowrap ${selectedCategory === cat ? 'bg-primary text-white' : 'bg-gray-100'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Bookmarks List */}
            <div className="space-y-3">
                {filteredBookmarks.map(bookmark => (
                    <div key={bookmark.id} className="flex items-start justify-between p-4 border rounded-lg hover:shadow">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl">
                                    {bookmark.type === 'article' && '📰'}
                                    {bookmark.type === 'note' && '📄'}
                                    {bookmark.type === 'video' && '🎥'}
                                    {bookmark.type === 'scheme' && '📋'}
                                </span>
                                <h4 className="font-bold">{bookmark.title}</h4>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{bookmark.category}</p>
                            <div className="flex gap-2">
                                {bookmark.tags.map(tag => (
                                    <span key={tag} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => removeBookmark(bookmark.id)}
                            className="ml-4 text-red-500 hover:text-red-700"
                        >
                            🗑️
                        </button>
                    </div>
                ))}

                {filteredBookmarks.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No bookmarks yet</p>
                )}
            </div>
        </div>
    );
}
