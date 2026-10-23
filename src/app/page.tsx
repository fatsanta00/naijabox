import { getAllBoxes } from '@/boxes/registry';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Chip } from '@/components/ui';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import Link from 'next/link';

export default function HomePage() {
  const boxes = getAllBoxes();

  return (
    <div className="min-h-screen bg-naija-ink flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 sm:py-16 space-y-12 sm:space-y-16">
        {/* Hero Section */}
        <section className="text-center space-y-4 max-w-2xl mx-auto pt-4 sm:pt-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium">
            <span>✨</span> Fresh experiences inside
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
            What&apos;s inside <br />
            <span className="text-brand-500 underline decoration-wavy decoration-brand-500/40">
              the box?
            </span>
          </h1>
          <p className="text-base sm:text-lg text-naija-muted leading-relaxed">
            Games, quizzes, weird questions, useful tools and things you probably didn&apos;t know you needed.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#boxes"
              className="w-full sm:w-auto h-12 min-h-[48px] px-8 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-base inline-flex items-center justify-center shadow-lg shadow-brand-500/25 active:scale-95 transition-all"
            >
              Explore NaijaBox
            </a>
            <Link
              href="/boxes/how-nigerian"
              className="w-full sm:w-auto h-12 min-h-[48px] px-6 rounded-xl bg-naija-card hover:bg-naija-border text-gray-200 font-semibold text-sm inline-flex items-center justify-center border border-naija-border active:scale-95 transition-all"
            >
              Take the Culture Test &rarr;
            </Link>
          </div>
        </section>

        {/* Box Grid Section */}
        <section id="boxes" className="space-y-6 pt-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 border-b border-naija-border/60 pb-3">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">The Box Grid</h2>
              <p className="text-xs sm:text-sm text-naija-muted">
                Pick a box. Every experience is interactive, mobile-friendly and fast.
              </p>
            </div>
            <span className="text-xs text-brand-400 font-medium">
              {boxes.length} Experiences Available
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {boxes.map((box) => (
              <Link key={box.slug} href={`/boxes/${box.slug}`} className="group block focus:outline-none">
                <Card
                  interactive
                  className="h-full flex flex-col justify-between group-hover:border-brand-500/60"
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <Chip variant="default" size="sm" className="capitalize">
                        {box.kind}
                      </Chip>
                      {box.badge && (
                        <Chip variant="brand" size="sm">
                          {box.badge}
                        </Chip>
                      )}
                    </div>
                    <CardTitle className="group-hover:text-brand-400 transition-colors">
                      {box.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{box.tagline}</CardDescription>
                  </CardContent>
                  <div className="px-5 pb-5 pt-3 flex items-center justify-between text-xs text-brand-400 font-semibold border-t border-naija-border/40 mt-3">
                    <span>Open Box</span>
                    <span className="transform group-hover:translate-x-1 transition-transform">
                      &rarr;
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
