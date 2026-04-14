/**
 * Content Service - User Content Studio (Feature F4)
 *
 * CRUD operations for notes and answers
 * Master Prompt v8.0 - READ Mode
 * TipTap Rich Text Editor, Auto-save, Export
 *
 * AI Provider: 9Router → Groq → Ollama
 */

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Note {
  id: string;
  user_id: string;
  title: { en: string; hi: string };
  content: any; // TipTap JSON
  subject: 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'Essay' | 'Optional' | 'General';
  tags: string[];
  folder_id: string | null;
  word_count: number;
  character_count: number;
  is_template: boolean;
  is_public: boolean;
  is_archived: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  last_saved_at: string;
}

export interface Answer {
  id: string;
  user_id: string;
  question_id: string | null;
  question_text: { en: string; hi: string };
  content: any; // TipTap JSON
  word_count: number;
  time_taken_seconds: number;
  status: 'draft' | 'submitted' | 'evaluated';
  evaluation_id: string | null;
  word_limit: number;
  time_limit_seconds: number;
  created_at: string;
  submitted_at: string | null;
  updated_at: string;
}

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  color: string;
  icon: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const NoteSchema = z.object({
  title: z.object({
    en: z.string().min(1).max(200),
    hi: z.string().max(200).optional().default(''),
  }),
  content: z.object({
    type: z.literal('doc'),
    content: z.array(z.any()).optional(),
  }),
  subject: z.enum(['GS1', 'GS2', 'GS3', 'GS4', 'Essay', 'Optional', 'General']),
  tags: z.array(z.string()).optional().default([]),
  folder_id: z.string().uuid().nullable().optional(),
  is_public: z.boolean().optional().default(false),
  is_pinned: z.boolean().optional().default(false),
});

const AnswerSchema = z.object({
  question_text: z.object({
    en: z.string().min(1),
    hi: z.string().optional().default(''),
  }),
  content: z.object({
    type: z.literal('doc'),
    content: z.array(z.any()).optional(),
  }),
  word_limit: z.number().min(50).max(1000).optional().default(150),
  time_limit_seconds: z.number().min(60).max(3600).optional().default(420),
});

const FolderSchema = z.object({
  name: z.string().min(1).max(100),
  parent_id: z.string().uuid().nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .default('#6B7280'),
  icon: z.string().optional().default('folder'),
  sort_order: z.number().optional().default(0),
});

// ============================================================================
// NOTE OPERATIONS
// ============================================================================

/**
 * Create a new note
 */
export async function createNote(
  userId: string,
  data: z.infer<typeof NoteSchema>
): Promise<Note | null> {
  try {
    const supabase = await createClient();

    // Validate input
    const validated = NoteSchema.parse(data);

    // Calculate word and character count from content
    const { word_count, character_count } = calculateContentStats(validated.content);

    const { data: note, error } = await (supabase.from('user_notes') as any)
      .insert({
        user_id: userId,
        title: validated.title,
        content: validated.content,
        subject: validated.subject,
        tags: validated.tags,
        folder_id: validated.folder_id,
        word_count,
        character_count,
        is_public: validated.is_public,
        is_pinned: validated.is_pinned,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create note:', error);
      return null;
    }

    return note as Note;
  } catch (error) {
    console.error('Error in createNote:', error);
    return null;
  }
}

/**
 * Get a single note by ID
 */
export async function getNote(noteId: string, userId: string): Promise<Note | null> {
  try {
    const supabase = await createClient();

    const { data: note, error } = await supabase
      .from('user_notes')
      .select()
      .eq('id', noteId)
      .eq('user_id', userId)
      .single();

    if (error || !note) {
      return null;
    }

    return note as unknown as Note;
  } catch (error) {
    console.error('Error in getNote:', error);
    return null;
  }
}

/**
 * Get all notes for a user with filters
 */
export async function getNotes(
  userId: string,
  options?: {
    subject?: string;
    folder_id?: string;
    tags?: string[];
    is_archived?: boolean;
    is_pinned?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
    sort_by?: 'updated_at' | 'created_at' | 'title';
    sort_order?: 'asc' | 'desc';
  }
): Promise<{ notes: Note[]; total: number }> {
  try {
    const supabase = await createClient();

    let query = supabase.from('user_notes').select('*', { count: 'exact' }).eq('user_id', userId);

    // Apply filters
    if (options?.subject) {
      query = query.eq('subject', options.subject);
    }

    if (options?.folder_id) {
      query = query.eq('folder_id', options.folder_id);
    }

    if (options?.tags && options.tags.length > 0) {
      query = query.contains('tags', options.tags);
    }

    if (options?.is_archived !== undefined) {
      query = query.eq('is_archived', options.is_archived);
    }

    if (options?.is_pinned !== undefined) {
      query = query.eq('is_pinned', options.is_pinned);
    }

    if (options?.search) {
      query = query.textSearch('title', options.search, {
        config: 'english',
        type: 'websearch',
      });
    }

    // Apply sorting
    const sortBy = options?.sort_by || 'updated_at';
    const sortOrder = options?.sort_order || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data: notes, error } = await query;

    if (error) {
      console.error('Failed to get notes:', error);
      return { notes: [], total: 0 };
    }

    return {
      notes: notes as unknown as Note[],
      total: notes?.length || 0,
    };
  } catch (error) {
    console.error('Error in getNotes:', error);
    return { notes: [], total: 0 };
  }
}

/**
 * Update a note
 */
export async function updateNote(
  noteId: string,
  userId: string,
  data: Partial<z.infer<typeof NoteSchema>> & {
    title?: { en: string; hi: string };
    content?: any;
  }
): Promise<Note | null> {
  try {
    const supabase = await createClient();

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
      last_saved_at: new Date().toISOString(),
    };

    if (data.title) updateData.title = data.title;
    if (data.content) {
      updateData.content = data.content;
      const { word_count, character_count } = calculateContentStats(data.content);
      updateData.word_count = word_count;
      updateData.character_count = character_count;
    }
    if (data.subject) updateData.subject = data.subject;
    if (data.tags) updateData.tags = data.tags;
    if (data.folder_id !== undefined) updateData.folder_id = data.folder_id;
    if (data.is_public !== undefined) updateData.is_public = data.is_public;
    if (data.is_pinned !== undefined) updateData.is_pinned = data.is_pinned;

    const { data: note, error } = await (supabase.from('user_notes') as any)
      .update(updateData)
      .eq('id', noteId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update note:', error);
      return null;
    }

    return note as Note;
  } catch (error) {
    console.error('Error in updateNote:', error);
    return null;
  }
}

/**
 * Delete a note
 */
export async function deleteNote(noteId: string, userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('user_notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to delete note:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteNote:', error);
    return false;
  }
}

/**
 * Auto-save a note (creates version)
 */
export async function autoSaveNote(noteId: string, userId: string, content: any): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Update the note
    const { word_count, character_count } = calculateContentStats(content);

    const { error: updateError } = await (supabase.from('user_notes') as any)
      .update({
        content,
        word_count,
        character_count,
        last_saved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', noteId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Failed to auto-save note:', updateError);
      return false;
    }

    // Create a version entry (limited to last 10 versions)
    await (supabase.from('note_versions') as any).insert({
      note_id: noteId,
      user_id: userId,
      content,
      word_count,
      save_type: 'auto',
    });

    // Clean up old versions (keep last 10)
    await (supabase as any).rpc('delete_old_note_versions', {
      p_note_id: noteId,
      p_keep_count: 10,
    });

    return true;
  } catch (error) {
    console.error('Error in autoSaveNote:', error);
    return false;
  }
}

/**
 * Pin/unpin a note
 */
export async function toggleNotePin(noteId: string, userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Get current pin status
    const { data: note } = await supabase
      .from('user_notes')
      .select('is_pinned')
      .eq('id', noteId)
      .eq('user_id', userId)
      .single();

    if (!note) return false;

    const { error } = await (supabase.from('user_notes') as any)
      .update({
        is_pinned: !(note as any).is_pinned,
        updated_at: new Date().toISOString(),
      })
      .eq('id', noteId)
      .eq('user_id', userId);

    return !error;
  } catch (error) {
    console.error('Error in toggleNotePin:', error);
    return false;
  }
}

/**
 * Archive/unarchive a note
 */
export async function toggleNoteArchive(noteId: string, userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { error } = await (supabase.from('user_notes') as any)
      .update({
        is_archived: true,
        is_pinned: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', noteId)
      .eq('user_id', userId);

    return !error;
  } catch (error) {
    console.error('Error in toggleNoteArchive:', error);
    return false;
  }
}

// ============================================================================
// ANSWER OPERATIONS
// ============================================================================

/**
 * Create a new answer
 */
export async function createAnswer(
  userId: string,
  data: z.infer<typeof AnswerSchema> & {
    question_id?: string;
  }
): Promise<Answer | null> {
  try {
    const supabase = await createClient();

    const validated = AnswerSchema.parse(data);
    const { word_count } = calculateContentStats(validated.content);

    const { data: answer, error } = await (supabase.from('user_answers') as any)
      .insert({
        user_id: userId,
        question_id: data.question_id || null,
        question_text: validated.question_text,
        content: validated.content,
        word_count,
        word_limit: validated.word_limit,
        time_limit_seconds: validated.time_limit_seconds,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create answer:', error);
      return null;
    }

    return answer as Answer;
  } catch (error) {
    console.error('Error in createAnswer:', error);
    return null;
  }
}

/**
 * Get a single answer by ID
 */
export async function getAnswer(answerId: string, userId: string): Promise<Answer | null> {
  try {
    const supabase = await createClient();

    const { data: answer, error } = await supabase
      .from('user_answers')
      .select()
      .eq('id', answerId)
      .eq('user_id', userId)
      .single();

    if (error || !answer) {
      return null;
    }

    return answer as Answer;
  } catch (error) {
    console.error('Error in getAnswer:', error);
    return null;
  }
}

/**
 * Get all answers for a user with filters
 */
export async function getAnswers(
  userId: string,
  options?: {
    status?: 'draft' | 'submitted' | 'evaluated';
    question_id?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ answers: Answer[]; total: number }> {
  try {
    const supabase = await createClient();

    let query = supabase.from('user_answers').select('*', { count: 'exact' }).eq('user_id', userId);

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.question_id) {
      query = query.eq('question_id', options.question_id);
    }

    query = query.order('submitted_at', { ascending: false, nullsFirst: false });

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data: answers, error } = await query;

    if (error) {
      console.error('Failed to get answers:', error);
      return { answers: [], total: 0 };
    }

    return {
      answers: answers as Answer[],
      total: answers?.length || 0,
    };
  } catch (error) {
    console.error('Error in getAnswers:', error);
    return { answers: [], total: 0 };
  }
}

/**
 * Update an answer
 */
export async function updateAnswer(
  answerId: string,
  userId: string,
  data: {
    content?: any;
    word_count?: number;
    time_taken_seconds?: number;
  }
): Promise<Answer | null> {
  try {
    const supabase = await createClient();

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.content) {
      updateData.content = data.content;
      const { word_count } = calculateContentStats(data.content);
      updateData.word_count = word_count;
    }

    if (data.word_count) updateData.word_count = data.word_count;
    if (data.time_taken_seconds !== undefined) {
      updateData.time_taken_seconds = data.time_taken_seconds;
    }

    const { data: answer, error } = await (supabase.from('user_answers') as any)
      .update(updateData)
      .eq('id', answerId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update answer:', error);
      return null;
    }

    return answer as Answer;
  } catch (error) {
    console.error('Error in updateAnswer:', error);
    return null;
  }
}

/**
 * Submit an answer for evaluation
 */
export async function submitAnswer(answerId: string, userId: string): Promise<Answer | null> {
  try {
    const supabase = await createClient();

    const { data: answer, error } = await (supabase.from('user_answers') as any)
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', answerId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Failed to submit answer:', error);
      return null;
    }

    return answer as Answer;
  } catch (error) {
    console.error('Error in submitAnswer:', error);
    return null;
  }
}

/**
 * Delete an answer
 */
export async function deleteAnswer(answerId: string, userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('user_answers')
      .delete()
      .eq('id', answerId)
      .eq('user_id', userId);

    return !error;
  } catch (error) {
    console.error('Error in deleteAnswer:', error);
    return false;
  }
}

// ============================================================================
// FOLDER OPERATIONS
// ============================================================================

/**
 * Create a new folder
 */
export async function createFolder(
  userId: string,
  data: z.infer<typeof FolderSchema>
): Promise<Folder | null> {
  try {
    const supabase = await createClient();

    const validated = FolderSchema.parse(data);

    const { data: folder, error } = await (supabase.from('note_folders') as any)
      .insert({
        user_id: userId,
        name: validated.name,
        parent_id: validated.parent_id,
        color: validated.color,
        icon: validated.icon,
        sort_order: validated.sort_order,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create folder:', error);
      return null;
    }

    return folder as Folder;
  } catch (error) {
    console.error('Error in createFolder:', error);
    return null;
  }
}

/**
 * Get all folders for a user
 */
export async function getFolders(userId: string): Promise<Folder[]> {
  try {
    const supabase = await createClient();

    const { data: folders, error } = await supabase
      .from('note_folders')
      .select()
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Failed to get folders:', error);
      return [];
    }

    return folders as Folder[];
  } catch (error) {
    console.error('Error in getFolders:', error);
    return [];
  }
}

/**
 * Update a folder
 */
export async function updateFolder(
  folderId: string,
  userId: string,
  data: Partial<z.infer<typeof FolderSchema>>
): Promise<Folder | null> {
  try {
    const supabase = await createClient();

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.name) updateData.name = data.name;
    if (data.parent_id !== undefined) updateData.parent_id = data.parent_id;
    if (data.color) updateData.color = data.color;
    if (data.icon) updateData.icon = data.icon;
    if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;

    const { data: folder, error } = await (supabase.from('note_folders') as any)
      .update(updateData)
      .eq('id', folderId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update folder:', error);
      return null;
    }

    return folder as Folder;
  } catch (error) {
    console.error('Error in updateFolder:', error);
    return null;
  }
}

/**
 * Delete a folder
 */
export async function deleteFolder(folderId: string, userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    // First, move all notes in this folder to null
    await (supabase.from('user_notes') as any)
      .update({ folder_id: null })
      .eq('folder_id', folderId)
      .eq('user_id', userId);

    const { error } = await supabase
      .from('note_folders')
      .delete()
      .eq('id', folderId)
      .eq('user_id', userId);

    return !error;
  } catch (error) {
    console.error('Error in deleteFolder:', error);
    return false;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate word and character count from TipTap JSON content
 */
export function calculateContentStats(content: any): {
  word_count: number;
  character_count: number;
} {
  if (!content || !content.content) {
    return { word_count: 0, character_count: 0 };
  }

  let text = '';

  function extractText(node: any) {
    if (node.type === 'text') {
      text += node.text || '';
    }
    if (node.content) {
      node.content.forEach((child: any) => extractText(child));
    }
  }

  content.content.forEach((node: any) => extractText(node));

  const word_count = text.trim() ? text.trim().split(/\s+/).length : 0;
  const character_count = text.length;

  return { word_count, character_count };
}

/**
 * Estimate read time in minutes (200 words per minute)
 */
export function estimateReadTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 200));
}

/**
 * Estimate write time in minutes (30 words per minute for typing)
 */
export function estimateWriteTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 30));
}
