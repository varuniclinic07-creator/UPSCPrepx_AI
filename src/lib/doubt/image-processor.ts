/**
 * Image Processor Service
 * 
 * Master Prompt v8.0 - Feature F5 (READ Mode)
 * - OCR processing for image-based doubts
 * - Tesseract.js integration
 * - Image validation and preprocessing
 * - Text extraction from diagrams, handwritten notes
 */

import Tesseract from 'tesseract.js';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ImageAttachment {
  file: File | Blob;
  url: string;
  type: 'image' | 'document';
}

export interface OCRResult {
  success: boolean;
  text: string;
  confidence: number;
  language: 'eng' | 'hin';
  processingTimeMs: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
  lines: Array<{
    text: string;
    confidence: number;
    words: number;
  }>;
  error?: string;
}

export interface ImageValidation {
  isValid: boolean;
  fileType: string;
  fileSize: number;
  dimensions?: {
    width: number;
    height: number;
  };
  errors: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MIN_DIMENSION = 100;
const MAX_DIMENSION = 4096;

// ============================================================================
// IMAGE PROCESSOR SERVICE
// ============================================================================

export class ImageProcessorService {
  /**
   * Validate image before processing
   */
  validateImage(file: File | Blob): ImageValidation {
    const errors: string[] = [];
    
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      errors.push(`Invalid file type: ${file.type}. Allowed: PNG, JPG, JPEG, WebP`);
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max: 5MB`);
    }
    
    const validation: ImageValidation = {
      isValid: errors.length === 0,
      fileType: file.type,
      fileSize: file.size,
      errors,
    };
    
    return validation;
  }

  /**
   * Perform OCR on image
   */
  async performOCR(
    imageSource: string | File | Blob,
    language: 'eng' | 'hin' | 'both' = 'eng'
  ): Promise<OCRResult> {
    const startTime = Date.now();
    
    try {
      // Determine languages to use
      const languages = language === 'both' 
        ? ['eng', 'hin'] 
        : [language];
      
      // Process with Tesseract
      const worker = await Tesseract.createWorker(languages as any);
      
      // Perform recognition
      const { data } = await worker.recognize(imageSource);
      
      // Process results
      const words = ((data as any).words || []).map((word: { text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }) => ({
        text: word.text,
        confidence: word.confidence,
        bbox: {
          x0: word.bbox.x0,
          y0: word.bbox.y0,
          x1: word.bbox.x1,
          y1: word.bbox.y1,
        },
      }));

      const lines = ((data as any).lines || []).map((line: { text: string; confidence: number; words: unknown[] }) => ({
        text: line.text,
        confidence: line.confidence,
        words: line.words.length,
      }));

      // Calculate average confidence
      const avgConfidence = words.length > 0
        ? words.reduce((sum: number, w: { confidence: number }) => sum + w.confidence, 0) / words.length
        : 0;
      
      // Cleanup
      await worker.terminate();
      
      return {
        success: true,
        text: data.text,
        confidence: avgConfidence,
        language: language === 'both' ? 'eng' : language,
        processingTimeMs: Date.now() - startTime,
        words,
        lines,
      };
    } catch (error) {
      console.error('OCR failed:', error);
      return {
        success: false,
        text: '',
        confidence: 0,
        language: language === 'both' ? 'eng' : language,
        processingTimeMs: Date.now() - startTime,
        words: [],
        lines: [],
        error: error instanceof Error ? error.message : 'OCR processing failed',
      };
    }
  }

  /**
   * Preprocess image for better OCR results
   */
  async preprocessImage(imageSource: string | File | Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        
        // Resize if too large
        let width = img.width;
        let height = img.height;
        
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        
        // Ensure minimum size
        if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
          const ratio = Math.max(MIN_DIMENSION / width, MIN_DIMENSION / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/png', 0.9);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      // Load image
      if (typeof imageSource === 'string') {
        img.src = imageSource;
      } else {
        img.src = URL.createObjectURL(imageSource);
      }
    });
  }

  /**
   * Extract text from specific region of image
   */
  async extractRegionOCR(
    imageSource: string | File | Blob,
    region: {
      x: number;
      y: number;
      width: number;
      height: number;
    }
  ): Promise<OCRResult> {
    return new Promise(async (resolve, reject) => {
      try {
        const img = new Image();
        
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }
          
          canvas.width = region.width;
          canvas.height = region.height;
          
          ctx.drawImage(
            img,
            region.x,
            region.y,
            region.width,
            region.height,
            0,
            0,
            region.width,
            region.height
          );
          
          // Perform OCR on cropped region
          const result = await this.performOCR(canvas.toDataURL() as any);
          resolve(result);
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        
        if (typeof imageSource === 'string') {
          img.src = imageSource;
        } else {
          img.src = URL.createObjectURL(imageSource);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Batch OCR for multiple images
   */
  async batchOCR(
    images: Array<{ url: string | File | Blob; language?: 'eng' | 'hin' | 'both' }>
  ): Promise<Array<OCRResult & { index: number }>> {
    const results: Array<OCRResult & { index: number }> = [];
    
    for (let i = 0; i < images.length; i++) {
      try {
        const result = await this.performOCR(
          images[i].url,
          images[i].language || 'eng'
        );
        
        results.push({
          ...result,
          index: i,
        });
      } catch (error) {
        results.push({
          index: i,
          success: false,
          text: '',
          confidence: 0,
          language: 'eng',
          processingTimeMs: 0,
          words: [],
          lines: [],
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    return results;
  }

  /**
   * Combine OCR results from multiple images
   */
  combineOCRResults(results: OCRResult[]): string {
    return results
      .filter(r => r.success)
      .map(r => r.text)
      .join('\n\n---\n\n');
  }

  /**
   * Detect if image contains handwritten text
   */
  async detectHandwriting(ocrResult: OCRResult): Promise<{ isHandwritten: boolean; confidence: number }> {
    // Heuristic: Handwritten text typically has lower OCR confidence
    // and more irregular word bounding boxes
    
    if (ocrResult.confidence < 0.5) {
      return { isHandwritten: true, confidence: 1 - ocrResult.confidence };
    }
    
    // Check for irregular word spacing
    const words = ocrResult.words;
    if (words.length < 2) {
      return { isHandwritten: false, confidence: 0.5 };
    }
    
    let irregularCount = 0;
    for (let i = 1; i < words.length; i++) {
      const prevWord = words[i - 1];
      const currWord = words[i];
      
      const gap = currWord.bbox.x0 - prevWord.bbox.x1;
      const avgWordWidth = (prevWord.bbox.x1 - prevWord.bbox.x0 + currWord.bbox.x1 - currWord.bbox.x0) / 2;
      
      // Irregular if gap is very different from average word width
      if (gap < avgWordWidth * 0.3 || gap > avgWordWidth * 2) {
        irregularCount++;
      }
    }
    
    const irregularRatio = irregularCount / (words.length - 1);
    
    return {
      isHandwritten: irregularRatio > 0.3,
      confidence: irregularRatio,
    };
  }

  /**
   * Clean OCR text (remove noise, fix common errors)
   */
  cleanOCRText(text: string): string {
    return text
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Fix common OCR errors
      .replace(/\b0\b/g, 'O') // Zero to O (context dependent)
      .replace(/\b1\b/g, 'I') // One to I (context dependent)
      // Remove special characters that are likely noise
      .replace(/[~`!@#$%^&*()_+={}|:"<>?\[\];',.\-\/]/g, (match) => {
        // Keep common punctuation, remove likely noise
        if (['.', ',', ':', ';', '?', '!', '-', '(', ')'].includes(match)) {
          return match;
        }
        return '';
      })
      // Trim lines
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const imageProcessor = new ImageProcessorService();
