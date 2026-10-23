import { notFound } from 'next/navigation';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, Button } from '@/components/ui';
import { ShareBar } from '@/components/sharing/ShareBar';
import Link from 'next/link';
import type { Metadata } from 'next';

interface QuestionPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: QuestionPageProps): Promise<Metadata> {
  const { id } = await params;
  const [q] = await db
    .select({ text: schema.questions.text })
    .from(schema.questions)
    .where(eq(schema.questions.id, id))
    .limit(1);

  if (!q) {
    return { title: 'Question | NaijaBox' };
  }

  return {
    title: `${q.text} | NaijaBox`,
    description: 'Vote and see community percentages on NaijaBox!',
    openGraph: {
      title: q.text,
      description: 'Vote and see what Nigerians chose!',
      images: [`/api/og/question/${id}`],
    },
    twitter: {
      card: 'summary_large_image',
      title: q.text,
      description: 'Vote and see what Nigerians chose!',
      images: [`/api/og/question/${id}`],
    },
  };
}

export default async function QuestionDeepLinkPage({ params }: QuestionPageProps) {
  const { id } = await params;
  const [q] = await db.select().from(schema.questions).where(eq(schema.questions.id, id)).limit(1);

  if (!q || q.status !== 'published') {
    notFound();
  }

  const [exp] = await db
    .select({ key: schema.experiences.key, title: schema.experiences.title })
    .from(schema.experiences)
    .where(eq(schema.experiences.id, q.experienceId))
    .limit(1);

  const slug = exp?.key || 'would-you-rather';
  const options = Array.isArray(q.options) ? q.options : [];

  return (
    <div className="min-h-screen bg-naija-ink flex flex-col">
      <Header />
      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            {exp?.title || 'Question'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">{q.text}</h1>
          {q.explanation && (
            <p className="text-sm text-naija-muted italic">&quot;{q.explanation}&quot;</p>
          )}
        </div>

        <div className="space-y-3">
          {(options as Array<{ id: string; text: string }>).map((opt) => (
            <Link key={opt.id} href={`/boxes/${slug}`}>
              <Card interactive className="p-4 sm:p-5 mb-3 text-center border-naija-border">
                <span className="font-bold text-white text-base sm:text-lg">{opt.text}</span>
              </Card>
            </Link>
          ))}
        </div>

        <div className="pt-2 text-center">
          <Link href={`/boxes/${slug}`}>
            <Button variant="primary" size="lg" fullWidth>
              Play Full Game &rarr;
            </Button>
          </Link>
        </div>

        <div className="pt-4 border-t border-naija-border/60">
          <ShareBar
            title={q.text}
            text={`What do you pick? "${q.text}"`}
            url={`https://naijabox.app/q/${q.id}`}
            experienceKey={slug}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
