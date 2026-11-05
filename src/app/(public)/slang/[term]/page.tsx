import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { SlangService } from '@/server/services/slangService';
import { Card, Button } from '@/components/ui';

interface PageProps {
  params: Promise<{ term: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { term } = await params;
  const slang = await SlangService.getTermBySlug(term);

  if (!slang) {
    return { title: 'Slang Term Not Found — NaijaBox' };
  }

  const baseUrl = process.env.SITE_URL || 'https://naijabox.app';

  return {
    title: `${slang.term} — Meaning, Origin & Context | Nigerian Slang Dictionary`,
    description: `What does "${slang.term}" mean in Nigeria? ${slang.meaning}. Explore authentic meaning, cultural usage, and examples on NaijaBox.`,
    alternates: {
      canonical: `${baseUrl}/slang/${slang.slug}`,
    },
    openGraph: {
      title: `${slang.term} — Nigerian Slang Meaning | NaijaBox`,
      description: `${slang.term}: ${slang.meaning}. Learn authentic Nigerian pidgin and street slang context.`,
      url: `${baseUrl}/slang/${slang.slug}`,
      type: 'article',
    },
  };
}

export default async function SlangDetailPage({ params }: PageProps) {
  const { term } = await params;
  const slang = await SlangService.getTermBySlug(term);

  if (!slang) {
    notFound();
  }

  const allTerms = await SlangService.getAllTerms();
  const otherTerms = allTerms
    .filter((t) => t.slug !== slang.slug)
    .slice(0, 4);

  const baseUrl = process.env.SITE_URL || 'https://naijabox.app';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: slang.term,
    description: slang.meaning,
    inDefinedTermSet: `${baseUrl}/slang`,
    url: `${baseUrl}/slang/${slang.slug}`,
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6 animate-in fade-in duration-200">
      {/* Schema.org DefinedTerm JSON-LD for rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb / Back nav */}
      <div className="flex items-center gap-2 text-xs text-naija-muted">
        <Link href="/slang" className="hover:text-naija-text transition-colors">
          &larr; Back to Slang Dictionary
        </Link>
        <span>•</span>
        <span className="capitalize">{slang.category}</span>
      </div>

      {/* Main Term Card */}
      <Card className="p-6 sm:p-8 space-y-6 border-brand-500/40 bg-naija-surface">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-300 font-semibold border border-brand-500/30 uppercase tracking-wider">
              {slang.category}
            </span>
            {slang.difficulty && (
              <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-naija-card text-naija-muted border border-naija-border">
                Level: {slang.difficulty}
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-naija-text tracking-tight">
            {slang.term}
          </h1>
        </div>

        {/* Meaning Box */}
        <div className="space-y-2 pt-2 border-t border-naija-border/60">
          <h2 className="text-xs font-bold uppercase tracking-wider text-naija-muted">
            Definition & Meaning
          </h2>
          <p className="text-base sm:text-lg text-naija-text font-medium leading-relaxed">
            {slang.meaning}
          </p>
        </div>

        {/* Context / Explanation Box */}
        {slang.explanation && (
          <div className="space-y-2 p-4 rounded-xl bg-naija-cardSubtle border border-naija-border/70">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Cultural Context & Usage
            </h3>
            <p className="text-sm text-naija-muted leading-relaxed italic">
              &ldquo;{slang.explanation}&rdquo;
            </p>
          </div>
        )}

        {/* Attribution */}
        {slang.authorName && slang.showAttribution && (
          <div className="text-xs text-naija-muted">
            Submitted by community member: <span className="text-naija-text font-semibold">{slang.authorName}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-naija-border/60">
          <Link href="/boxes/slang-quiz" className="flex-1">
            <Button variant="primary" size="default" fullWidth>
              🎯 Test Your Slang in Quiz
            </Button>
          </Link>
          <Link href="/slang" className="flex-1">
            <Button variant="secondary" size="default" fullWidth>
              📖 Browse More Slangs
            </Button>
          </Link>
        </div>
      </Card>

      {/* Related / Other Slangs */}
      {otherTerms.length > 0 && (
        <div className="space-y-3 pt-4">
          <h3 className="text-sm font-bold text-naija-text tracking-tight">
            Other Popular Naija Slangs
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {otherTerms.map((t) => (
              <Link key={t.id} href={`/slang/${t.slug}`} className="group block focus:outline-none">
                <Card interactive className="p-3.5 h-full flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-naija-text group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-colors">
                      {t.term}
                    </h4>
                    <p className="text-xs text-naija-muted line-clamp-1 mt-1">
                      {t.meaning}
                    </p>
                  </div>
                  <span className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold mt-2 inline-block">
                    View &rarr;
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
