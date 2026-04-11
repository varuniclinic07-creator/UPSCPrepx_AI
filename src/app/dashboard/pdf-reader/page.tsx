/**
 * PDF Reader Page
 * 
 * Master Prompt v8.0 - Feature F12 (READ Mode)
 * - Main reading interface
 * - Sidebar for annotations
 * - Toolbar integration
 */

'use client';

import React, { useState, useEffect } from 'react';
import { PdfViewer } from '@/components/pdf/pdf-viewer';
import { AnnotationLayer } from '@/components/pdf/pdf-annotation-layer';
import { FileText, Bookmark, Share, MoreVertical, Plus } from 'lucide-react';

export default function PdfReaderPage() {
  const [showHindi, setShowHindi] = useState(false);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="h-[calc(100vh-64px)] flex bg-gray-900">
      {/* Main Reader Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Toolbar */}
        <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-20">
          <div className="flex items-center gap-2">
             <button className="p-1.5 hover:bg-gray-100 rounded">
               <MoreVertical className="w-5 h-5 text-gray-600" />
             </button>
             <span className="font-medium text-sm">UPSC-History-Ch1.pdf</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input (Simulated for now) */}
            <div className="relative">
              <input 
                type="text"
                placeholder="Search in PDF..."
                className="bg-gray-100 rounded pl-2 pr-8 py-1 text-sm w-48 focus:w-64 transition-all"
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowHindi(!showHindi)}
              className="text-xs font-medium text-gray-500 hover:text-gray-900"
            >
              {showHindi ? 'EN' : 'HI'}
            </button>
            <button className="p-1.5 hover:bg-gray-100 rounded">
              <Bookmark className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-1.5 hover:bg-gray-100 rounded">
              <Share className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </header>

        {/* PDF Viewport */}
        <div className="flex-1 overflow-hidden bg-gray-100 relative">
          <div className="h-full relative">
            <PdfViewer 
              showHindi={showHindi}
              url="/placeholder-book.pdf" // Placeholder URL
              onPageChange={setCurrentPage}
            >
              {(props) => (
                <AnnotationLayer 
                  annotations={annotations} 
                  currentPage={props.page} 
                />
              )}
            </PdfViewer>
          </div>

          {/* Quick Tools Floating Bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-lg px-2 py-1 flex gap-1">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-saffron-100 text-saffron-700 rounded-full text-xs font-medium">
              <Plus className="w-3 h-3" /> {showHindi ? 'हाइलाइट' : 'Highlight'}
            </button>
            <button className="px-3 py-1.5 hover:bg-gray-50 rounded-full text-xs font-medium text-gray-600">
              {showHindi ? 'नोट' : 'Note'}
            </button>
             <button className="px-3 py-1.5 hover:bg-gray-50 rounded-full text-xs font-medium text-gray-600">
              {showHindi ? 'ड्राइंग' : 'Drawing'}
            </button>
          </div>
        </div>
      </div>

      {/* Annotations Sidebar */}
      <div className={`${isSidebarOpen ? 'w-72' : 'w-0'} transition-all bg-white border-l border-gray-200 flex flex-col h-full`}>
         {/* Sidebar Header */}
         <div className="p-3 border-b border-gray-200 flex items-center justify-between">
           <span className="font-semibold text-sm">{showHindi ? 'एनोटेशन' : 'Annotations'}</span>
           <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-gray-100 rounded">
             <FileText className="w-4 h-4 text-gray-500" />
           </button>
         </div>
         
         {/* Annotations List */}
         <div className="flex-1 overflow-y-auto p-3 space-y-3">
           {annotations.length === 0 ? (
             <div className="text-center py-8">
               <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-2" />
               <p className="text-xs text-gray-400">
                 {showHindi ? 'कोई एनोटेशन नहीं' : 'No annotations yet'}
               </p>
               <p className="text-[10px] text-gray-400 mt-1">
                 {showHindi ? 'टेक्स्ट चुनें शुरू करने के लिए' : 'Select text to start'}
               </p>
             </div>
           ) : (
             annotations.map((ann, idx) => (
               <div key={idx} className="p-2 bg-gray-50 rounded border border-gray-200">
                 <div className="flex items-center gap-2 mb-1">
                   <div className={`w-2 h-2 rounded-full ${ann.type === 'highlight' ? 'bg-yellow-400' : 'bg-red-500'}`} />
                   <span className="text-[10px] text-gray-500">{showHindi ? 'पृष्ठ' : 'Page'} {ann.page_index + 1}</span>
                 </div>
                 <p className="text-xs text-gray-800 line-clamp-2">{ann.text_content}</p>
               </div>
             ))
           )}
         </div>
      </div>
    </div>
  );
}
