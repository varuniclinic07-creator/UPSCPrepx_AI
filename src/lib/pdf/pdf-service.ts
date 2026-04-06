/**
 * PDF Service
 * 
 * Master Prompt v8.0 - Feature F12 (READ Mode)
 * - Document management
 * - Annotation handling
 * - Progress tracking
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface PdfDocument {
  id?: string;
  title: string;
  storage_path: string;
  total_pages?: number;
  file_size_bytes?: number;
}

export interface PdfAnnotation {
  id?: string;
  document_id: string;
  page_index: number;
  type: 'highlight' | 'underline' | 'note' | 'drawing' | 'strikeout';
  color?: string;
  text_content?: string;
  note_content?: string;
  position?: { x: number; y: number; width: number; height: number };
}

export async function uploadDocument(userId: string, title: string, filePath: string, totalPages: number) {
  // In production, this would move file from temp storage to permanent bucket
  // For now, we simulate document creation
  const doc: PdfDocument = { title, storage_path: filePath, total_pages: totalPages };
  
  const { data, error } = await supabase
    .from('pdf_documents')
    .insert([{ ...doc, user_id: userId }])
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function getAnnotations(documentId: string) {
  const { data, error } = await supabase
    .from('pdf_annotations')
    .select('*')
    .eq('document_id', documentId)
    .order('page_index', { ascending: true })
    .order('created_at', { ascending: true });
    
  if (error) throw error;
  return data;
}

export async function saveAnnotation(userId: string, annotation: PdfAnnotation) {
  const { data, error } = await supabase
    .from('pdf_annotations')
    .insert([{ ...annotation, user_id: userId }])
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function updateProgress(userId: string, documentId: string, progress: { last_page: number; percentage: number }) {
  await supabase.from('pdf_progress').upsert({
    user_id: userId,
    document_id: documentId,
    last_page: progress.last_page,
    percentage_completed: progress.percentage,
    last_read_at: new Date().toISOString()
  });
}

export const pdfService = { uploadDocument, getAnnotations, saveAnnotation, updateProgress };
