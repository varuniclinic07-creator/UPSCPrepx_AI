/**
 * Mentor Chat Service
 * 
 * Master Prompt v8.0 - Feature F10 (READ Mode)
 * - Chat with contextual user data
 * - 9Router -> Groq -> Ollama fallback
 * - Bilingual support
 * - History saving
 */

import { createClient } from '@supabase/supabase-js';
import { generateAIResponse } from '../ai/ai-provider';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface MentorMessage {
  id?: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export interface UserContext {
  userId: string;
  coverage?: number;
  weakSubjects?: string[];
  accuracy?: number;
  streak?: number;
  examDate?: string;
}

export class MentorChatService {
  async sendMessage(userId: string, sessionId: string, content: string, context?: UserContext) {
    const timestamp = new Date().toISOString();
    
    // Save user message
    await supabase.from('mentor_messages').insert({
      session_id: sessionId,
      role: 'user',
      content,
      context_snapshot: context || {},
    });

    // Build context prompt
    let contextText = '';
    if (context) {yllabus Coverage: ${context.coverage}%}
${context.weakSubjects?.length ? '- Weakest subjects: ' + context.weakSubjects.join(', ') : ''}yllabus Coverage: ${context.coverage}%}
${context.weakSubjects?.length ? '- Weakest subjects: ' + context.weakSubjects.join(', ') : ''}- MCQ Accuracy: ${context.accuracy}%
- Study Streak: ${context.streak} days
- Exam Date: ${context.examDate || 'Not set'}
`;
    }

    const prompt = `
You are an expert UPSC mentor with 15+ years experience.

USER CONTEXT:
${contextText || 'No specific data available yet.'}

USER MESSAGE: ${content}

RULES:
1. Use SIMPLIFIED language (10th grade level)
2. Be empathetic but direct
3. Reference data if available
4. Give actionable next steps
5. Keep responses concise

RESPONSE:`;

    const reply = await generateAIResponse({
      prompt,
      provider: '9router',
      maxTokens: 1500,
    });

    // Save assistant message
    const { data: msgData } = await supabase
      .from('mentor_messages')
      .insert({ session_id: sessionId, role: 'assistant', content: reply })
      .select()
      .single();

    return { reply, message: msgData };
  }

  async getMessages(sessionId: string): Promise<MentorMessage[]> {
    const { data } = await supabase
      .from('mentor_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    return data || [];
  }

  async getSessions(userId: string) {
    const { data } = await supabase
      .from('mentor_sessions')
      .select(`*, messages:mentor_messages(count)`) // Note: complex count might need view
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    return data || [];
  }

  async createSession(userId: string, title: string, topic: string) {
    const { data } = await supabase
      .from('mentor_sessions')
      .insert({ user_id: userId, title, topic })
      .select()
      .single();
    return data;
  }
}

export const mentorChat = new MentorChatService();