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
import { Send, User, Bot, Loader2, AlertCircle, BookOpen, Target, RefreshCw, Stethoscope } from 'lucide-react';

type MentorMode = 'explain' | 'strategy' | 'revision' | 'diagnostic';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
  mode?: MentorMode;
  citations?: Array<{ sourceId: string; snippet: string; url?: string }>;
}

interface ChatWindowProps {
  showHindi: boolean;
  sessionId: string | null;
}

const MODES: { id: MentorMode; label: string; labelHi: string; icon: React.ReactNode; hint: string }[] = [
  { id: 'explain',    label: 'Explain',    labelHi: 'समझाएँ',    icon: <BookOpen className="w-3.5 h-3.5" />,    hint: 'Grounded, cited answers from notes + PYQ + CA.' },
  { id: 'strategy',   label: 'Strategy',   labelHi: 'रणनीति',    icon: <Target className="w-3.5 h-3.5" />,      hint: 'A plan grounded in your weak topics + mastery.' },
  { id: 'revision',   label: 'Revision',   labelHi: 'पुनरावृत्ति', icon: <RefreshCw className="w-3.5 h-3.5" />,   hint: 'Key points + common mistakes for a topic.' },
  { id: 'diagnostic', label: 'Diagnostic', labelHi: 'विश्लेषण',   icon: <Stethoscope className="w-3.5 h-3.5" />, hint: 'Strengths, gaps, and your priority fix.' },
];

export function MentorChatWindow({ showHindi, sessionId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<MentorMode>('explain');
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
      // Route through Orchestrator Agent (Phase-1 C3). The reply shape varies
      // by mode; render a mode-specific string. agent_traces captures provenance.
      const response = await fetch('/api/agents/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content, mode }),
      });

      const data = await response.json();
      if (data.success && data.reply) {
        const r = data.reply;
        let text = '';
        let citations: Message['citations'] = [];
        switch (r.mode) {
          case 'explain':
            text = r.answer ?? '';
            citations = r.citations ?? [];
            break;
          case 'strategy':
            text = `${r.recommendation ?? ''}\n\n${r.rationale ?? ''}${r.nextSteps?.length ? `\n\nNext steps:\n- ${r.nextSteps.join('\n- ')}` : ''}`;
            break;
          case 'revision':
            text = `${r.topic ? `**${r.topic}**\n\n` : ''}${r.keyPoints?.length ? `Key points:\n- ${r.keyPoints.join('\n- ')}` : ''}${r.commonMistakes?.length ? `\n\nCommon mistakes:\n- ${r.commonMistakes.join('\n- ')}` : ''}`;
            break;
          case 'diagnostic':
            text = `${r.assessment ?? ''}${r.priorityFix ? `\n\nPriority fix: ${r.priorityFix}` : ''}`;
            break;
          default:
            text = JSON.stringify(r);
        }
        setMessages(prev => [...prev, { role: 'assistant', content: text, mode: r.mode, citations }]);
      } else {
        setError(data.error || 'Mentor failed to respond');
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

      {/* Mode Selector (C3) — drives which OrchestratorAgent branch fires. */}
      <div className="px-4 pt-3 pb-2 bg-white border-t border-gray-200 flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            title={m.hint}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              mode === m.id
                ? 'bg-saffron-600 border-saffron-600 text-white'
                : 'bg-white border-gray-300 text-gray-700 hover:border-saffron-400 hover:text-saffron-700'
            }`}
          >
            {m.icon}
            {showHindi ? m.labelHi : m.label}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="px-4 pb-4 pt-2 bg-white">
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