'use client';

// 10th Class Notes Browser
import { useState, useEffect } from 'react';

interface Note {
    id: string;
    title: string;
    subject: string;
    chapter: number;
    pdfUrl: string;
    thumbnail?: string;
}

export default function TenthClassNotesPage() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const subjects = ['Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Civics', 'Economics'];

    useEffect(() => {
        // Fetch notes from API
        fetchNotes();
    }, [selectedSubject]);

    const fetchNotes = async () => {
        // TODO: Implement API call
        const mockNotes: Note[] = subjects.map((subject, idx) => ({
            id: `${idx}`,
            title: `${subject} - Complete Notes`,
            subject,
            chapter: idx + 1,
            pdfUrl: `/notes/${subject.toLowerCase()}.pdf`
        }));
        setNotes(mockNotes);
    };

    const filteredNotes = notes.filter(note => {
        const matchesSubject = selectedSubject === 'all' || note.subject === selectedSubject;
        const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSubject && matchesSearch;
    });

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">10th Class Notes</h1>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <input
                    type="text"
                    placeholder="Search notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg"
                />

                <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="px-4 py-2 border rounded-lg"
                >
                    <option value="all">All Subjects</option>
                    {subjects.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                    ))}
                </select>
            </div>

            {/* Notes Grid */}
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredNotes.map(note => (
                    <div key={note.id} className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition">
                        <div className="aspect-[3/4] bg-gray-200 rounded mb-3 flex items-center justify-center">
                            <span className="text-4xl">📄</span>
                        </div>
                        <h3 className="font-bold mb-2">{note.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">Chapter {note.chapter}</p>
                        <a
                            href={note.pdfUrl}
                            download
                            className="block w-full bg-primary text-white text-center py-2 rounded-lg hover:bg-primary/90"
                        >
                            Download PDF
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
}
