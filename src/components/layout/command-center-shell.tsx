'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { CommandSidebar } from './command-sidebar';
import { CommandNavbar } from './command-navbar';
import { TutorialProvider } from '@/contexts/tutorial-context';
import { TutorialModal } from '@/components/tutorial/tutorial-modal';
import { LayoutDashboard, BookOpen, Calendar, User } from 'lucide-react';

interface CommandCenterShellProps {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    role?: string;
    avatarUrl?: string;
  };
}

const mobileNavItems = [
  { icon: LayoutDashboard, label: 'Home', href: '/dashboard' },
  { icon: BookOpen, label: 'Notes', href: '/dashboard/notes' },
  { icon: Calendar, label: 'Plan', href: '/dashboard/planner' },
  { icon: User, label: 'Profile', href: '/dashboard/profile' },
];

export function CommandCenterShell({ children, user }: CommandCenterShellProps) {
  return (
    <TutorialProvider>
      <div className="min-h-screen relative bg-black">
        {/* Ambient background — decorative blur orbs */}
        <div className="ambient-bg" aria-hidden="true" />
        <div className="ambient-noise" aria-hidden="true" />

        {/* Extra decorative orbs for depth */}
        <div
          className="fixed top-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none z-0"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
          aria-hidden="true"
        />

        {/* Sidebar */}
        <CommandSidebar />

        {/* Navbar */}
        <CommandNavbar user={user} />

        {/* Main content */}
        <main className="relative z-10 lg:pl-20 pt-20 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-10 pb-24 lg:pb-10">
            {children}
          </div>
        </main>

        {/* Mobile bottom nav */}
        <MobileNav />

        <TutorialModal />
      </div>
    </TutorialProvider>
  );
}

function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 h-16 flex items-center justify-around bg-black/90 backdrop-blur-xl border-t border-white/5">
      {mobileNavItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all',
              isActive
                ? 'text-white'
                : 'text-white/40 hover:text-white/60'
            )}
          >
            <item.icon className={cn('w-5 h-5', isActive && 'text-blue-400')} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
