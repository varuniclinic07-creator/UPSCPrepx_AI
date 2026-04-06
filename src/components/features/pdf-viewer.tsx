'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, Plus, Save, Trash2, MapPin } from 'lucide-react';
import { saveAnnotation, getAnnotations, deleteAnnotation, type Annotation } from '@/lib/pdf/annotation-service';
import { toast } from 'sonner';

interface PDFViewerProps {
    pdfId: string; // Added for DB tracking
    url: string;
    title?: string;
}

export function PDFViewer({ pdfId, url, title }: PDFViewerProps) {
    const [page, setPage] = useState(1);
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // New annotation state
    const [newNote, setNewNote] = useState('');
    const [newPage, setNewPage] = useState('1');

    useEffect(() => {
        loadAnnotations();
    }, [pdfId]);

    async function loadAnnotations() {
        try {
            const data = await getAnnotations(pdfId);
            setAnnotations(data);
        } catch (error) {
            console.error('Failed to load annotations', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!newNote.trim()) return;

        try {
            const annotation = await saveAnnotation({
                pdfId,
                pageNumber: parseInt(newPage) || 1,
                type: 'note',
                content: newNote,
                position: {}, // Sidebar note, no visual position
                color: 'yellow'
            });

            setAnnotations(prev => [...prev, annotation].sort((a, b) => a.pageNumber - b.pageNumber));
            setNewNote('');
            setIsAdding(false);
            toast.success('Note added');
        } catch (error) {
            toast.error('Failed to save note');
        }
    }

    async function handleDelete(id: string) {
        try {
            await deleteAnnotation(id);
            setAnnotations(prev => prev.filter(a => a.id !== id));
            toast.success('Note deleted');
        } catch (error) {
            toast.error('Failed to delete note');
        }
    }

    function jumpToPage(pageNum: number) {
        setPage(pageNum);
        // Force iframe reload to jump (browser native viewer support)
        const iframe = document.getElementById('pdf-frame') as HTMLIFrameElement;
        if (iframe) {
            iframe.src = `${url}#page=${pageNum}`;
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[800px]">
            {/* Main Viewer */}
            <div className="lg:col-span-3 h-full flex flex-col bg-white rounded-xl shadow-lg border overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="font-semibold text-gray-800">{title || 'Document Viewer'}</h2>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => window.open(url, '_blank')}>
                            Download
                        </Button>
                    </div>
                </div>
                <div className="flex-1 relative bg-gray-100">
                    <iframe
                        id="pdf-frame"
                        src={`${url}#page=${page}`}
                        className="w-full h-full border-none"
                        title="PDF Viewer"
                    />
                </div>
            </div>

            {/* Smart Sidebar */}
            <div className="lg:col-span-1 h-full flex flex-col bg-white rounded-xl shadow-lg border">
                <div className="p-4 border-b bg-gray-50">
                    <h3 className="font-semibold flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-indigo-600" />
                        Smart Notes
                    </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                    ) : annotations.length === 0 && !isAdding ? (
                        <div className="text-center text-gray-500 py-8">
                            <p className="text-sm">No notes yet.</p>
                            <p className="text-xs mt-1">Add notes to track important points.</p>
                        </div>
                    ) : (
                        annotations.map(note => (
                            <Card key={note.id} className="p-3 hover:shadow-md transition-shadow group relative">
                                <div className="flex justify-between items-start mb-2">
                                    <span
                                        onClick={() => jumpToPage(note.pageNumber)}
                                        className="text-xs font-bold px-2 py-1 bg-indigo-100 text-indigo-700 rounded cursor-pointer hover:bg-indigo-200"
                                    >
                                        Page {note.pageNumber}
                                    </span>
                                    <button
                                        onClick={() => handleDelete(note.id)}
                                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 p-1 rounded"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                            </Card>
                        ))
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50">
                    {isAdding ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-600">Page:</span>
                                <Input
                                    type="number"
                                    value={newPage}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPage(e.target.value)}
                                    className="w-20 h-8"
                                />
                            </div>
                            <Textarea
                                placeholder="Type your observation..."
                                value={newNote}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewNote(e.target.value)}
                                className="min-h-[80px] text-sm"
                            />
                            <div className="flex gap-2">
                                <Button size="sm" onClick={handleSave} className="w-full">
                                    <Save className="w-3 h-3 mr-1" /> Save
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button onClick={() => setIsAdding(true)} className="w-full bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="w-4 h-4 mr-2" /> Add Smart Note
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
