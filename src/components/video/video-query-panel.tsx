'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface QueryMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface VideoQueryPanelProps {
  topic: string;
  subject?: string;
  nodeId?: string;
}

/**
 * Video Query Panel — ask questions in the context of the current video topic.
 * Uses EvaluatorAgent to answer doubts with KG-backed responses.
 */
export function VideoQueryPanel({ topic, subject, nodeId }: VideoQueryPanelProps) {
  const [messages, setMessages] = useState<QueryMessage[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAsk = useCallback(async () => {
    if (!query.trim() || loading) return;

    const userMessage: QueryMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: query.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      const response = await fetch('/api/content/living', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          contentType: 'doubt_answer',
          subject,
          userInput: userMessage.text,
        }),
      });

      const result = await response.json();

      const assistantMessage: QueryMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: result.success
          ? (result.content?.answer || result.content?.content || 'I could not generate an answer.')
          : (result.error || 'Something went wrong.'),
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: 'Network error. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [query, loading, topic, subject]);

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-700">
      <div className="p-3 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-white">Ask a Question</h3>
        <p className="text-xs text-gray-400 mt-1">
          Context: {topic}
        </p>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <p className="text-xs text-gray-500 text-center mt-4">
            Ask any question about this topic. AI will answer using the knowledge graph.
          </p>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`rounded-lg p-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-900/40 text-blue-100 ml-4'
                  : 'bg-gray-800 text-gray-200 mr-4'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          ))
        )}
        {loading && (
          <div className="bg-gray-800 rounded-lg p-3 mr-4 animate-pulse">
            <div className="h-3 bg-gray-700 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-700 rounded w-1/2" />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAsk();
            }}
            placeholder="Ask about this topic..."
            className="flex-1 bg-gray-800 text-sm text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
            disabled={loading}
          />
          <button
            onClick={handleAsk}
            disabled={loading || !query.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Ask
          </button>
        </div>
      </div>
    </div>
  );
}
