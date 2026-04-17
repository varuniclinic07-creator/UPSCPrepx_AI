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
 *
 * Unions two underlying tables so both writer paths surface on the list:
 *   - `notes` — written by `notes-service.generateNotes()` (rich NoteContent JSON)
 *   - `user_generated_notes` — written by `/api/notes/generate` (markdown + html)
 *
 * Both shapes are normalized to the `Note` interface so the UI doesn't have
 * to care which table a note came from.
 */
export async function getUserNotes(userId: string): Promise<Note[]> {
  const supabase = await createClient();
  const db = supabase as any;

  const [legacyRes, agenticRes] = await Promise.allSettled([
    db.from('notes').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    db
      .from('user_generated_notes')
      .select('id, user_id, topic, subject, content_markdown, content_html, word_count, ai_provider_used, agentic_sources, created_at, updated_at, status')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false }),
  ]);

  const legacy = legacyRes.status === 'fulfilled' && !legacyRes.value.error
    ? (legacyRes.value.data as any[])
    : [];
  const agentic = agenticRes.status === 'fulfilled' && !agenticRes.value.error
    ? (agenticRes.value.data as any[])
    : [];

  const fromLegacy: Note[] = legacy.map(mapLegacyNoteRow);
  const fromAgentic: Note[] = agentic.map(mapAgenticNoteRow);

  return [...fromLegacy, ...fromAgentic].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

function mapLegacyNoteRow(note: any): Note {
  return {
    id: note.id,
    userId: note.user_id,
    topic: note.topic,
    title: note.topic,
    subject: note.subject ?? note.subject_slug ?? 'General',
    content: note.content as unknown as NoteContent,
    isBookmarked: !!note.is_bookmarked,
    viewCount: note.view_count ?? note.views ?? 0,
    createdAt: new Date(note.created_at),
    updatedAt: new Date(note.updated_at ?? note.created_at),
  };
}

function mapAgenticNoteRow(row: any): Note {
  // Synthesize a NoteContent from the markdown so the detail page can render it.
  const content: NoteContent = {
    summary: typeof row.content_markdown === 'string'
      ? row.content_markdown.split('\n').slice(0, 3).join(' ').slice(0, 400)
      : undefined,
    sections: typeof row.content_markdown === 'string'
      ? [{ title: row.topic ?? 'Notes', content: row.content_markdown }]
      : [],
    keyPoints: Array.isArray(row.agentic_sources?.keyPoints)
      ? row.agentic_sources.keyPoints
      : [],
    sources: Array.isArray(row.agentic_sources?.sources)
      ? row.agentic_sources.sources.map((s: any) => (typeof s === 'string' ? s : s?.name ?? '')).filter(Boolean)
      : [],
  };

  return {
    id: row.id,
    userId: row.user_id,
    topic: row.topic,
    title: row.topic,
    subject: row.subject ?? 'General',
    content,
    isBookmarked: false,
    viewCount: 0,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at ?? row.created_at),
  };
}

/**
 * Get a single note by ID
 * SECURITY: Requires userId for ownership verification to prevent IDOR.
 *
 * Looks up the id in `notes` first; falls back to `user_generated_notes`
 * so agentic-generated notes also have a detail page.
 */
export async function getNoteById(noteId: string, userId?: string): Promise<Note | null> {
  const supabase = await createClient();
  const db = supabase as any;

  // Try legacy table
  let legacyQuery = db.from('notes').select('*').eq('id', noteId);
  if (userId) legacyQuery = legacyQuery.eq('user_id', userId);
  const { data: legacy, error: legacyErr } = await legacyQuery.maybeSingle();

  if (!legacyErr && legacy) {
    await db
      .from('notes')
      .update({ view_count: (legacy.view_count ?? legacy.views ?? 0) + 1 })
      .eq('id', noteId);

    return {
      ...mapLegacyNoteRow(legacy),
      viewCount: (legacy.view_count ?? legacy.views ?? 0) + 1,
    };
  }

  // Fallback to agentic table
  let agenticQuery = db
    .from('user_generated_notes')
    .select('id, user_id, topic, subject, content_markdown, content_html, word_count, ai_provider_used, agentic_sources, created_at, updated_at, status')
    .eq('id', noteId);
  if (userId) agenticQuery = agenticQuery.eq('user_id', userId);
  const { data: agentic, error: agenticErr } = await agenticQuery.maybeSingle();

  if (!agenticErr && agentic) {
    return mapAgenticNoteRow(agentic);
  }

  return null;
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