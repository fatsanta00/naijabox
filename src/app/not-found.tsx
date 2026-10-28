import Link from 'next/link';
import { Card, Button } from '@/components/ui';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-naija-ink flex flex-col">
      <Header />
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
        <Card className="p-8 sm:p-12 space-y-6 border-naija-border/80 bg-naija-surface w-full">
          <div className="text-6xl">📦❓</div>
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
              404 Error • Page Not Found
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white pt-2">
              You Don Enter Bush!
            </h1>
            <p className="text-sm text-gray-300 leading-relaxed max-w-md mx-auto">
              This page doesn&apos;t exist — yet. Maybe NEPA took the link, or the road you follow lead to dead end.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="primary" className="w-full min-h-[44px]">
                Back to NaijaBox Home
              </Button>
            </Link>
            <Link href="/#boxes" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full min-h-[44px]">
                Explore All Boxes →
              </Button>
            </Link>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
