import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact Us | NaijaBox',
  description: 'Get in touch with the NaijaBox team for feedback, questions, sponsorships, and bug reports.',
};

export default function ContactPage() {
  const contactEmail = process.env.CONTACT_EMAIL || 'hello@naijabox.app';

  return (
    <div className="min-h-screen bg-naija-ink flex flex-col transition-colors duration-200">
      <Header />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-16 space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-naija-text tracking-tight">Contact Us</h1>
          <p className="text-sm text-naija-muted mt-2">
            Have an idea for a new box, feedback on a question, or want to partner with us? Reach out!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email Direct */}
          <Card className="p-6 space-y-4 border-naija-border/80 bg-naija-surface flex flex-col justify-between">
            <div className="space-y-2">
              <div className="text-2xl">📬</div>
              <h2 className="text-lg font-bold text-naija-text">General Inquiries & Feedback</h2>
              <p className="text-xs text-naija-muted leading-relaxed">
                For questions about our games, press inquiries, or general banter, drop us an email anytime.
              </p>
            </div>
            <div className="pt-2">
              <a
                href={`mailto:${contactEmail}`}
                className="inline-flex items-center justify-center w-full px-4 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-naija-text font-bold text-sm min-h-[44px] transition-colors"
              >
                {contactEmail}
              </a>
              <p className="text-[11px] text-naija-muted mt-2 text-center">
                We typically respond within 24–48 hours.
              </p>
            </div>
          </Card>

          {/* Submissions & Content */}
          <Card className="p-6 space-y-4 border-naija-border/80 bg-naija-surface flex flex-col justify-between">
            <div className="space-y-2">
              <div className="text-2xl">💡</div>
              <h2 className="text-lg font-bold text-naija-text">Submit Content & Questions</h2>
              <p className="text-xs text-naija-muted leading-relaxed">
                Want to suggest questions, new slang definitions, or funny dilemmas? You can submit directly from within each box or ping our editorial team.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/#boxes"
                className="inline-flex items-center justify-center w-full px-4 py-3 rounded-xl bg-naija-card hover:bg-naija-cardSubtle text-naija-text font-semibold text-sm min-h-[44px] border border-naija-border transition-colors"
              >
                Explore Boxes to Submit &rarr;
              </Link>
              <p className="text-[11px] text-naija-muted mt-2 text-center">
                Every box has a direct &quot;Submit a Question&quot; button.
              </p>
            </div>
          </Card>
        </div>

        {/* Partnership & Ads Card */}
        <Card className="p-6 sm:p-8 space-y-4 border-naija-border/80 bg-naija-surface">
          <div className="space-y-2">
            <span className="text-xs uppercase font-bold tracking-wider text-brand-600 dark:text-brand-600 dark:text-brand-300">
              Partnerships & Sponsorships
            </span>
            <h2 className="text-xl font-bold text-naija-text">Sponsor a Box or Feature Your Brand</h2>
            <p className="text-sm text-naija-muted leading-relaxed">
              Reach engaged, culturally attuned Nigerians across Lagos, Abuja, Port Harcourt, and the diaspora. We offer clean, non-intrusive brand placements on completion screens and dedicated cultural editions.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <a
              href={`mailto:${contactEmail}?subject=Sponsorship%20Inquiry%20-%20NaijaBox`}
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-naija-text font-bold text-sm min-h-[44px] transition-colors"
            >
              Request Partnership Kit &rarr;
            </a>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
