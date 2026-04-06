'use client';

// Notes Editor Component
import { useState } from 'react';

export function NotesEditor() {
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');

    const handleSave = async () => {
        // TODO: Save to API
        alert('Notes saved!');
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note Title..."
                className="w-full text-2xl font-bold mb-4 outline-none border-b pb-2"
            />
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing your notes..."
                className="w-full h-96 outline-none resize-none"
            />
            <div className="flex justify-between mt-4 pt-4 border-t">
                <span className="text-sm text-gray-500">{content.length} characters</span>
                <button onClick={handleSave} className="bg-primary text-white px-6 py-2 rounded-lg">Save Notes</button>
            </div>
        </div>
    );
}
