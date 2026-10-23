import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About NaijaBox | The Story Behind the Box',
  description: 'NaijaBox is a collection of games, quizzes, cultural tools, and funny Nigerian experiences.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-naija-ink flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-16 space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">About NaijaBox</h1>
          <p className="text-sm text-naija-muted mt-2">
            A box full of things to do. Built for the culture, internet humour, and curious minds.
          </p>
        </div>

        <Card className="space-y-4 text-sm text-gray-300 leading-relaxed p-6 sm:p-8">
          <h2 className="text-xl font-bold text-white">What is NaijaBox?</h2>
          <p>
            NaijaBox started with a simple question: why do Nigerians always have to adapt foreign quizzes, games, and price trackers when our own everyday life, humour, and economy are so uniquely chaotic and fun?
          </p>
          <p>
            Inside the box, you&apos;ll find personality quizzes that actually understand what it means when NEPA takes light during a match, street slang tests that separate those who are officially outside from those who need orientation, and real price tools for navigating current tech and gadget markets in Nigeria.
          </p>

          <h3 className="text-lg font-bold text-white pt-2">Our Core Principles</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-400">
            <li><strong className="text-white">No sign-up wall:</strong> Everything is open, instant, and anonymous.</li>
            <li><strong className="text-white">Honest data:</strong> Community stats and comparisons only come from real recorded plays. No fake percentages.</li>
            <li><strong className="text-white">Community powered:</strong> You can submit questions directly to any box. Once reviewed by our team, they join the rotation.</li>
            <li><strong className="text-white">Mobile-first:</strong> Built to fly on mobile phones and save data.</li>
          </ul>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
