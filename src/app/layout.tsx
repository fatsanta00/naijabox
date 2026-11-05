import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider, themeInitScript } from '@/components/theme/ThemeProvider';

const siteUrl = process.env.SITE_URL || 'https://naijabox.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'NaijaBox | A box full of things to do',
    template: '%s | NaijaBox',
  },
  description: 'Games, quizzes, weird questions, useful tools and things you probably didn’t know you needed. 100% free with no login required.',
  openGraph: {
    title: 'NaijaBox | A box full of things to do',
    description: 'Games, quizzes, weird questions, useful tools and things you probably didn’t know you needed.',
    url: siteUrl,
    siteName: 'NaijaBox',
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NaijaBox | A box full of things to do',
    description: 'Games, quizzes, weird questions, useful tools and things you probably didn’t know you needed.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-naija-ink text-naija-text antialiased selection:bg-brand-500 selection:text-white">
        <ThemeProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-500 focus:text-white focus:rounded-lg focus:font-bold focus:shadow-xl focus:outline-none"
          >
            Skip to main content
          </a>
          <div id="main-content">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
