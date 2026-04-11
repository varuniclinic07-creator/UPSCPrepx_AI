/**
 * Export API Route - User Content Studio (Feature F4)
 * 
 * Handles document export (PDF, Word, Markdown)
 * Master Prompt v8.0 - READ Mode
 * 
 * Endpoints:
 * - POST: Generate export file
 * 
 * AI Provider: 9Router → Groq → Ollama
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { getAuthUser } from '@/lib/security/auth';
import { checkSubscriptionAccess } from '@/lib/trial/subscription-checker';

export const dynamic = 'force-dynamic';

// ============================================================================
// CONFIGURATION
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ExportSchema = z.object({
  noteId: z.string().uuid().optional(),
  answerId: z.string().uuid().optional(),
  format: z.enum(['pdf', 'docx', 'md']),
  options: z.object({
    includeMetadata: z.boolean().default(true),
    includeTimestamp: z.boolean().default(true),
    pageSize: z.enum(['a4', 'letter']).default('a4'),
    orientation: z.enum(['portrait', 'landscape']).default('portrait'),
  }).optional(),
});

// ============================================================================
// EXPORT GENERATORS
// ============================================================================

/**
 * Generate PDF content using pdfmake format
 */
function generatePdfContent(
  title: string,
  content: string,
  metadata: any,
  options: any
) {
  const pdfDefinition: any = {
    pageSize: options.pageSize || 'A4',
    pageOrientation: options.orientation || 'portrait',
    content: [],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10],
        color: '#ea580c',
      },
      subheader: {
        fontSize: 12,
        color: '#6b7280',
        margin: [0, 0, 0, 5],
      },
      content: {
        fontSize: 11,
        margin: [0, 5, 0, 10],
      },
      metadata: {
        fontSize: 9,
        color: '#9ca3af',
        margin: [0, 10, 0, 0],
      },
    },
  };

  // Title
  pdfDefinition.content.push({
    text: title,
    style: 'header',
  });

  // Metadata
  if (options.includeMetadata && metadata) {
    const metaLines: any[] = [];
    if (metadata.subject) {
      metaLines.push({ text: `Subject: ${metadata.subject}`, style: 'subheader' });
    }
    if (metadata.wordCount) {
      metaLines.push({ text: `Word Count: ${metadata.wordCount}`, style: 'subheader' });
    }
    if (options.includeTimestamp && metadata.createdAt) {
      metaLines.push({
        text: `Created: ${new Date(metadata.createdAt).toLocaleString()}`,
        style: 'subheader',
      });
    }
    if (metaLines.length > 0) {
      pdfDefinition.content.push(...metaLines);
    }
  }

  // Content (split into paragraphs)
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  paragraphs.forEach((para: string) => {
    pdfDefinition.content.push({
      text: para,
      style: 'content',
    });
  });

  return pdfDefinition;
}

/**
 * Generate Word (DOCX) content
 */
function generateDocxContent(
  title: string,
  content: string,
  metadata: any,
  options: any
) {
  const docxContent = {
    children: [
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: title,
            bold: true,
            size: 36,
            color: 'ea580c',
          },
        ],
      },
    ],
  };

  // Metadata
  if (options.includeMetadata && metadata) {
    const metaParts: string[] = [];
    if (metadata.subject) metaParts.push(`Subject: ${metadata.subject}`);
    if (metadata.wordCount) metaParts.push(`Words: ${metadata.wordCount}`);
    if (options.includeTimestamp && metadata.createdAt) {
      metaParts.push(`Created: ${new Date(metadata.createdAt).toLocaleString()}`);
    }
    if (metaParts.length > 0) {
      docxContent.children.push({
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: metaParts.join(' | '),
            italics: true,
            size: 20,
            color: '6b7280',
          },
        ],
      });
    }
  }

  // Content
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  paragraphs.forEach((para: string) => {
    docxContent.children.push({
      type: 'paragraph',
      children: [
        {
          type: 'text',
          text: para,
          size: 22,
        },
      ],
    });
  });

  return docxContent;
}

/**
 * Generate Markdown content
 */
function generateMarkdownContent(
  title: string,
  content: string,
  metadata: any,
  options: any
) {
  let markdown = `# ${title}\n\n`;

  // Metadata as frontmatter
  if (options.includeMetadata && metadata) {
    markdown += '---\n';
    if (metadata.subject) markdown += `subject: ${metadata.subject}\n`;
    if (metadata.wordCount) markdown += `wordCount: ${metadata.wordCount}\n`;
    if (options.includeTimestamp && metadata.createdAt) {
      markdown += `createdAt: ${metadata.createdAt}\n`;
    }
    markdown += '---\n\n';
  }

  // Content
  markdown += content;

  return markdown;
}

// ============================================================================
// POST - Generate Export
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse body
    const body = await request.json();
    const validated = ExportSchema.parse(body);

    // Validate that either noteId or answerId is provided
    if (!validated.noteId && !validated.answerId) {
      return NextResponse.json(
        { success: false, error: 'Either noteId or answerId is required' },
        { status: 400 }
      );
    }

    // Subscription check - PDF export is premium
    const subscription = await checkSubscriptionAccess(authUser.id, 'content_studio');
    
    if (validated.format === 'pdf' && !subscription.isPremium) {
      return NextResponse.json(
        {
          success: false,
          error: 'PDF export is a Premium feature. Please upgrade to export as PDF.',
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the document
    let document: any = null;
    let type: 'note' | 'answer' = 'note';

    if (validated.noteId) {
      const { data } = await supabase
        .from('user_notes')
        .select('*')
        .eq('id', validated.noteId)
        .eq('user_id', authUser.id)
        .single();
      document = data;
      type = 'note';
    } else if (validated.answerId) {
      const { data } = await supabase
        .from('user_answers')
        .select('*')
        .eq('id', validated.answerId)
        .eq('user_id', authUser.id)
        .single();
      document = data;
      type = 'answer';
    }

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Get title and content
    const title = document.title_en || document.title_hi || 'Untitled';
    const content = document.content;

    // Prepare metadata
    const metadata = {
      subject: document.subject,
      wordCount: document.word_count,
      characterCount: document.character_count,
      createdAt: document.created_at,
      updatedAt: document.updated_at,
      tags: document.tags,
    };

    const options = validated.options || {};

    // Generate export based on format
    let exportData: any;
    let mimeType: string;
    let extension: string;

    switch (validated.format) {
      case 'pdf':
        exportData = generatePdfContent(title, content, metadata, options);
        mimeType = 'application/pdf';
        extension = 'pdf';
        break;

      case 'docx':
        exportData = generateDocxContent(title, content, metadata, options);
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        extension = 'docx';
        break;

      case 'md':
        exportData = generateMarkdownContent(title, content, metadata, options);
        mimeType = 'text/markdown';
        extension = 'md';
        break;
    }

    // Generate filename
    const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${safeTitle}_${timestamp}.${extension}`;

    // For PDF and DOCX, we'd typically use a library to generate the actual binary
    // For now, we return the structure that can be used with those libraries
    // In production, you'd use pdfmake, docx, etc.

    // Track export in database
    try {
      await supabase.from('note_exports').insert({
        user_id: authUser.id,
        source_type: type,
        source_id: validated.noteId || validated.answerId,
        format: validated.format,
        filename,
        options: options,
      });
    } catch (trackError) {
      console.warn('Failed to track export:', trackError);
    }

    return NextResponse.json({
      success: true,
      data: {
        filename,
        format: validated.format,
        mimeType,
        content: exportData,
        // For actual download, you'd generate a presigned URL or base64
        downloadUrl: `/api/studio/export/download?filename=${encodeURIComponent(filename)}&format=${validated.format}`,
      },
      message: `Export generated successfully as ${validated.format.toUpperCase()}`,
    });
  } catch (error) {
    console.error('Export error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
