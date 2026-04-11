'use client';

import Link from 'next/link';
import { ArrowLeft, Play, ThumbsUp, Bookmark, Share2 } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function LecturePlayerPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Link href="/dashboard/lectures" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Lectures
      </Link>

      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-6">
        <button className="rounded-full bg-primary/90 p-4 hover:bg-primary transition-colors">
          <Play className="h-8 w-8 text-primary-foreground" />
        </button>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Lecture #{id}</h1>
          <p className="text-sm text-muted-foreground">UPSC Preparation Series</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-lg border p-2 hover:bg-muted"><ThumbsUp className="h-4 w-4" /></button>
          <button className="rounded-lg border p-2 hover:bg-muted"><Bookmark className="h-4 w-4" /></button>
          <button className="rounded-lg border p-2 hover:bg-muted"><Share2 className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="rounded-lg border p-6">
        <h2 className="font-semibold mb-3">Description</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This lecture covers key concepts relevant to UPSC Civil Services preparation. Topics include detailed analysis, examples, and practice questions for better understanding.
        </p>
      </div>

      <div className="rounded-lg border p-6 mt-4">
        <h2 className="font-semibold mb-3">Notes</h2>
        <textarea
          placeholder="Take notes while watching..."
          rows={4}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
        />
      </div>
    </div>
  );
}
