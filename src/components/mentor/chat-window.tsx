/**
 * AI Mentor Chat Window Component
 * 
 * Master Prompt v8.0 - Feature F10 (READ Mode)
 * - Message display and input
 * - AI response handling
 * - Bilingual support
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Loader2, AlertCircle } from 'lucide-react';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

interface ChatWindowProps {
  showHindi: boolean;
  sessionId: string | null;
}

export function MentorChatWindow({ showHindi, sessionId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (sessionId) {
      loadMessages();
    } else {
      setMessages([{ role: 'assistant', content: showHindi ? 'नमस्ते! मैं आपका AI UPSC मेंटर हूँ। मैं आपकी तैयारी में कैसे मदद कर सकता हूँ?' : 'Hello! I am your AI UPSC Mentor. How can I help you with your preparation today?' }]);
    }
  }, [sessionId]);

  const loadMessages = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/mentor/chat?session_id=${sessionId}`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // If no session, create one conceptually (would need API call in real app)
      const currentSessionId = sessionId || 'temp-session-1'; 

      const response = await fetch('/api/mentor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: currentSessionId, message: userMessage.content }),
      });

      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.data.reply }]);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to get response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-saffron-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-saffron-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <Bot className="w-4 h-4 text-gray-600" />
            </div>
            <div className="bg-white border border-gray-200 p-3 rounded-lg rounded-bl-none">
              <Loader2 className="w-4 h-4 animate-spin text-saffron-600" />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={showHindi ? 'अपना संदेश लिखें...' : 'Type your message...'}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-saffron-500 focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 bg-saffron-600 text-white rounded-lg hover:bg-saffron-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-[10px] text-gray-400 mt-2 text-center">
          {showHindi ? 'AI मेंटर गलतियाँ कर सकता है। महत्वपूर्ण जानकारी की जाँच करें।' : 'AI Mentor can make mistakes. Check important info.'}
        </p>
      </div>
    </div>
  );
}