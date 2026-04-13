/**
 * Intelligent File Upload — /api/upload/intelligent
 *
 * Accepts any file up to 100MB (PDF, images, DOCX, PPT, TXT).
 * Extracts text, normalizes to KG nodes, generates structured summary.
 *
 * Flow:
 * 1. Upload → MinIO or Supabase Storage
 * 2. Text extraction based on file type
 * 3. NormalizerAgent → KG node creation
 * 4. NotesAgent → structured summary (async, queued)
 * 5. Returns nodeId + extracted text preview
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireSession } from '@/lib/auth/session';
import { normalizeUPSCInput } from '@/lib/agents/normalizer-agent';

export const dynamic = 'force-dynamic';

// 100MB limit
export const maxDuration = 120;

interface UploadResponse {
  success: boolean;
  fileId?: string;
  nodeId?: string;
  fileName?: string;
  fileSize?: number;
  extractedText?: string;
  subject?: string;
  topic?: string;
  error?: string;
}

// Supported MIME types
const SUPPORTED_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
  'text/plain',
  'text/markdown',
  'application/msword', // DOC
]);

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const userId = session.id;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = (formData.get('title') as string) || '';
    const subject = (formData.get('subject') as string) || '';

    if (!file) {
      return NextResponse.json<UploadResponse>(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (100MB)
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json<UploadResponse>(
        { success: false, error: 'File too large. Maximum size is 100MB.' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!SUPPORTED_TYPES.has(file.type)) {
      return NextResponse.json<UploadResponse>(
        { success: false, error: `Unsupported file type: ${file.type}. Supported: PDF, images, DOCX, PPTX, TXT.` },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // Step 1: Upload to storage
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = `uploads/${userId}/${Date.now()}_${file.name}`;

    let storageUrl = '';
    try {
      // Try MinIO first
      const { isMinioConfigured, uploadFile } = await import('@/lib/storage/minio-client');
      if (isMinioConfigured()) {
        storageUrl = await uploadFile('MATERIALS', fileName, fileBuffer, file.type);
      } else {
        // Fall back to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('materials')
          .upload(fileName, fileBuffer, { contentType: file.type });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('materials')
          .getPublicUrl(fileName);
        storageUrl = urlData.publicUrl;
      }
    } catch (err) {
      console.error('[upload/intelligent] Storage failed:', err);
      return NextResponse.json<UploadResponse>(
        { success: false, error: 'File storage failed' },
        { status: 500 }
      );
    }

    // Step 2: Extract text based on file type
    let extractedText = '';
    try {
      extractedText = await extractText(fileBuffer, file.type, file.name);
    } catch (err) {
      console.warn('[upload/intelligent] Text extraction failed, continuing without text:', err);
      extractedText = title || file.name;
    }

    // Step 3: Normalize to KG
    const textForNormalization = title || extractedText.slice(0, 500);
    const normalized = await normalizeUPSCInput(textForNormalization);

    // Step 4: Create knowledge_node for uploaded material
    let nodeId: string | null = null;
    try {
      const { data: node } = await supabase
        .from('knowledge_nodes')
        .insert({
          type: 'uploaded_material',
          title: title || file.name,
          content: extractedText.slice(0, 10000), // Store first 10K chars
          subject: subject || normalized.subject,
          metadata: {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            storageUrl,
            uploadedBy: userId,
            topic: normalized.topic,
            subtopic: normalized.subtopic,
          },
          confidence_score: 0.8,
          freshness_score: 1.0,
          last_verified_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      nodeId = node?.id || null;
    } catch (err) {
      console.warn('[upload/intelligent] KG node creation failed:', err);
    }

    // Step 5: Create edges linking uploaded material to topic nodes
    if (nodeId && normalized.nodeId) {
      try {
        await supabase
          .from('knowledge_edges')
          .insert({
            from_node_id: nodeId,
            to_node_id: normalized.nodeId,
            relationship_type: 'supports',
            weight: 0.8,
            metadata: { source: 'user_upload' },
          });
      } catch (err) {
        console.warn('[upload/intelligent] Edge creation failed:', err);
      }
    }

    // Step 6: Queue notes generation asynchronously (non-blocking)
    if (nodeId && extractedText.length > 100) {
      try {
        const { hermes } = await import('@/lib/agents/orchestrator');
        // Fire and forget — don't await, let it process in background
        hermes.dispatch({
          type: 'generate_notes',
          nodeId,
          topic: title || normalized.topic,
          subject: subject || normalized.subject,
          payload: { sources: [{ type: 'file', title: file.name, content: extractedText.slice(0, 5000) }] },
        }).catch(err => console.warn('[upload/intelligent] Background notes generation failed:', err));
      } catch {
        // Non-critical
      }
    }

    return NextResponse.json<UploadResponse>({
      success: true,
      fileId: fileName,
      nodeId: nodeId || undefined,
      fileName: file.name,
      fileSize: file.size,
      extractedText: extractedText.slice(0, 500), // Preview only
      subject: subject || normalized.subject,
      topic: normalized.topic,
    });
  } catch (error) {
    console.error('[upload/intelligent] Failed:', error);
    return NextResponse.json<UploadResponse>(
      { success: false, error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}

/**
 * Extract text from various file formats.
 * Uses dynamic imports to avoid bundling unused parsers.
 */
async function extractText(buffer: Buffer, mimeType: string, fileName: string): Promise<string> {
  // Plain text / markdown
  if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
    return buffer.toString('utf-8');
  }

  // PDF
  if (mimeType === 'application/pdf') {
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(buffer);
      return data.text;
    } catch {
      return `[PDF: ${fileName} — text extraction unavailable]`;
    }
  }

  // Images — use Ollama vision model
  if (mimeType.startsWith('image/')) {
    try {
      const { callAI } = await import('@/lib/ai/ai-provider-client');
      const base64 = buffer.toString('base64');
      const result = await callAI({
        messages: [
          { role: 'system', content: 'Extract all text from this image. If it contains diagrams, describe them. Return the extracted text only.' },
          { role: 'user', content: `[Image attached: data:${mimeType};base64,${base64.slice(0, 1000)}...]` },
        ],
        temperature: 0.1,
        maxTokens: 2000,
        skipSimplifiedLanguage: true,
      });
      return result || `[Image: ${fileName}]`;
    } catch {
      return `[Image: ${fileName} — OCR unavailable]`;
    }
  }

  // DOCX
  if (mimeType.includes('wordprocessingml') || mimeType === 'application/msword') {
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch {
      return `[DOCX: ${fileName} — text extraction unavailable]`;
    }
  }

  // PPTX
  if (mimeType.includes('presentationml')) {
    try {
      // officeparser handles PPTX
      const officeparser = await import('officeparser');
      const text = await officeparser.parseOfficeAsync(buffer);
      return typeof text === 'string' ? text : `[PPTX: ${fileName}]`;
    } catch {
      return `[PPTX: ${fileName} — text extraction unavailable]`;
    }
  }

  return `[${fileName} — format not supported for text extraction]`;
}
