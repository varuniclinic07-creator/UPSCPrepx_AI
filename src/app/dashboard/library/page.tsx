'use client';

import Link from 'next/link';
import { ArrowLeft, FileText, Upload } from 'lucide-react';

const placeholderPdfs = [
  { id: '1', title: 'Indian Polity - Laxmikanth', pages: 812 },
  { id: '2', title: 'Geography of India - Majid Husain', pages: 456 },
  { id: '3', title: 'Modern India - Spectrum', pages: 320 },
  { id: '4', title: 'Indian Economy - Ramesh Singh', pages: 590 },
  { id: '5', title: 'Art & Culture - Nitin Singhania', pages: 280 },
  { id: '6', title: 'Environment & Ecology Notes', pages: 145 },
];

export default function LibraryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Library</h1>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Upload className="h-4 w-4" /> Upload PDF
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {placeholderPdfs.map((pdf) => (
          <Link
            key={pdf.id}
            href={`/dashboard/library/${pdf.id}`}
            className="group rounded-lg border p-5 hover:border-primary transition-colors"
          >
            <FileText className="h-10 w-10 text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
            <h3 className="font-semibold mb-1">{pdf.title}</h3>
            <p className="text-sm text-muted-foreground">{pdf.pages} pages</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
