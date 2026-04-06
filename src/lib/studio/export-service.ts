/**
 * Export Service - User Content Studio (Feature F4)
 * 
 * PDF, Word, Markdown export functionality
 * Master Prompt v8.0 - READ Mode
 * TipTap Rich Text Editor
 * 
 * AI Provider: 9Router → Groq → Ollama
 */

import { createClient } from '@/lib/supabase/server';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';

// ============================================================================
// TYPES
// ============================================================================

export interface ExportResult {
  success: boolean;
  exportId?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
}

export interface ExportOptions {
  format: 'pdf' | 'docx' | 'md';
  includeMetadata?: boolean;
  includeTimestamp?: boolean;
  pageSize?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
}

// ============================================================================
// TIP TAP EXTENSIONS
// ============================================================================

const TIP_TAP_EXTENSIONS = [
  StarterKit.configure({
    bulletList: { keepMarks: true },
    orderedList: { keepMarks: true },
  }),
  Underline,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Table.configure({ resizable: true }),
  TableRow,
  TableHeader,
  TableCell,
  Image,
  Highlight,
  TaskList,
  TaskItem,
];

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Export a note to PDF
 * Uses pdfmake for PDF generation
 */
export async function exportToPDF(
  noteId: string,
  userId: string,
  options?: ExportOptions
): Promise<ExportResult> {
  try {
    const supabase = createClient();

    // Get the note
    const { data: note } = await supabase
      .from('user_notes')
      .select()
      .eq('id', noteId)
      .eq('user_id', userId)
      .single();

    if (!note) {
      return { success: false, error: 'Note not found' };
    }

    // Convert TipTap JSON to HTML
    const html = generateHTML(note.content, TIP_TAP_EXTENSIONS);

    // Convert HTML to pdfmake document definition
    const docDefinition = convertHTMLToPDFDefinition(
      note.title.en || 'Untitled',
      html,
      options
    );

    // In production, use pdfmake server-side or cloud function
    // For now, create a record and return URL for client-side generation
    const fileName = `${sanitizeFileName(note.title.en)}.pdf`;

    const { data: exportRecord, error } = await supabase
      .from('note_exports')
      .insert({
        user_id: userId,
        note_id: noteId,
        format: 'pdf',
        file_name: fileName,
        status: 'completed',
        file_url: `/api/studio/export/${noteId}/pdf`,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create export record:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      exportId: exportRecord.id,
      fileUrl: exportRecord.file_url,
      fileName,
    };
  } catch (error) {
    console.error('Error in exportToPDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Export a note to Word (.docx)
 * Uses docx library for Word generation
 */
export async function exportToWord(
  noteId: string,
  userId: string,
  options?: ExportOptions
): Promise<ExportResult> {
  try {
    const supabase = createClient();

    // Get the note
    const { data: note } = await supabase
      .from('user_notes')
      .select()
      .eq('id', noteId)
      .eq('user_id', userId)
      .single();

    if (!note) {
      return { success: false, error: 'Note not found' };
    }

    // Convert TipTap JSON to HTML
    const html = generateHTML(note.content, TIP_TAP_EXTENSIONS);

    // In production, use docx server-side
    // For now, create a record and return URL for client-side generation
    const fileName = `${sanitizeFileName(note.title.en)}.docx`;

    const { data: exportRecord, error } = await supabase
      .from('note_exports')
      .insert({
        user_id: userId,
        note_id: noteId,
        format: 'docx',
        file_name: fileName,
        status: 'completed',
        file_url: `/api/studio/export/${noteId}/docx`,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create export record:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      exportId: exportRecord.id,
      fileUrl: exportRecord.file_url,
      fileName,
    };
  } catch (error) {
    console.error('Error in exportToWord:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Export a note to Markdown
 * Uses turndown for HTML to Markdown conversion
 */
export async function exportToMarkdown(
  noteId: string,
  userId: string,
  options?: ExportOptions
): Promise<ExportResult> {
  try {
    const supabase = createClient();

    // Get the note
    const { data: note } = await supabase
      .from('user_notes')
      .select()
      .eq('id', noteId)
      .eq('user_id', userId)
      .single();

    if (!note) {
      return { success: false, error: 'Note not found' };
    }

    // Convert TipTap JSON to HTML
    const html = generateHTML(note.content, TIP_TAP_EXTENSIONS);

    // Convert HTML to Markdown (client-side with turndown)
    // For server-side, use turndown Node.js package
    const markdown = htmlToMarkdown(html);

    // Add metadata if requested
    let content = markdown;
    if (options?.includeMetadata) {
      content = `---
title: ${note.title.en}
subject: ${note.subject}
tags: ${note.tags.join(', ')}
word_count: ${note.word_count}
created: ${new Date(note.created_at).toLocaleDateString()}
---

${markdown}`;
    }

    const fileName = `${sanitizeFileName(note.title.en)}.md`;

    // Store in Supabase Storage
    const { data: storageData, error: uploadError } = await supabase.storage
      .from('note-exports')
      .upload(`${userId}/${fileName}`, content, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Failed to upload to storage:', uploadError);
      // Fallback: create record without file storage
      const { data: exportRecord } = await supabase
        .from('note_exports')
        .insert({
          user_id: userId,
          note_id: noteId,
          format: 'md',
          file_name: fileName,
          status: 'completed',
          file_url: `data:text/markdown;base64,${Buffer.from(content).toString('base64')}`,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      return {
        success: true,
        exportId: exportRecord?.id,
        fileUrl: exportRecord?.file_url,
        fileName,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('note-exports')
      .getPublicUrl(`${userId}/${fileName}`);

    const { data: exportRecord, error } = await supabase
      .from('note_exports')
      .insert({
        user_id: userId,
        note_id: noteId,
        format: 'md',
        file_name: fileName,
        file_url: urlData.publicUrl,
        file_size_bytes: content.length,
        status: 'completed',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create export record:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      exportId: exportRecord.id,
      fileUrl: urlData.publicUrl,
      fileName,
      fileSize: content.length,
    };
  } catch (error) {
    console.error('Error in exportToMarkdown:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Main export function - routes to specific format
 */
export async function exportNote(
  noteId: string,
  userId: string,
  format: 'pdf' | 'docx' | 'md',
  options?: ExportOptions
): Promise<ExportResult> {
  switch (format) {
    case 'pdf':
      return exportToPDF(noteId, userId, options);
    case 'docx':
      return exportToWord(noteId, userId, options);
    case 'md':
      return exportToMarkdown(noteId, userId, options);
    default:
      return { success: false, error: 'Invalid format' };
  }
}

/**
 * Batch export multiple notes
 */
export async function batchExportNotes(
  noteIds: string[],
  userId: string,
  format: 'pdf' | 'docx' | 'md',
  options?: ExportOptions
): Promise<{ results: ExportResult[]; successCount: number }> {
  const results: ExportResult[] = [];
  let successCount = 0;

  for (const noteId of noteIds) {
    const result = await exportNote(noteId, userId, format, options);
    results.push(result);
    if (result.success) successCount++;
  }

  return { results, successCount };
}

/**
 * Get export history for a user
 */
export async function getExportHistory(
  userId: string,
  limit: number = 20
): Promise<any[]> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('note_exports')
      .select(`
        *,
        user_notes (
          title,
          subject
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get export history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getExportHistory:', error);
    return [];
  }
}

/**
 * Download an exported file
 */
export async function downloadExport(
  exportId: string,
  userId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = createClient();

    // Get export record
    const { data: exportRecord, error } = await supabase
      .from('note_exports')
      .select()
      .eq('id', exportId)
      .eq('user_id', userId)
      .single();

    if (error || !exportRecord) {
      return { success: false, error: 'Export not found' };
    }

    // Check if expired
    if (new Date(exportRecord.expires_at) < new Date()) {
      return { success: false, error: 'Export has expired' };
    }

    // Update download count
    await supabase
      .from('note_exports')
      .update({
        download_count: (exportRecord.download_count || 0) + 1,
        downloaded_at: new Date().toISOString(),
      })
      .eq('id', exportId);

    return {
      success: true,
      data: exportRecord,
    };
  } catch (error) {
    console.error('Error in downloadExport:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert HTML to pdfmake document definition
 */
function convertHTMLToPDFDefinition(
  title: string,
  html: string,
  options?: ExportOptions
): any {
  // Simplified conversion - in production use html-to-pdfmake
  return {
    content: [
      {
        text: title,
        style: 'header',
      },
      {
        html: html,
      },
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10],
      },
    },
    pageSize: options?.pageSize || 'a4',
    pageOrientation: options?.orientation || 'portrait',
  };
}

/**
 * Convert HTML to Markdown
 * Simplified version - in production use turndown package
 */
function htmlToMarkdown(html: string): string {
  let markdown = html;

  // Basic conversions
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
  markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, p1) => {
    return p1.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  });
  markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, p1) => {
    let index = 1;
    return p1.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${index++}. $1\n`);
  });
  markdown = markdown.replace(/<a[^>]*href="(.*?)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
  markdown = markdown.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```');
  markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, '> $1');
  markdown = markdown.replace(/<img[^>]*src="(.*?)"[^>]*alt="(.*?)"[^>]*>/gi, '![$2]($1)');
  markdown = markdown.replace(/<hr[^>]*>/gi, '---\n');
  markdown = markdown.replace(/<br[^>]*>/gi, '\n');
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
  markdown = markdown.replace(/<[^>]+>/g, ''); // Remove remaining tags

  // Decode HTML entities
  markdown = markdown
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  return markdown.trim();
}

/**
 * Sanitize filename for safe download
 */
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9\u0900-\u097F\-_\s]/g, '') // Allow Hindi characters
    .replace(/\s+/g, '-')
    .substring(0, 100);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
