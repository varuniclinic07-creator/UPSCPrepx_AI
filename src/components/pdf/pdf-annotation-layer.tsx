/**
 * PDF Annotation Layer Component
 * 
 * Master Prompt v8.0 - Feature F12 (READ Mode)
 * - Renders highlights, underlines, and notes over the PDF page
 * - Handles click interactions for notes
 */

import React, { useState } from 'react';

interface Position {
  x: number; y: number; width: number; height: number;
}

interface Annotation {
  id?: string;
  type: 'highlight' | 'underline' | 'note' | 'drawing' | 'strikeout';
  page_index: number;
  color?: string;
  text_content?: string;
  note_content?: string;
  position?: Position;
}

interface AnnotationLayerProps {
  annotations: Annotation[];
  currentPage: number;
}

export function AnnotationLayer({ annotations, currentPage }: AnnotationLayerProps) {
  const pageAnnotations = annotations.filter((a) => a.page_index === currentPage || a.page_index + 1 === currentPage);

  if (!pageAnnotations.length) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {pageAnnotations.map((ann, idx) => {
        if (!ann.position) return null;
        const pos = ann.position;
        
        return (
          <div
            key={ann.id || idx}
            className={`absolute pointer-events-auto transition-opacity hover:opacity-80 ${
              ann.type === 'highlight' ? 'bg-yellow-300 opacity-50' :
              ann.type === 'underline' ? 'border-b-4 border-blue-500 opacity-70' :
              ann.type === 'note' ? 'bg-red-400 opacity-60 cursor-pointer' : 'opacity-60'
            }`}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: `${pos.width}%`,
              height: `${pos.height}%`,
            }}
            title={ann.note_content || ann.text_content || ''}
          >
            {ann.type === 'note' && (
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-600 rounded-full border-2 border-white" />
            )}
          </div>
        );
      })}
    </div>
  );
}
