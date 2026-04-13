'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BookOpen,
  Brain,
  Newspaper,
  Video,
  FileText,
  Calendar,
  Star,
  Map,
  RotateCcw,
  GraduationCap,
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: BookOpen, label: 'Study Notes', href: '/dashboard/notes' },
  { icon: Brain, label: 'Practice Quiz', href: '/dashboard/quiz' },
  { icon: Newspaper, label: 'Current Affairs', href: '/dashboard/current-affairs' },
  { icon: Video, label: 'Video Lectures', href: '/dashboard/videos' },
  { icon: FileText, label: 'Materials', href: '/dashboard/materials' },
  { icon: Calendar, label: 'Study Planner', href: '/dashboard/planner' },
  { icon: Star, label: 'Bookmarks', href: '/dashboard/bookmarks' },
  { icon: Map, label: 'Mind Maps', href: '/dashboard/mindmaps' },
  { icon: RotateCcw, label: 'Revision', href: '/dashboard/revision' },
];

export function CommandSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col items-center w-20 command-sidebar fixed left-0 top-0 h-full z-50 py-6 gap-2">
      {/* Logo */}
      <Link
        href="/dashboard"
        className="mb-6 flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-blue-400 shadow-lg shadow-primary/20 transition-transform hover:scale-105"
      >
        <GraduationCap className="w-6 h-6 text-white" />
      </Link>

      {/* Nav Items */}
      <nav className="flex flex-col gap-1 flex-1" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary/50',
                isActive
                  ? 'sidebar-item-active text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              )}
            >
              <item.icon className="w-5 h-5" aria-hidden="true" />

              {/* Tooltip */}
              <span className="absolute left-full ml-3 px-3 py-1.5 rounded-lg bg-card border border-white/10 text-xs font-medium text-foreground whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-[60]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
