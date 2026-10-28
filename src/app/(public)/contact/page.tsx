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
    <div className="min-h-screen bg-naija-ink flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-16 space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Contact Us</h1>
          <p className="text-sm text-naija-muted mt-2">
            Have an idea for a new box, feedback on a question, or want to partner with us? Reach out!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email Direct */}
          <Card className="p-6 space-y-4 border-naija-border/80 bg-naija-surface flex flex-col justify-between">
            <div className="space-y-2">
              <div className="text-2xl">📬</div>
              <h2 className="text-lg font-bold text-white">General Inquiries & Feedback</h2>
              <p className="text-xs text-gray-300 leading-relaxed">
                For questions about our games, press inquiries, or general Nigerian banter, drop us an email anytime.
              </p>
            </div>
            <div className="pt-2">
              <a
                href={`mailto:${contactEmail}`}
                className="inline-flex items-center justify-center w-full px-4 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-bold text-sm min-h-[44px] transition-colors"
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
              <h2 className="text-lg font-bold text-white">Submit New Content</h2>
              <p className="text-xs text-gray-300 leading-relaxed">
                Got a hilarious Nigerian Would You Rather dilemma, slang term, or personality quiz idea? You can submit directly from any box!
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/#boxes"
                className="inline-flex items-center justify-center w-full px-4 py-3 rounded-xl bg-naija-card hover:bg-naija-border border border-naija-border/80 text-white font-bold text-sm min-h-[44px] transition-colors"
              >
                Explore Boxes & Submit
              </Link>
              <p className="text-[11px] text-naija-muted mt-2 text-center">
                Submissions are reviewed by moderators before publishing.
              </p>
            </div>
          </Card>

          {/* Business & Brand Sponsorships */}
          <Card className="p-6 space-y-4 border-naija-border/80 bg-naija-surface flex flex-col justify-between">
            <div className="space-y-2">
              <div className="text-2xl">🤝</div>
              <h2 className="text-lg font-bold text-white">Sponsorships & PriceCheck Partners</h2>
              <p className="text-xs text-gray-300 leading-relaxed">
                Want to sponsor a box edition or list your verified store catalog on Naija PriceCheck? Let&apos;s talk.
              </p>
            </div>
            <div className="pt-2">
              <a
                href={`mailto:${contactEmail}?subject=Partnership%20Inquiry%20-%20NaijaBox`}
                className="inline-flex items-center justify-center w-full px-4 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm min-h-[44px] transition-colors"
              >
                Partnership Inquiries
              </a>
              <p className="text-[11px] text-naija-muted mt-2 text-center">
                All brand placements are transparently labelled.
              </p>
            </div>
          </Card>

          {/* Open Source & Bug Reports */}
          <Card className="p-6 space-y-4 border-naija-border/80 bg-naija-surface flex flex-col justify-between">
            <div className="space-y-2">
              <div className="text-2xl">🐛</div>
              <h2 className="text-lg font-bold text-white">Report a Bug or Problem</h2>
              <p className="text-xs text-gray-300 leading-relaxed">
                Found a typo, broken button, or incorrect fact in a quiz? Report it directly during play or submit an issue.
              </p>
            </div>
            <div className="pt-2">
              <a
                href={`mailto:${contactEmail}?subject=Bug%20Report%20-%20NaijaBox`}
                className="inline-flex items-center justify-center w-full px-4 py-3 rounded-xl bg-naija-card hover:bg-naija-border border border-naija-border/80 text-white font-bold text-sm min-h-[44px] transition-colors"
              >
                Report an Issue
              </a>
              <p className="text-[11px] text-naija-muted mt-2 text-center">
                Include screenshots and your device type if possible.
              </p>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
