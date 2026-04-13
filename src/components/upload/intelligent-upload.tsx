'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface UploadResult {
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

interface IntelligentUploadProps {
  onUploadComplete?: (result: UploadResult) => void;
  subject?: string;
  maxSizeMB?: number;
  className?: string;
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/markdown',
].join(',');

/**
 * Intelligent File Upload component.
 * Handles any file up to 100MB — PDF, images, DOCX, PPTX, TXT.
 * Automatically extracts text, normalizes to KG, and generates notes.
 */
export function IntelligentUpload({
  onUploadComplete,
  subject,
  maxSizeMB = 100,
  className = '',
}: IntelligentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File too large. Maximum size is ${maxSizeMB}MB.`);
      return;
    }

    setUploading(true);
    setProgress('Uploading...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.replace(/\.[^.]+$/, ''));
      if (subject) formData.append('subject', subject);

      setProgress('Processing file...');

      const response = await fetch('/api/upload/intelligent', {
        method: 'POST',
        body: formData,
      });

      const result: UploadResult = await response.json();

      if (result.success) {
        toast.success(`Uploaded: ${result.fileName}. AI is generating notes.`);
        onUploadComplete?.(result);
      } else {
        toast.error(result.error || 'Upload failed');
      }
    } catch (err) {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setProgress('');
    }
  }, [maxSizeMB, subject, onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [handleUpload]);

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
        dragOver
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-gray-600 hover:border-gray-400'
      } ${className}`}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {uploading ? (
        <div className="space-y-2">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-blue-400">{progress}</p>
        </div>
      ) : (
        <div
          className="cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-3xl mb-2">+</div>
          <p className="text-sm text-gray-300">
            Drop a file here or click to upload
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PDF, Images, DOCX, PPTX, TXT — up to {maxSizeMB}MB
          </p>
          <p className="text-xs text-gray-600 mt-1">
            AI will extract text, link to UPSC topics, and generate notes
          </p>
        </div>
      )}
    </div>
  );
}
