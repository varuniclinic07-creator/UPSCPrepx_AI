import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/auth-config';
import { DashboardShell } from '@/components/layout/dashboard-shell';

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD LAYOUT - Server Component with Robust Error Handling
// Following nextjs-pro.md: "Explicit Error Handling in Server Components"
// ═══════════════════════════════════════════════════════════════════════════

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      redirect('/login');
    }

    return (
      <DashboardShell
        user={{
          name: user.name || 'User',
          email: user.email,
          role: user.role || 'Member',
          avatarUrl: user.avatarUrl || undefined,
        }}
      >
        {children}
      </DashboardShell>
    );
  } catch (error) {
    // Log the error for debugging
    console.error('[Dashboard Layout] Error:', error);

    // If it's an auth error, redirect to login
    if (error instanceof Error && error.message.includes('not configured')) {
      // Configuration error - throw to show error boundary
      throw new Error(`Configuration error: ${error.message}`);
    }

    // For other errors, redirect to login as a safe fallback
    redirect('/login');
  }
}