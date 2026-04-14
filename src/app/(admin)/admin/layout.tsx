/**
 * Admin Dashboard Layout
 * Enterprise-grade layout with sidebar navigation
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Cpu,
  Activity,
  Settings,
  Menu,
  X,
  Shield,
  FileText,
  Video,
  MessageSquare,
  BarChart3,
  Database,
  AlertCircle,
  LogOut,
  TrendingUp,
  DollarSign,
  Wallet,
  Brain,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Console', href: '/admin/console', icon: Activity },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'ML Analytics', href: '/admin/ml-analytics', icon: Brain },
  { name: 'Business', href: '/admin/business', icon: TrendingUp },
  { name: 'AI Cost', href: '/admin/ai-cost', icon: DollarSign },
  { name: 'Billing', href: '/admin/billing', icon: Wallet },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Users Analytics', href: '/admin/users-analytics', icon: Activity },
  { name: 'Revenue', href: '/admin/revenue-analytics', icon: CreditCard },
  { name: 'AI Usage', href: '/admin/ai-usage', icon: Cpu },
  { name: 'Conversion', href: '/admin/conversion', icon: FileText },
  { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
  { name: 'AI Providers', href: '/admin/ai-providers', icon: Cpu },
  { name: 'Queue Status', href: '/admin/queue', icon: Activity },
  { name: 'Content', href: '/admin/content', icon: FileText },
  { name: 'Hermes', href: '/admin/hermes', icon: Cpu },
  { name: 'Source Intel', href: '/admin/source-intelligence', icon: Database },
  { name: 'Knowledge Graph', href: '/admin/knowledge-base', icon: Database },
  { name: 'AI Videos', href: '/admin/ai-videos', icon: Video },
  { name: 'Feedback', href: '/admin/feedback', icon: MessageSquare },
  { name: 'System Health', href: '/admin/system', icon: Database },
  { name: 'Feature Flags', href: '/admin/features', icon: Shield },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-saffron-600" />
              <span className="text-lg font-bold text-gray-900">UPSC Admin</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-saffron-50 text-saffron-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-saffron-600' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
              <div className="w-8 h-8 rounded-full bg-saffron-100 flex items-center justify-center">
                <span className="text-saffron-700 font-bold text-sm">A</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
                <p className="text-xs text-gray-500 truncate">admin@upsc.ai</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-2 w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center h-16 px-4 bg-white border-b border-gray-200 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            {/* Health indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-green-700">All Systems Operational</span>
            </div>

            {/* Alerts */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100">
              <AlertCircle className="w-5 h-5 text-gray-500" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
