import { Metadata } from 'next';
import Link from 'next/link';
import { SlangService } from '@/server/services/slangService';
import { SlangDictionaryClient } from './SlangDictionaryClient';
import { Card } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Nigerian Slang Dictionary — NaijaBox',
  description:
    'Explore the ultimate dictionary of Nigerian slang, pidgin expressions, street lingo, and their authentic meanings. Curated directly from Nigerian pop culture and street wisdom.',
  openGraph: {
    title: 'Nigerian Slang Dictionary — NaijaBox',
    description:
      'Search Nigerian street words, pidgin slang, and urban meanings with cultural context and examples.',
    type: 'website',
  },
};

export default async function SlangDictionaryPage() {
  const terms = await SlangService.getAllTerms();

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <span className="inline-block text-xs uppercase tracking-wider px-3 py-1 rounded-full bg-brand-500/15 text-brand-300 font-semibold border border-brand-500/30">
          🇳🇬 Urban Naija Vocabulary
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Nigerian Slang Dictionary
        </h1>
        <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto leading-relaxed">
          From street corners in Mushin to Twitter NG timelines: decode authentic Nigerian pidgin, street lingo, and cultural expressions.
        </p>
      </div>

      {/* Quiz Cross-Promotion Card */}
      <Card className="p-4 sm:p-5 bg-gradient-to-r from-brand-950/40 via-naija-surface to-brand-950/20 border-brand-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5 justify-center sm:justify-start">
            <span>🔥</span> Think you know Naija slang?
          </h2>
          <p className="text-xs text-naija-muted">
            Put your street credibility to the test with our interactive quiz.
          </p>
        </div>
        <Link
          href="/boxes/slang-quiz"
          className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-bold text-xs transition-colors whitespace-nowrap min-h-[44px] inline-flex items-center"
        >
          Take the Slang Quiz &rarr;
        </Link>
      </Card>

      {/* Interactive Searchable Dictionary */}
      <SlangDictionaryClient terms={terms} />
    </div>
  );
}
