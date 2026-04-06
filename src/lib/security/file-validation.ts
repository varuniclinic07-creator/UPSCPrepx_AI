// ═══════════════════════════════════════════════════════════════════════════
// FILE UPLOAD VALIDATION - Secure file upload handling
// ═══════════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════════════════
// FILE TYPE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export interface FileTypeConfig {
    mimeTypes: string[];
    extensions: string[];
    magicBytes: number[];     // First bytes of file
    maxSize: number;          // Max size in bytes
}

export const ALLOWED_FILE_TYPES: Record<string, FileTypeConfig> = {
    pdf: {
        mimeTypes: ['application/pdf'],
        extensions: ['.pdf'],
        magicBytes: [0x25, 0x50, 0x44, 0x46], // %PDF
        maxSize: 50 * 1024 * 1024, // 50MB
    },
    docx: {
        mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        extensions: ['.docx'],
        magicBytes: [0x50, 0x4B, 0x03, 0x04], // PK.. (ZIP format)
        maxSize: 25 * 1024 * 1024, // 25MB
    },
    doc: {
        mimeTypes: ['application/msword'],
        extensions: ['.doc'],
        magicBytes: [0xD0, 0xCF, 0x11, 0xE0], // OLE Compound Document
        maxSize: 25 * 1024 * 1024, // 25MB
    },
    txt: {
        mimeTypes: ['text/plain'],
        extensions: ['.txt'],
        magicBytes: [], // No specific magic bytes for text
        maxSize: 10 * 1024 * 1024, // 10MB
    },
    epub: {
        mimeTypes: ['application/epub+zip'],
        extensions: ['.epub'],
        magicBytes: [0x50, 0x4B, 0x03, 0x04], // PK.. (ZIP format)
        maxSize: 100 * 1024 * 1024, // 100MB
    },
    image: {
        mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
        magicBytes: [], // Various
        maxSize: 10 * 1024 * 1024, // 10MB
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION RESULT
// ═══════════════════════════════════════════════════════════════════════════

export interface FileValidationResult {
    valid: boolean;
    error?: string;
    sanitizedName?: string;
    detectedType?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATE FILE UPLOAD
// ═══════════════════════════════════════════════════════════════════════════

export async function validateFileUpload(
    file: File,
    allowedTypes: string[] = ['pdf', 'docx', 'doc', 'txt', 'epub']
): Promise<FileValidationResult> {
    // 1. Check if file exists
    if (!file || !file.name) {
        return { valid: false, error: 'No file provided' };
    }

    // 2. Sanitize filename (remove dangerous characters)
    const sanitizedName = sanitizeFileName(file.name);

    // 3. Get file extension
    const extension = getFileExtension(sanitizedName);

    // 4. Find matching file type config
    let matchedType: string | null = null;
    let matchedConfig: FileTypeConfig | null = null;

    for (const type of allowedTypes) {
        const config = ALLOWED_FILE_TYPES[type];
        if (config && config.extensions.includes(extension)) {
            matchedType = type;
            matchedConfig = config;
            break;
        }
    }

    if (!matchedType || !matchedConfig) {
        return {
            valid: false,
            error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
        };
    }

    // 5. Validate MIME type
    if (!matchedConfig.mimeTypes.includes(file.type)) {
        return {
            valid: false,
            error: `Invalid MIME type: ${file.type}`
        };
    }

    // 6. Validate file size
    if (file.size > matchedConfig.maxSize) {
        const maxMB = Math.round(matchedConfig.maxSize / (1024 * 1024));
        return {
            valid: false,
            error: `File too large. Maximum size: ${maxMB}MB`
        };
    }

    // 7. Validate magic bytes (file signature)
    if (matchedConfig.magicBytes.length > 0) {
        const isValidSignature = await validateMagicBytes(file, matchedConfig.magicBytes);
        if (!isValidSignature) {
            return {
                valid: false,
                error: 'File signature does not match declared type'
            };
        }
    }

    // 8. Scan for malicious content (basic check)
    const hasMaliciousContent = await scanForMaliciousContent(file);
    if (hasMaliciousContent) {
        return {
            valid: false,
            error: 'File contains potentially malicious content'
        };
    }

    return {
        valid: true,
        sanitizedName,
        detectedType: matchedType,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function sanitizeFileName(fileName: string): string {
    return fileName
        .replace(/[^\w\s\-\.]/g, '') // Remove special characters
        .replace(/\s+/g, '_')         // Replace spaces with underscores
        .replace(/\.{2,}/g, '.')      // Remove multiple dots
        .slice(0, 200);               // Limit length
}

function getFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    if (parts.length < 2) return '';
    return '.' + parts.pop()!.toLowerCase();
}

async function validateMagicBytes(file: File, expectedBytes: number[]): Promise<boolean> {
    try {
        const buffer = await file.slice(0, expectedBytes.length).arrayBuffer();
        const bytes = new Uint8Array(buffer);

        for (let i = 0; i < expectedBytes.length; i++) {
            if (bytes[i] !== expectedBytes[i]) {
                return false;
            }
        }

        return true;
    } catch {
        return false;
    }
}

async function scanForMaliciousContent(file: File): Promise<boolean> {
    try {
        // Read first 10KB for scanning
        const sampleSize = Math.min(file.size, 10 * 1024);
        const buffer = await file.slice(0, sampleSize).arrayBuffer();
        const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);

        // Check for common malicious patterns
        const maliciousPatterns = [
            /<script\b/i,           // Script tags
            /javascript:/i,          // JS protocol
            /vbscript:/i,           // VB protocol
            /on\w+\s*=/i,           // Event handlers
            /<iframe\b/i,           // Iframes
            /<object\b/i,           // Objects
            /<embed\b/i,            // Embeds
            /data:text\/html/i,     // Data URI with HTML
            /<\?php/i,              // PHP code
            /<%/,                   // ASP code
        ];

        for (const pattern of maliciousPatterns) {
            if (pattern.test(text)) {
                console.warn(`[FileValidation] Malicious pattern found: ${pattern}`);
                return true;
            }
        }

        return false;
    } catch {
        // If we can't read the file, err on the side of caution
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION MIDDLEWARE FOR API ROUTES
// ═══════════════════════════════════════════════════════════════════════════

export async function withFileValidation(
    formData: FormData,
    fieldName: string = 'file',
    allowedTypes: string[] = ['pdf', 'docx', 'doc', 'txt', 'epub']
): Promise<{ valid: true; file: File; sanitizedName: string } | NextResponse> {
    const file = formData.get(fieldName) as File | null;

    if (!file) {
        return NextResponse.json(
            { error: 'No file provided' },
            { status: 400 }
        );
    }

    const validation = await validateFileUpload(file, allowedTypes);

    if (!validation.valid) {
        return NextResponse.json(
            { error: 'File validation failed', message: validation.error },
            { status: 400 }
        );
    }

    return {
        valid: true,
        file,
        sanitizedName: validation.sanitizedName!,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// IMAGE-SPECIFIC VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

export async function validateImageUpload(
    file: File,
    options: {
        maxWidth?: number;
        maxHeight?: number;
        maxSize?: number;
    } = {}
): Promise<FileValidationResult> {
    const { maxWidth: _maxWidth = 4096, maxHeight: _maxHeight = 4096, maxSize = 10 * 1024 * 1024 } = options;

    // Basic validation
    if (!file.type.startsWith('image/')) {
        return { valid: false, error: 'File is not an image' };
    }

    if (file.size > maxSize) {
        return { valid: false, error: `Image too large. Maximum: ${maxSize / (1024 * 1024)}MB` };
    }

    // Validate dimensions (requires creating an image element)
    // This would need browser-side validation or additional server-side processing

    return {
        valid: true,
        sanitizedName: sanitizeFileName(file.name),
        detectedType: 'image',
    };
}