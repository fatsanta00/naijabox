import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | NaijaBox',
  description: 'Terms and conditions governing the use of NaijaBox games, content submissions, and price guides.',
};

export default function TermsPage() {
  const contactEmail = process.env.CONTACT_EMAIL || 'hello@naijabox.app';

  return (
    <div className="min-h-screen bg-naija-ink flex flex-col transition-colors duration-200">
      <Header />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-16 space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-naija-text tracking-tight">Terms of Service</h1>
          <p className="text-sm text-naija-muted mt-2">Effective Date: October 2026</p>
        </div>

        <Card className="space-y-6 text-sm text-naija-muted leading-relaxed p-6 sm:p-8 border-naija-border/80 bg-naija-surface">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-naija-text">1. Acceptance of Terms</h2>
            <p>
              By accessing or using NaijaBox (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please discontinue use of the platform immediately.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-naija-text">2. Free & Anonymous Platform Use</h2>
            <p>
              NaijaBox is provided as a free entertainment, educational, and cultural platform. No registration or login credentials are required for public access. You are granted a personal, revocable, non-exclusive license to play our games, participate in voting, and share your results on social platforms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-naija-text">3. User-Submitted Content & Intellectual Property</h2>
            <p>
              When you submit questions, slang definitions, options, or price quotes via our community submission forms:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-naija-muted">
              <li>You represent and warrant that the submission is your original work or you have the legal right to share it.</li>
              <li>You grant NaijaBox a perpetual, worldwide, irrevocable, royalty-free license to publish, adapt, format, translate, and distribute your submission across the platform and our social channels.</li>
              <li>You acknowledge that all submissions are subject to editorial review and moderation before publication. NaijaBox reserves the right to reject, edit, or remove any submission at its sole discretion.</li>
              <li>Submissions must not contain hate speech, ethnic discrimination, defamatory claims, sexual violence, or infringing copyrighted material.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-naija-text">4. Naija PriceCheck & Shopping Guides</h2>
            <p>
              PriceCheck provides market estimates and seller listings gathered from manual surveys, partner feeds, and community contributions.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-naija-muted">
              <li>Prices, product availability, and vendor conditions fluctuate constantly in the Nigerian retail market. Prices displayed are informational estimates only and do not constitute a binding offer from NaijaBox or any third-party merchant.</li>
              <li>We do not sell physical goods or process customer payments directly on NaijaBox. Always verify seller credentials and inspect items before transferring funds.</li>
              <li>All paid advertisements, sponsored vendor listings, and promoted placements are explicitly marked as &quot;Sponsored&quot; or &quot;Promoted&quot;.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-naija-text">5. Limitation of Liability</h2>
            <p>
              NaijaBox is provided &quot;as is&quot; without warranties of any kind. We do not guarantee uninterrupted availability, error-free operation, or that community answers reflect professional advice.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-naija-text">6. Contact Information</h2>
            <p>
              For legal inquiries or questions regarding these terms, please contact us at{' '}
              <a href={`mailto:${contactEmail}`} className="text-brand-600 dark:text-brand-600 dark:text-brand-400 hover:underline font-semibold">
                {contactEmail}
              </a>
              {' '}or visit our <Link href="/contact" className="text-brand-600 dark:text-brand-600 dark:text-brand-400 hover:underline">Contact page</Link>.
            </p>
          </section>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
