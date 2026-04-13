'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Search, Bell, LogOut, Settings, User } from 'lucide-react';

interface CommandNavbarProps {
  user: {
    name: string;
    email: string;
    role?: string;
    avatarUrl?: string;
  };
}

export function CommandNavbar({ user }: CommandNavbarProps) {
  const router = useRouter();
  const [scrolled, setScrolled] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 left-20 z-40 h-16 flex items-center justify-between px-8 command-navbar',
        scrolled && 'scrolled'
      )}
    >
      {/* Search */}
      <div className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 w-80 cursor-pointer hover:bg-white/8 transition-colors">
        <Search className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground flex-1">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-muted-foreground font-mono">
          <span className="text-xs">&#8984;</span>K
        </kbd>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2.5 rounded-xl hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary))]" />
        </button>

        {/* User avatar + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-white/5 transition-colors"
          >
            {user.avatarUrl ? (
              <div
                className="w-8 h-8 rounded-lg bg-cover bg-center border border-white/10"
                style={{ backgroundImage: `url(${user.avatarUrl})` }}
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-sm font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="hidden md:block text-sm font-medium text-foreground">
              {user.name}
            </span>
          </button>

          {/* Dropdown menu */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-card/95 backdrop-blur-xl border border-white/10 shadow-2xl py-2 z-50">
              <div className="px-4 py-2 border-b border-white/5">
                <p className="text-sm font-medium text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                onClick={() => setShowUserMenu(false)}
              >
                <User className="w-4 h-4" />
                Profile
              </Link>
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                onClick={() => setShowUserMenu(false)}
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <div className="border-t border-white/5 mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
