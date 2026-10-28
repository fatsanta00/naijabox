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
    <div className="min-h-screen bg-naija-ink flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-16 space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Terms of Service</h1>
          <p className="text-sm text-naija-muted mt-2">Effective Date: October 2026</p>
        </div>

        <Card className="space-y-6 text-sm text-gray-300 leading-relaxed p-6 sm:p-8 border-naija-border/80 bg-naija-surface">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing or using NaijaBox (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please discontinue use of the platform immediately.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">2. Free & Anonymous Platform Use</h2>
            <p>
              NaijaBox is provided as a free entertainment, educational, and cultural platform. No registration or login credentials are required for public access. You are granted a personal, revocable, non-exclusive license to play our games, participate in voting, and share your results on social platforms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">3. User-Submitted Content & Intellectual Property</h2>
            <p>
              When you submit questions, slang definitions, options, or price quotes via our community submission forms:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-300">
              <li>You represent and warrant that the submission is your original work or you have the legal right to share it.</li>
              <li>You grant NaijaBox a perpetual, worldwide, irrevocable, royalty-free license to publish, adapt, format, translate, and distribute your submission across the platform and our social channels.</li>
              <li>You acknowledge that all submissions are subject to editorial review and moderation before publication. NaijaBox reserves the right to reject, edit, or remove any submission at its sole discretion.</li>
              <li>Submissions must not contain hate speech, ethnic discrimination, defamatory claims, sexual violence, or infringing copyrighted material.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">4. Naija PriceCheck & Shopping Guides</h2>
            <p>
              PriceCheck provides market estimates and seller listings gathered from manual surveys, partner feeds, and community contributions.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-300">
              <li>Prices, product availability, and vendor conditions fluctuate constantly in the Nigerian retail market. Prices displayed are informational estimates only and do not constitute a binding offer from NaijaBox or any third-party merchant.</li>
              <li>We do not sell physical goods or process customer payments directly on NaijaBox. Always verify seller credentials and inspect items before transferring funds.</li>
              <li>All paid advertisements, sponsored vendor listings, and promoted placements are explicitly marked as &quot;Sponsored&quot; or &quot;Promoted&quot;.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">5. Acceptable Use Policy</h2>
            <p>
              You agree not to engage in any activity that interferes with or disrupts the Service, including but not limited to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-300">
              <li>Automated scraping, crawling, or data extraction without prior written authorization.</li>
              <li>Scripted vote stuffing or flooding submissions to distort community statistics.</li>
              <li>Attempting to bypass authentication mechanisms protecting the administrative areas (<code className="text-brand-400 font-mono">/admin</code>).</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">6. Disclaimer of Warranties & Limitation of Liability</h2>
            <p>
              The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, whether express or implied. To the fullest extent permissible by law, NaijaBox and its operators shall not be liable for any direct, indirect, incidental, special, or consequential damages arising out of your use or inability to use the Service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">7. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria, without regard to conflict of law provisions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">8. Changes to Terms</h2>
            <p>
              We may revise these Terms from time to time. The updated date at the top of this document indicates when changes were last made. Continued use of the platform after updates signifies acceptance of the revised Terms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">9. Inquiries</h2>
            <p>
              Questions regarding these Terms may be directed to{' '}
              <a href={`mailto:${contactEmail}`} className="text-brand-400 hover:underline font-semibold">
                {contactEmail}
              </a>
              {' '}or via our <Link href="/contact" className="text-brand-400 hover:underline">Contact page</Link>.
            </p>
          </section>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
