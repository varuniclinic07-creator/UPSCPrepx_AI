'use client';

import Link from 'next/link';
import { ArrowLeft, Calendar, ChevronRight } from 'lucide-react';

const weeks = [
  { id: 1, label: 'Week 14 (Mar 30 - Apr 5, 2026)', topics: 12 },
  { id: 2, label: 'Week 13 (Mar 23 - Mar 29, 2026)', topics: 15 },
  { id: 3, label: 'Week 12 (Mar 16 - Mar 22, 2026)', topics: 10 },
  { id: 4, label: 'Week 11 (Mar 9 - Mar 15, 2026)', topics: 14 },
  { id: 5, label: 'Week 10 (Mar 2 - Mar 8, 2026)', topics: 11 },
  { id: 6, label: 'Week 9 (Feb 23 - Mar 1, 2026)', topics: 13 },
];

export default function WeeklyCompilationPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-2">Weekly Compilation</h1>
      <p className="text-muted-foreground mb-8">Current affairs compiled weekly for quick revision.</p>

      <div className="space-y-3">
        {weeks.map((w) => (
          <button key={w.id} className="w-full flex items-center justify-between rounded-lg border p-4 hover:border-primary transition-colors text-left">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="font-medium text-sm">{w.label}</h3>
                <p className="text-xs text-muted-foreground">{w.topics} topics covered</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}
