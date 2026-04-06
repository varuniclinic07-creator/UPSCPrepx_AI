'use client';

// Document Chat UI
import { useState } from 'react';

interface Message { role: 'user' | 'assistant'; content: string; }

export function DocumentChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [documentId, setDocumentId] = useState<string | null>(null);

    const sendMessage = async () => {
        if (!input.trim()) return;
        setMessages([...messages, { role: 'user', content: input }]);
        setInput('');
        // TODO: Call doc-chat API
        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'assistant', content: 'This is a response based on the uploaded document.' }]);
        }, 1000);
    };

    return (
        <div className="bg-white rounded-lg shadow-lg h-[600px] flex flex-col">
            <div className="p-4 border-b">
                <h2 className="font-bold">Chat with Document</h2>
                {!documentId && (
                    <div className="mt-2 p-4 border-2 border-dashed rounded-lg text-center cursor-pointer hover:bg-gray-50">
                        <p className="text-gray-500">📄 Click to upload PDF/DOCX</p>
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
            </div>

            <div className="p-4 border-t flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask about the document..."
                    className="flex-1 px-4 py-2 border rounded-lg"
                />
                <button onClick={sendMessage} className="px-6 py-2 bg-primary text-white rounded-lg">Send</button>
            </div>
        </div>
    );
}
