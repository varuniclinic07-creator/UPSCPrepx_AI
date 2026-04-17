'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Search, Bell, LogOut, Settings, User, Flame, Star, HelpCircle } from 'lucide-react';

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
  const [searchFocused, setSearchFocused] = React.useState(false);
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
        'fixed top-0 right-0 left-0 lg:left-20 z-40 flex items-center justify-between px-6 md:px-8 py-4 command-navbar',
        scrolled && 'scrolled'
      )}
    >
      {/* Search */}
      <div
        id="global-search"
        className={cn(
          'hidden md:flex items-center gap-3 rounded-full px-4 py-2.5 w-80 transition-all duration-200',
          'bg-white/5 border border-white/10',
          searchFocused && 'bg-white/10 border-blue-500/50 ring-2 ring-blue-500/20'
        )}
      >
        <Search className="w-4 h-4 text-white/40" />
        <input
          className="flex-1 bg-transparent border-none text-white placeholder:text-white/30 text-sm focus:outline-none"
          placeholder="Search anything..."
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-white/40 font-mono">
          <span className="text-xs">&#8984;</span>K
        </kbd>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Gamification Stats */}
        <div className="hidden lg:flex items-center gap-4 mr-2">
          {/* Streak */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
            <span className="text-sm font-semibold text-white/80">12</span>
          </div>
          {/* XP */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Star className="w-4 h-4 text-yellow-400" />
            </div>
            <span className="text-sm font-semibold text-white/80">2,450</span>
          </div>
        </div>

        {/* Help */}
        <button className="p-2.5 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all">
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <button className="relative p-2.5 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
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
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white text-sm font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="hidden md:block text-sm font-medium text-white/80">
              {user.name}
            </span>
          </button>

          {/* Dropdown menu */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl py-2 z-50">
              <div className="px-4 py-2 border-b border-white/5">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-white/40 truncate">{user.email}</p>
              </div>
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                onClick={() => setShowUserMenu(false)}
              >
                <User className="w-4 h-4" />
                Profile
              </Link>
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                onClick={() => setShowUserMenu(false)}
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <div className="border-t border-white/5 mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-white/60 hover:text-red-400 hover:bg-red-500/5 transition-colors"
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
