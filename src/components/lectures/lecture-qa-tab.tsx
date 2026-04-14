'use client';

import { useState } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  lectureTopic: string;
}

export function LectureQATab({ lectureTopic }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const askQuestion = async () => {
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Context: The student is watching a lecture on "${lectureTopic}" for UPSC preparation. Answer their question in simple language.\n\nQuestion: ${question}`,
        }),
      });

      const data = await res.json();
      const answer = data.response || data.content || data.text || 'Sorry, I could not generate an answer.';
      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to get answer. Please try again.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-80">
      <div className="flex-1 overflow-y-auto space-y-3 mb-3">
        {messages.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">
            Ask any question about "{lectureTopic}" and get instant AI-powered answers.
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 bg-saffron-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-saffron-600" />
              </div>
            )}
            <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
              msg.role === 'user'
                ? 'bg-saffron-600 text-white'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-gray-600" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 bg-saffron-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-3.5 h-3.5 text-saffron-600 animate-spin" />
            </div>
            <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-500">Thinking...</div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') askQuestion(); }}
          placeholder="Ask a question..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-saffron-500 focus:border-transparent"
        />
        <button
          onClick={askQuestion}
          disabled={loading || !input.trim()}
          className="px-3 py-2 bg-saffron-600 text-white rounded-lg hover:bg-saffron-700 disabled:opacity-50 transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
