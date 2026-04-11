'use client';

import Link from 'next/link';
import { ArrowLeft, CalendarDays, ChevronRight, Download } from 'lucide-react';

const months = [
  { id: 1, label: 'March 2026', topics: 48, articles: 120 },
  { id: 2, label: 'February 2026', topics: 42, articles: 105 },
  { id: 3, label: 'January 2026', topics: 50, articles: 130 },
  { id: 4, label: 'December 2025', topics: 38, articles: 95 },
  { id: 5, label: 'November 2025', topics: 45, articles: 110 },
  { id: 6, label: 'October 2025', topics: 40, articles: 100 },
];

export default function MonthlyCompilationPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-2">Monthly Compilation</h1>
      <p className="text-muted-foreground mb-8">Comprehensive monthly current affairs for revision.</p>

      <div className="space-y-3">
        {months.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-lg border p-4 hover:border-primary transition-colors">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="font-medium text-sm">{m.label}</h3>
                <p className="text-xs text-muted-foreground">{m.topics} topics &middot; {m.articles} articles</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded p-2 hover:bg-muted" title="Download PDF">
                <Download className="h-4 w-4 text-muted-foreground" />
              </button>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
