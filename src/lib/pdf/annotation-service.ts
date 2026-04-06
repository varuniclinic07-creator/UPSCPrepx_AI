// ═══════════════════════════════════════════════════════════════
// PDF ANNOTATION SERVICE
// Manage highlights, notes, and AI summaries for PDF documents
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';

export interface Annotation {
    id: string;
    userId: string;
    pdfId: string;
    pageNumber: number;
    type: 'highlight' | 'note' | 'drawing';
    content?: string;
    position: any;
    color?: string;
    createdAt: string;
}

/**
 * Save a new annotation
 */
export async function saveAnnotation(
    annotation: Omit<Annotation, 'id' | 'createdAt' | 'userId'>
): Promise<Annotation> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const { data, error } = await (supabase
        .from('pdf_annotations') as any)
        .insert({
            user_id: user.id,
            pdf_id: annotation.pdfId,
            page_number: annotation.pageNumber,
            annotation_type: annotation.type,
            content: annotation.content,
            position: annotation.position,
            color: annotation.color
        })
        .select()
        .single();

    if (error) throw new Error(error.message);

    return {
        id: data.id,
        userId: data.user_id,
        pdfId: data.pdf_id,
        pageNumber: data.page_number,
        type: data.annotation_type as any,
        content: data.content,
        position: data.position,
        color: data.color,
        createdAt: data.created_at
    };
}

/**
 * Get annotations for a PDF
 */
export async function getAnnotations(pdfId: string): Promise<Annotation[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const { data, error } = await (supabase
        .from('pdf_annotations') as any)
        .select('*')
        .eq('pdf_id', pdfId)
        .eq('user_id', user.id)
        .order('page_number', { ascending: true });

    if (error) throw new Error(error.message);

    return (data || []).map((a: any) => ({
        id: a.id,
        userId: a.user_id,
        pdfId: a.pdf_id,
        pageNumber: a.page_number,
        type: a.annotation_type as any,
        content: a.content,
        position: a.position,
        color: a.color,
        createdAt: a.created_at
    }));
}

/**
 * Delete annotation
 */
export async function deleteAnnotation(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await (supabase
        .from('pdf_annotations') as any)
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
}

/**
 * Generate AI Summary for a PDF page or section
 */
/*
export async function generatePDFSummary(text: string): Promise<string> {
    // This would connect to the existing AI text processing service
    // Placeholder for now as direct integration depends on the text extraction method
    return "Summary generation requires text extraction from PDF layer.";
}
*/
