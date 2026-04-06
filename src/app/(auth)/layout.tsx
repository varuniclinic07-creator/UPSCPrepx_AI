import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { AuroraBackground } from '@/components/magic-ui/aurora-background';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuroraBackground className="min-h-screen flex flex-col">
      {/* Premium Header */}
      <header className="p-6">
        <Link href="/" className="flex items-center gap-3 w-fit group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-foreground tracking-tight">UPSC CSE Master</span>
            <span className="text-xs text-muted-foreground font-medium tracking-wider uppercase">AI Powered Prep</span>
          </div>
        </Link>
      </header>

      {/* Auth Content */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        {children}
      </main>

      {/* Premium Footer */}
      <footer className="p-6 text-center">
        <p className="text-sm text-muted-foreground">
          © 2026 UPSC CSE Master. Powered by AI.
        </p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <Link href="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Privacy Policy
          </Link>
          <span className="text-muted-foreground/30">•</span>
          <Link href="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Terms of Service
          </Link>
          <span className="text-muted-foreground/30">•</span>
          <Link href="/contact" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Contact
          </Link>
        </div>
      </footer>
    </AuroraBackground>
  );
}