'use client';

import * as React from 'react';
import { CommandSidebar } from './command-sidebar';
import { CommandNavbar } from './command-navbar';
import { TutorialProvider } from '@/contexts/tutorial-context';
import { TutorialModal } from '@/components/tutorial/tutorial-modal';

interface CommandCenterShellProps {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    role?: string;
    avatarUrl?: string;
  };
}

export function CommandCenterShell({ children, user }: CommandCenterShellProps) {
  return (
    <TutorialProvider>
      <div className="min-h-screen relative">
        {/* Ambient background */}
        <div className="ambient-bg" aria-hidden="true" />
        <div className="ambient-noise" aria-hidden="true" />

        {/* Sidebar */}
        <CommandSidebar />

        {/* Navbar */}
        <CommandNavbar user={user} />

        {/* Main content */}
        <main className="relative z-10 lg:pl-20 pt-16 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-10 pb-24 lg:pb-10">
            {children}
          </div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 h-16 flex items-center justify-around bg-card/90 backdrop-blur-xl border-t border-white/5">
          <MobileNavLink href="/dashboard" label="Home" />
          <MobileNavLink href="/dashboard/notes" label="Notes" />
          <MobileNavLink href="/dashboard/planner" label="Plan" />
          <MobileNavLink href="/dashboard/profile" label="Profile" />
        </nav>

        <TutorialModal />
      </div>
    </TutorialProvider>
  );
}

function MobileNavLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      <span className="text-sm font-medium">{label}</span>
    </a>
  );
}
