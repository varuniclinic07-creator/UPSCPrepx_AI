'use client';

import Link from 'next/link';
import { ArrowLeft, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function PdfReaderPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/library" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Library
          </Link>
          <h1 className="text-lg font-semibold">Document #{id}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded p-2 hover:bg-muted"><ZoomOut className="h-4 w-4" /></button>
          <span className="text-sm text-muted-foreground">100%</span>
          <button className="rounded p-2 hover:bg-muted"><ZoomIn className="h-4 w-4" /></button>
          <button className="rounded p-2 hover:bg-muted"><Download className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="w-[600px] h-[800px] bg-background border rounded shadow-sm flex items-center justify-center">
          <p className="text-muted-foreground text-sm">PDF viewer will render here</p>
        </div>
      </div>
    </div>
  );
}
