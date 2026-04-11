/**
 * Streaming Chat Component
 * Real-time AI chat with token-by-token streaming output
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAIStream } from '@/lib/ai/use-ai-stream';
import { Send, StopCircle, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface StreamingChatProps {
  initialMessages?: Message[];
  systemPrompt?: string;
  placeholder?: string;
  className?: string;
}

export function StreamingChat({
  initialMessages = [],
  systemPrompt,
  placeholder = 'Ask anything...',
  className = '',
}: StreamingChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    content: streamedContent,
    isLoading,
    error,
    metadata,
    isDone,
    startStream,
    abortStream,
    reset,
  } = useAIStream({
    systemPrompt,
    onError: (err) => {
      console.error('Streaming error:', err);
    },
    onComplete: (fullContent) => {
      // Add complete response to messages
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: fullContent },
      ]);
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamedContent, isLoading]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Start streaming with all messages (for context)
    const allMessages = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    startStream(allMessages);
  };

  const handleStop = () => {
    abortStream();
    // Add partial content if any
    if (streamedContent) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: streamedContent },
      ]);
    }
    reset();
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-saffron-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
        ))}

        {/* Streaming Response */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-saffron-600 animate-pulse" />
                <span className="text-xs text-gray-500">
                  {metadata?.provider ? `Using ${metadata.provider}` : 'Thinking...'}
                </span>
              </div>
              <div className="whitespace-pre-wrap">
                {streamedContent}
                <span className="inline-block w-2 h-4 ml-1 bg-saffron-600 animate-pulse" />
              </div>
              {metadata?.latency && (
                <div className="text-xs text-gray-400 mt-2">
                  {metadata.latency}ms • {streamedContent.split(/\s+/).length} words
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-red-50 border border-red-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-600">{error.message}</p>
                  <button
                    onClick={() => {
                      reset();
                      setError(null);
                    }}
                    className="mt-2 text-sm text-red-700 underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          {isLoading ? (
            <button
              type="button"
              onClick={handleStop}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors"
            >
              <StopCircle className="w-5 h-5" />
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-4 py-2 bg-saffron-600 text-white rounded-lg hover:bg-saffron-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              <Send className="w-5 h-5" />
              Send
            </button>
          )}
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as React.FormEvent);
              }
            }}
            placeholder={placeholder}
            rows={1}
            className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-saffron-500 focus:border-transparent"
            style={{ minHeight: '44px', maxHeight: '200px' }}
          />
        </form>
        {isDone && metadata && (
          <div className="text-xs text-gray-400 mt-2 flex items-center gap-4">
            <span>Provider: {metadata.provider}</span>
            {metadata.latency && <span>Latency: {metadata.latency}ms</span>}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Simple TypingIndicator component
 */
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}
