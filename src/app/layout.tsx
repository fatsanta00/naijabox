import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NaijaBox | A box full of things to do',
  description: 'Games, quizzes, weird questions, useful tools and things you probably didn’t know you needed.',
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
    <html lang="en">
      <body className="min-h-screen bg-naija-ink text-gray-100 antialiased selection:bg-brand-500 selection:text-white">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-500 focus:text-white focus:rounded-lg focus:font-bold focus:shadow-xl focus:outline-none"
        >
          Skip to main content
        </a>
        <div id="main-content">{children}</div>
      </body>
    </html>
  );
}
