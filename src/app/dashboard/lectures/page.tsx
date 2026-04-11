'use client';

import Link from 'next/link';
import { ArrowLeft, Play, Clock } from 'lucide-react';

const lectures = [
  { id: '1', title: 'Indian Constitution - Basic Structure', subject: 'Polity', duration: '45 min' },
  { id: '2', title: 'Monsoon Mechanism in India', subject: 'Geography', duration: '38 min' },
  { id: '3', title: 'Revolt of 1857 - Causes & Impact', subject: 'History', duration: '52 min' },
  { id: '4', title: 'Fiscal Policy & Budget', subject: 'Economy', duration: '40 min' },
  { id: '5', title: 'Biodiversity Hotspots', subject: 'Environment', duration: '35 min' },
  { id: '6', title: 'International Organizations - UN System', subject: 'IR', duration: '42 min' },
  { id: '7', title: 'Ethics in Governance', subject: 'Ethics', duration: '48 min' },
  { id: '8', title: 'Science & Tech - Space Missions', subject: 'S&T', duration: '30 min' },
];

export default function LecturesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-8">Lectures</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {lectures.map((lecture) => (
          <Link
            key={lecture.id}
            href={`/dashboard/lectures/${lecture.id}`}
            className="group rounded-lg border overflow-hidden hover:border-primary transition-colors"
          >
            <div className="aspect-video bg-muted flex items-center justify-center">
              <Play className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="p-4">
              <span className="text-xs font-medium text-primary">{lecture.subject}</span>
              <h3 className="font-semibold text-sm mt-1 mb-2">{lecture.title}</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> {lecture.duration}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
