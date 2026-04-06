/**
 * ImageUpload Component
 * 
 * Master Prompt v8.0 - Feature F5 (READ Mode)
 * - Drag-drop image upload
 * - File picker
 * - Image preview
 * - OCR progress indicator
 * - Multiple image support
 * - Saffron theme design
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Image, Upload, X, Loader2, AlertCircle } from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ImageUploadProps {
  onUpload: (files: File[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // MB
  showHindi?: boolean;
  disabled?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MAX_FILES = 3;
const DEFAULT_MAX_FILE_SIZE = 5; // MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

// ============================================================================
// IMAGE UPLOAD COMPONENT
// ============================================================================

export function ImageUpload({
  onUpload,
  maxFiles = DEFAULT_MAX_FILES,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  showHindi = false,
  disabled = false,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return showHindi
        ? `अमान्य फ़ाइल प्रकार. केवल PNG, JPG, JPEG, WebP अनुमति हैं`
        : `Invalid file type. Only PNG, JPG, JPEG, WebP allowed`;
    }

    // Check file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxFileSize) {
      return showHindi
        ? `फ़ाइल बहुत बड़ी है (${sizeMB.toFixed(1)}MB). अधिकतम ${maxFileSize}MB अनुमति है`
        : `File too large (${sizeMB.toFixed(1)}MB). Max ${maxFileSize}MB allowed`;
    }

    return null;
  }, [maxFileSize, showHindi]);

  // Process files
  const processFiles = useCallback(async (files: File[]) => {
    setError(null);
    setIsProcessing(true);

    const validFiles: File[] = [];
    const newPreviews: { file: File; preview: string }[] = [];

    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        continue;
      }

      // Create preview
      const preview = URL.createObjectURL(file);
      newPreviews.push({ file, preview });
      validFiles.push(file);
    }

    setPreviews(prev => [...prev, ...newPreviews]);
    
    if (validFiles.length > 0) {
      onUpload(validFiles);
    }

    setIsProcessing(false);
  }, [validateFile, onUpload]);

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => 
      f.type.startsWith('image/')
    );

    if (droppedFiles.length === 0) {
      setError(showHindi ? 'कोई छवि फ़ाइलें नहीं मिलीं' : 'No image files found');
      return;
    }

    await processFiles(droppedFiles);
  }, [disabled, showHindi, processFiles]);

  // Handle file input change
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      await processFiles(selectedFiles);
    }
    
    // Reset input value to allow re-selecting same files
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  // Handle click
  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  // Remove preview
  const removePreview = useCallback((index: number) => {
    setPreviews(prev => {
      const removed = prev[index];
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  return (
    <div className="w-full max-w-md">
      {/* Drop Zone */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragging
            ? 'border-saffron-500 bg-saffron-50 scale-[1.02]'
            : 'border-gray-300 hover:border-saffron-400 hover:bg-gray-50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        {/* Icon */}
        <div className="flex justify-center mb-3">
          {isProcessing ? (
            <Loader2 className="w-8 h-8 text-saffron-600 animate-spin" />
          ) : (
            <div className={`
              p-3 rounded-full
              ${isDragging ? 'bg-saffron-100' : 'bg-gray-100'}
            `}>
              <Upload className={`w-6 h-6 ${
                isDragging ? 'text-saffron-600' : 'text-gray-500'
              }`} />
            </div>
          )}
        </div>

        {/* Text */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-700">
            {showHindi ? 'छवि अपलोड करें' : 'Upload Image'}
          </p>
          <p className="text-xs text-gray-500">
            {showHindi
              ? 'खींचें और छोड़ें या क्लिक करें'
              : 'Drag & drop or click to select'}
          </p>
          <p className="text-xs text-gray-400">
            PNG, JPG, JPEG, WebP • Max {maxFileSize}MB
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Previews */}
      {previews.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {previews.map((item, index) => (
            <div
              key={index}
              className="relative group w-16 h-16 rounded-lg overflow-hidden border border-gray-200"
            >
              <img
                src={item.preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removePreview(index)}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
        <Image className="w-3 h-3" />
        <span>
          {showHindi
            ? `अधिकतम ${maxFiles} छवियां`
            : `Max ${maxFiles} images`}
        </span>
      </div>
    </div>
  );
}
