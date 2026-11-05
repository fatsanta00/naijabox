import { notFound } from 'next/navigation';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { ResultLayout } from '@/components/layout/ResultLayout';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import type { Metadata } from 'next';

interface ResultPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ResultPageProps): Promise<Metadata> {
  const { id } = await params;
  const [res] = await db.select().from(schema.results).where(eq(schema.results.id, id)).limit(1);

  if (!res) {
    return { title: 'Result | NaijaBox' };
  }

  return {
    title: `${res.label} | NaijaBox Result`,
    description: res.displayText,
    openGraph: {
      title: `I got: ${res.label} on NaijaBox!`,
      description: res.displayText,
      images: [`/api/og/result/${id}`],
    },
    twitter: {
      card: 'summary_large_image',
      title: `I got: ${res.label} on NaijaBox!`,
      description: res.displayText,
      images: [`/api/og/result/${id}`],
    },
  };
}

export default async function ResultDeepLinkPage({ params }: ResultPageProps) {
  const { id } = await params;
  const [res] = await db.select().from(schema.results).where(eq(schema.results.id, id)).limit(1);

  if (!res) {
    notFound();
  }

  const [exp] = await db
    .select({ key: schema.experiences.key, title: schema.experiences.title })
    .from(schema.experiences)
    .where(eq(schema.experiences.id, res.experienceId))
    .limit(1);

  const slug = exp?.key || 'how-nigerian';

  return (
    <div className="min-h-screen bg-naija-ink flex flex-col transition-colors duration-200">
      <Header />
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center">
        <ResultLayout
          currentSlug={slug}
          title={exp?.title || 'NaijaBox'}
          resultScore={res.score ? `${res.score}%` : undefined}
          resultLabel={res.label}
          resultDescription={res.displayText}
          resultId={res.id}
          shareUrl={`https://naijabox.app/r/${res.id}`}
        />
      </main>
      <Footer />
    </div>
  );
}
