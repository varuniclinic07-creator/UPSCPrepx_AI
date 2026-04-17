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
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', shortcut: 'H' },
  { icon: BookOpen, label: 'Study Notes', href: '/dashboard/notes', shortcut: 'S' },
  { icon: Brain, label: 'Practice Quiz', href: '/dashboard/quiz', shortcut: 'Q' },
  { icon: Newspaper, label: 'Current Affairs', href: '/dashboard/current-affairs', shortcut: 'C' },
  { icon: Video, label: 'Video Lectures', href: '/dashboard/videos', shortcut: 'V' },
  { icon: FileText, label: 'Materials', href: '/dashboard/materials', shortcut: 'M' },
  { icon: Calendar, label: 'Study Planner', href: '/dashboard/planner', shortcut: 'P' },
  { icon: Star, label: 'Bookmarks', href: '/dashboard/bookmarks', shortcut: 'B' },
  { icon: Map, label: 'Mind Maps', href: '/dashboard/mindmaps', shortcut: 'N' },
  { icon: RotateCcw, label: 'Revision', href: '/dashboard/revision', shortcut: 'R' },
];

export function CommandSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col items-center w-20 fixed left-0 top-0 h-full z-50 py-6 gap-2 command-sidebar">
      {/* Logo */}
      <Link
        href="/dashboard"
        className="mb-6 flex items-center justify-center w-12 h-12 rounded-xl bg-white shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-transform hover:scale-105"
      >
        <span className="text-black text-lg font-display font-bold">P</span>
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
                'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
                isActive
                  ? 'sidebar-item-active text-white'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              )}
            >
              <item.icon className="w-5 h-5" aria-hidden="true" />

              {/* Tooltip with keyboard shortcut */}
              <span className="absolute left-full ml-3 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-[60] flex items-center gap-2">
                {item.label}
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-white/60 font-mono">
                  {item.shortcut}
                </kbd>
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
