'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  BookOpen, 
  Brain, 
  Newspaper, 
  User, 
  Settings, 
  LogOut, 
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  user?: {
    name?: string;
    email?: string;
    avatarUrl?: string;
  };
}

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/notes', icon: BookOpen, label: 'Study Notes' },
  { href: '/quiz', icon: Brain, label: 'Practice Quiz' },
  { href: '/current-affairs', icon: Newspaper, label: 'Current Affairs' },
];

const bottomNavItems = [
  { href: '/profile', icon: User, label: 'Profile' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const NavLink = ({ href, icon: Icon, label }: { href: string; icon: typeof Home; label: string }) => {
    const isActive = pathname === href || pathname.startsWith(`${href}/`);
    
    return (
      <Link
        href={href}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
          isActive 
            ? 'bg-primary text-primary-foreground shadow-sm' 
            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
          isCollapsed && 'justify-center px-2'
        )}
        onClick={() => setIsMobileOpen(false)}
      >
        <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary-foreground')} />
        {!isCollapsed && <span className="font-medium">{label}</span>}
      </Link>
    );
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-3 py-4 border-b border-border',
        isCollapsed && 'justify-center'
      )}>
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        {!isCollapsed && (
          <span className="text-lg font-bold text-foreground">UPSC Master</span>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>

      {/* User Info */}
      {user && !isCollapsed && (
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
              {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="p-3 space-y-1 border-t border-border">
        {bottomNavItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
        
        <button
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl w-full transition-all duration-200',
            'text-muted-foreground hover:bg-destructive/10 hover:text-destructive',
            isCollapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="font-medium">Sign Out</span>}
        </button>
      </div>

      {/* Collapse Toggle (Desktop) */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden md:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-background border border-border items-center justify-center shadow-sm hover:bg-accent transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 md:hidden',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex fixed top-0 left-0 z-30 h-full bg-card border-r border-border flex-col transition-all duration-300 relative',
          isCollapsed ? 'w-[72px]' : 'w-64'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}

export function SidebarSpacer({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className={cn(
      'hidden md:block flex-shrink-0 transition-all duration-300',
      collapsed ? 'w-[72px]' : 'w-64'
    )} />
  );
}