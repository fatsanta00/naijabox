import { notFound } from 'next/navigation';
import { getBoxBySlug, getAllBoxes } from '@/boxes/registry';
import React, { Suspense } from 'react';
import type { Metadata } from 'next';

interface BoxPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllBoxes().map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: BoxPageProps): Promise<Metadata> {
  const { slug } = await params;
  const box = getBoxBySlug(slug);
  if (!box) return { title: 'Box Not Found | NaijaBox' };

  return {
    title: `${box.title} | NaijaBox`,
    description: box.tagline,
    openGraph: {
      title: box.title,
      description: box.tagline,
      type: 'website',
      images: [`/api/og/box/${slug}`],
    },
  };
}

export default async function BoxPage({ params }: BoxPageProps) {
  const { slug } = await params;
  const box = getBoxBySlug(slug);

  if (!box) {
    notFound();
  }

  const BoxComponent = React.lazy(box.component);

  return (
    <main className="min-h-screen bg-naija-ink text-white flex flex-col items-center justify-start p-4 sm:p-6">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center p-12 text-naija-muted">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent mb-4" />
            <p>Opening the box...</p>
          </div>
        }
      >
        <BoxComponent slug={box.slug} title={box.title} />
      </Suspense>
    </main>
  );
}
