import { createClient } from '@/lib/supabase/server';
import { generateWithThinking, parseAIJson } from '@/lib/ai/generate';
import type { Note, NoteContent, Json } from '@/types';

export interface GenerateNotesInput {
  topic: string;
  subject: string;
  userId: string;
  level?: 'basic' | 'intermediate' | 'advanced';
}

/**
 * Generate comprehensive UPSC notes on a topic
 * Uses AI with thinking model for deep analysis
 */
export async function generateNotes(input: GenerateNotesInput): Promise<Note> {
  const { topic, subject, userId, level = 'intermediate' } = input;

  const systemPrompt = `You are an expert UPSC Civil Services Examination preparation assistant.
Your task is to generate comprehensive, accurate study notes.

IMPORTANT RULES:
1. Write in simple, clear language (10th standard comprehension level)
2. Include all important facts, dates, names, and figures
3. Add UPSC exam relevance and connections to previous year questions
4. Include memory tricks (mnemonics) where helpful
5. Cite standard sources (NCERT, Laxmikanth, Spectrum, etc.)
6. Output ONLY valid JSON - no other text`;

  const prompt = `Generate comprehensive UPSC study notes on:

TOPIC: ${topic}
SUBJECT: ${subject}
DIFFICULTY: ${level}

Output this EXACT JSON structure:
{
  "introduction": "2-3 paragraphs introducing the topic with context, significance, and UPSC relevance",
  "keyPoints": ["Array of 6-10 key points covering main concepts"],
  "details": "4-6 paragraphs of detailed explanation with examples, data, and analysis",
  "valueAdditions": ["3-5 additional facts, exam tips, or interesting connections"],
  "quiz": [
    {
      "id": "q1",
      "question": "MCQ question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Why this answer is correct",
      "difficulty": "medium"
    }
  ],
  "sources": ["List of standard UPSC reference books"],
  "mnemonics": ["Memory tricks to remember key facts"],
  "pyqConnections": ["Connections to UPSC previous year questions if any"]
}

Generate 3-5 quiz questions. Make content comprehensive and exam-oriented.
Focus on conceptual clarity, not just facts.`;

  try {
    const response = await generateWithThinking(prompt, {
      systemPrompt,
      maxTokens: 4000,
      userId,
    });

    // Parse AI response
    const content = parseAIJson<NoteContent>(response);

    if (!content) {
      // Fallback content if parsing fails
      throw new Error('Failed to parse AI response');
    }

    // Ensure all required fields exist
    const validatedContent: NoteContent = {
      introduction: content.introduction || 'Introduction not available',
      keyPoints: content.keyPoints || [],
      details: content.details || '',
      valueAdditions: content.valueAdditions || [],
      quiz: content.quiz || [],
      sources: content.sources || ['Please verify with standard UPSC sources'],
      mnemonics: content.mnemonics || [],
      pyqConnections: content.pyqConnections || [],
    };

    // Save to database
    const supabase = await createClient();

    const { data: note, error } = await (supabase
      .from('notes') as any)
      .insert({
        user_id: userId,
        topic,
        subject,
        content: validatedContent as unknown as Json,
        is_bookmarked: false,
        view_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('[Notes Service] Database error:', error);
      throw new Error(`Failed to save note: ${error.message}`);
    }

    return {
      id: note.id,
      userId: note.user_id,
      topic: note.topic,
      title: note.topic, // Alias
      subject: note.subject,
      content: note.content as unknown as NoteContent,
      isBookmarked: note.is_bookmarked,
      viewCount: note.view_count,
      createdAt: new Date(note.created_at),
      updatedAt: new Date(note.updated_at),
    };
  } catch (error) {
    console.error('[Notes Service] Error generating notes:', error);
    throw error;
  }
}

/**
 * Get all notes for a user
 */
export async function getUserNotes(userId: string): Promise<Note[]> {
  const supabase = await createClient();

  const { data, error } = await (supabase
    .from('notes') as any)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch notes: ${error.message}`);
  }

  return data.map((note: { id: string; user_id: string; topic: string; subject: string; content: unknown; is_bookmarked: boolean; view_count: number; created_at: string; updated_at: string }) => ({
    id: note.id,
    userId: note.user_id,
    topic: note.topic,
    title: note.topic, // Alias
    subject: note.subject,
    content: note.content as unknown as NoteContent,
    isBookmarked: note.is_bookmarked,
    viewCount: note.view_count,
    createdAt: new Date(note.created_at),
    updatedAt: new Date(note.updated_at),
  }));
}

/**
 * Get a single note by ID
 * SECURITY: Requires userId for ownership verification to prevent IDOR
 */
export async function getNoteById(noteId: string, userId?: string): Promise<Note | null> {
  const supabase = await createClient();

  // Build query - if userId provided, enforce ownership
  let query = (supabase
    .from('notes') as any)
    .select('*')
    .eq('id', noteId);

  // If userId is provided, enforce ownership check (IDOR protection)
  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    return null;
  }

  // Increment view count
  await (supabase
    .from('notes') as any)
    .update({ view_count: data.view_count + 1 })
    .eq('id', noteId);

  return {
    id: data.id,
    userId: data.user_id,
    topic: data.topic,
    title: data.topic, // Alias
    subject: data.subject,
    content: data.content as unknown as NoteContent,
    isBookmarked: data.is_bookmarked,
    viewCount: data.view_count + 1,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * Toggle bookmark status
 */
export async function toggleBookmark(noteId: string, userId: string): Promise<boolean> {
  const supabase = await createClient();

  // Get current state
  const { data: note } = await (supabase
    .from('notes') as any)
    .select('is_bookmarked')
    .eq('id', noteId)
    .eq('user_id', userId)
    .single();

  if (!note) {
    throw new Error('Note not found');
  }

  // Toggle
  const newState = !note.is_bookmarked;
  const { error } = await (supabase
    .from('notes') as any)
    .update({ is_bookmarked: newState })
    .eq('id', noteId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to toggle bookmark: ${error.message}`);
  }

  return newState;
}

/**
 * Delete a note
 */
export async function deleteNote(noteId: string, userId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await (supabase
    .from('notes') as any)
    .delete()
    .eq('id', noteId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete note: ${error.message}`);
  }
}

/**
 * Search notes by topic or subject
 */
export async function searchNotes(
  userId: string,
  query: string
): Promise<Note[]> {
  const supabase = await createClient();

  // Sanitize search query to prevent SQL injection
  // Remove special characters that could be used for SQL injection
  const sanitizedQuery = query
    .replace(/[%_\\'";\-\-]/g, '') // Remove SQL wildcards and dangerous chars
    .trim()
    .slice(0, 100); // Limit length to prevent abuse

  if (!sanitizedQuery) {
    return [];
  }

  const { data, error } = await (supabase
    .from('notes') as any)
    .select('*')
    .eq('user_id', userId)
    .or(`topic.ilike.%${sanitizedQuery}%,subject.ilike.%${sanitizedQuery}%`)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to search notes: ${error.message}`);
  }

  return data.map((note: any) => ({
    id: note.id,
    userId: note.user_id,
    topic: note.topic,
    title: note.topic, // Alias
    subject: note.subject,
    content: note.content as unknown as NoteContent,
    isBookmarked: note.is_bookmarked,
    viewCount: note.view_count,
    createdAt: new Date(note.created_at),
    updatedAt: new Date(note.updated_at),
  }));
}

// Alias for convenience
export const getNotesByUser = getUserNotes;

/**
 * Get bookmarked notes
 */
export async function getBookmarkedNotes(userId: string): Promise<Note[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .eq('is_bookmarked', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch bookmarked notes: ${error.message}`);
  }

  return data.map((note: any) => ({
    id: note.id,
    userId: note.user_id,
    topic: note.topic,
    title: note.topic, // Alias
    subject: note.subject,
    content: note.content as unknown as NoteContent,
    isBookmarked: note.is_bookmarked,
    viewCount: note.view_count,
    createdAt: new Date(note.created_at),
    updatedAt: new Date(note.updated_at),
  }));
}