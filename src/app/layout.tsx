import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Inter, Noto_Sans_Devanagari } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

// Display font - Space Grotesk for headings & branding
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
  weight: ['300', '400', '500', '600', '700'],
});

// Body font - Inter for clean readability
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700'],
});

// Hindi font support
const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  display: 'swap',
  variable: '--font-hindi',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://upscbyvarunsh.aimasteryedu.in'),
  title: {
    default: 'UPSC CSE Master - AI-Powered UPSC Preparation',
    template: '%s | UPSC CSE Master',
  },
  description: 'Master UPSC Civil Services Examination with AI-powered study notes, quizzes, and current affairs. Smart preparation for IAS, IPS, IFS aspirants.',
  keywords: ['UPSC', 'CSE', 'IAS', 'Civil Services', 'UPSC Preparation', 'Study Notes', 'Quiz', 'Current Affairs'],
  authors: [{ name: 'UPSC CSE Master' }],
  creator: 'UPSC CSE Master',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'UPSC CSE Master',
    title: 'UPSC CSE Master - AI-Powered UPSC Preparation',
    description: 'Master UPSC Civil Services Examination with AI-powered study notes, quizzes, and current affairs.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'UPSC CSE Master',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UPSC CSE Master - AI-Powered UPSC Preparation',
    description: 'Master UPSC Civil Services Examination with AI-powered study notes, quizzes, and current affairs.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`dark ${spaceGrotesk.variable} ${inter.variable} ${notoSansDevanagari.variable}`}>
      <head>
        {/* Material Symbols for icons */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '1rem',
              backdropFilter: 'blur(12px)',
            },
          }}
        />
      </body>
    </html>
  );
}