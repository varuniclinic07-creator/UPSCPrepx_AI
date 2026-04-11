'use client';

// Document Chat UI - wired to /api/agentic/doc-chat
import { useState, useRef } from 'react';

interface Message { role: 'user' | 'assistant'; content: string; }

export function DocumentChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [sending, setSending] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (file: File) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/agentic/doc-chat', {
                method: 'PUT',
                body: formData,
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            setDocumentId(data.documentId);
            setMessages([{
                role: 'assistant',
                content: `Document "${data.filename}" uploaded successfully (${data.pages} pages). Ask me anything about it!`,
            }]);
        } catch (err) {
            console.error('Upload error:', err);
            setMessages([{ role: 'assistant', content: 'Failed to upload document. Please try again.' }]);
        } finally {
            setUploading(false);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || sending) return;

        const userMessage = input.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setInput('');
        setSending(true);

        try {
            const res = await fetch('/api/agentic/doc-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    documentId,
                    question: userMessage,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Chat request failed');
            }

            const data = await res.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
        } catch (err: any) {
            console.error('Chat error:', err);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Error: ${err.message || 'Something went wrong. Please try again.'}`,
            }]);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg h-[600px] flex flex-col">
            <div className="p-4 border-b">
                <h2 className="font-bold">Chat with Document</h2>
                {!documentId && (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2 p-4 border-2 border-dashed rounded-lg text-center cursor-pointer hover:bg-gray-50"
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.docx,.doc,.txt"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUpload(file);
                            }}
                        />
                        <p className="text-gray-500">
                            {uploading ? 'Uploading...' : '📄 Click to upload PDF/DOCX'}
                        </p>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-gray-100'}`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {sending && (
                    <div className="flex justify-start">
                        <div className="max-w-[70%] p-3 rounded-lg bg-gray-100 text-gray-400">
                            Thinking...
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask about the document..."
                    className="flex-1 px-4 py-2 border rounded-lg"
                    disabled={sending || !documentId}
                />
                <button
                    onClick={sendMessage}
                    className="px-6 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
                    disabled={sending || !documentId}
                >
                    Send
                </button>
            </div>
        </div>
    );
}
