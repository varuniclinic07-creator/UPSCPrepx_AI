/**
 * PDF Viewer Component
 * 
 * Master Prompt v8.0 - Feature F12 (READ Mode)
 * - Main PDF rendering wrapper
 * - Page navigation
 * - Zoom controls
 * - Annotation overlay
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
  showHindi: boolean;
  onPageChange?: (page: number) => void;
  children?: (props: { page: number; numPages: number }) => React.ReactNode;
}

export function PdfViewer({ url, showHindi, onPageChange, children }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const changePage = (offset: number) => {
    if (!numPages) return;
    const newPage = Math.min(Math.max(1, pageNumber + offset), numPages);
    setPageNumber(newPage);
    onPageChange?.(newPage);
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b bg-white">
        <div className="flex items-center gap-2">
          <button
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium">
            {pageNumber} / {numPages || '--'}
          </span>
          <button
            onClick={() => changePage(1)}
            disabled={pageNumber >= (numPages || 1)}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="p-1.5 rounded hover:bg-gray-100"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-500 w-10 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-1.5 rounded hover:bg-gray-100"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto flex justify-center p-4 bg-gray-100">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-saffron-600 animate-spin" />
          </div>
        )}
        
        {error && (
          <div className="text-center text-red-500 mt-10">
            <p>{showHindi ? 'PDF लोड करने में त्रुटि' : 'Error loading PDF'}</p>
            <p className="text-xs mt-2">{error}</p>
          </div>
        )}

        {!loading && !error && numPages && (
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(err) => setError(err.message)}
            className="shadow-lg"
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>
        )}
      </div>

      {/* Additional UI via children */}
      {children && children({ page: pageNumber, numPages: numPages || 0 })}
    </div>
  );
}
