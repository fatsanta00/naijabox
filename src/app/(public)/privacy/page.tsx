import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | NaijaBox',
  description: 'How NaijaBox respects your privacy with anonymous sessions and zero tracking.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-naija-ink flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-16 space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-naija-muted mt-2">Last updated: September 2026</p>
        </div>

        <Card className="space-y-4 text-sm text-gray-300 leading-relaxed p-6 sm:p-8">
          <h2 className="text-xl font-bold text-white">1. No User Accounts Required</h2>
          <p>
            You can use NaijaBox completely anonymously. We do not require registration, phone numbers, or email addresses to play games, take quizzes, or use our tools.
          </p>

          <h2 className="text-xl font-bold text-white">2. Anonymous Session Identifiers</h2>
          <p>
            We use an anonymous random session cookie (<code className="text-brand-400 font-mono">nb_sid</code>) so the app remembers which questions you have already answered in a session and doesn&apos;t repeat them, and to prevent duplicate votes in Would You Rather. This cookie does not identify you personally.
          </p>

          <h2 className="text-xl font-bold text-white">3. Zero IP Logging</h2>
          <p>
            In accordance with our strict privacy commitment, NaijaBox does not store IP addresses in our analytics or response databases. Analytics track aggregate metrics like device class (mobile vs desktop) and general traffic sources (e.g. WhatsApp shares).
          </p>

          <h2 className="text-xl font-bold text-white">4. User Submissions</h2>
          <p>
            When you submit a question or prompt, you can choose to provide an optional display name for public attribution or submit anonymously.
          </p>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
