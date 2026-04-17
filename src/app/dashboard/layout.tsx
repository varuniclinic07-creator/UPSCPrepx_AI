import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/auth-config';
import { CommandCenterShell } from '@/components/layout/command-center-shell';
import { WelcomeSplash } from '@/components/brand/welcome-splash';

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

    const firstName = (user.name || '').split(' ')[0];

    return (
      <>
        <WelcomeSplash greetingName={firstName || undefined} />
        <CommandCenterShell
          user={{
            name: user.name || 'User',
            email: user.email,
            role: user.role || 'Member',
            avatarUrl: user.avatarUrl || undefined,
          }}
        >
          {children}
        </CommandCenterShell>
      </>
    );
  } catch (error) {
    // Log the error for debugging
    console.error('[Dashboard Layout] Error:', error);

    // Never re-throw in Server Components — always redirect gracefully.
    // The redirect() function throws a Next.js internal error that must propagate.
    redirect('/login');
  }
}