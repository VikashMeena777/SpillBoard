import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import { fontVariables } from '@/lib/fonts';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SITE } from '@/lib/constants';

export const metadata: Metadata = {
  /* metadataBase was missing, so every relative OG/twitter URL resolved wrong. */
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description:
    'Anonymous confessions, rated 0–100°F by a savage AI editor. File your spill, get a verdict, print the front page.',
  applicationName: SITE.name,
  keywords: [
    'anonymous confession',
    'spill tea',
    'gossip board',
    'ai tea rating',
    'viral confessions',
    'gen-z secrets',
  ],
  authors: [{ name: SITE.name }],
  openGraph: {
    title: `${SITE.name} — ${SITE.tagline}`,
    description:
      'Anonymous confessions, rated 0–100°F by a savage AI editor. No name, no trace, no mercy.',
    url: SITE.url,
    siteName: SITE.name,
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} — ${SITE.tagline}`,
    description: 'Anonymous confessions, rated 0–100°F by a savage AI editor.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F0EDE4' },
    { media: '(prefers-color-scheme: dark)', color: '#0E0E0F' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /* suppressHydrationWarning is required: next-themes writes the class on <html> before paint. */
    <html lang="en" suppressHydrationWarning className={fontVariables}>
      <body className="min-h-dvh font-body antialiased">
        <ThemeProvider>
          {/* Keyboard users could not previously bypass the nav + marquee. */}
          <a
            href="#main"
            className="sr-only-focusable fixed left-4 top-4 z-[100] border-2 border-ink bg-marker px-4 py-2 font-ui text-sm font-bold text-marker-ink shadow-stamp"
          >
            Skip to main content
          </a>

          <div className="flex min-h-dvh flex-col">
            <Navbar />
            <main id="main" className="flex-1">
              {children}
            </main>
            <Footer />
          </div>

          <Toaster
            position="bottom-center"
            toastOptions={{
              className:
                'font-ui !rounded-none !border-2 !border-ink !bg-paper-raised !text-ink !shadow-stamp',
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
