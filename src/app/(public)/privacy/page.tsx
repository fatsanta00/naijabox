import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | NaijaBox',
  description: 'How NaijaBox respects your privacy with anonymous sessions, first-party analytics, and zero tracking.',
};

export default function PrivacyPage() {
  const contactEmail = process.env.CONTACT_EMAIL || 'hello@naijabox.app';

  return (
    <div className="min-h-screen bg-naija-ink flex flex-col transition-colors duration-200">
      <Header />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-16 space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-naija-text tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-naija-muted mt-2">Last updated: October 2026</p>
        </div>

        <Card className="space-y-6 text-sm text-naija-muted leading-relaxed p-6 sm:p-8 border-naija-border/80 bg-naija-surface">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-naija-text">1. Core Philosophy: Privacy by Design</h2>
            <p>
              NaijaBox is built for fun, cultural games, and Nigerian curiosity. We strongly believe you should not need to trade your personal identity or hand over your private data to enjoy casual internet experiences.
            </p>
            <p>
              You do <strong>not</strong> need to register an account, log in, provide your phone number, or disclose your email address to play any game, answer quizzes, or view price guides on NaijaBox.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-naija-text">2. Anonymous Session Cookie (<code className="text-brand-600 dark:text-brand-600 dark:text-brand-400 font-mono">nb_sid</code>)</h2>
            <p>
              When you load NaijaBox, we set an anonymous, random session cookie named <code className="text-brand-600 dark:text-brand-600 dark:text-brand-400 font-mono">nb_sid</code>.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-naija-muted">
              <li><strong>What it does:</strong> Remembers which questions you have answered within your active session so we do not repeat them to you, and ensures one vote per dilemma in Would You Rather to prevent vote stuffing.</li>
              <li><strong>What it does NOT do:</strong> It contains zero personal identifiable information (PII), is never shared with third-party data brokers, and cannot be used to track you across other websites.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-naija-text">3. Zero IP Address Logging</h2>
            <p>
              We do <strong>not</strong> store your IP address in our databases. Incoming IP addresses are used purely to deliver the web response over TCP/IP and are immediately discarded. In cases where abuse mitigation is required (such as submission rate limiting), a one-way cryptographically salted hash is generated temporarily and never stored alongside your gameplay responses.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-naija-text">4. First-Party Analytics & Data Retention</h2>
            <p>
              We operate our own lightweight first-party event analytics pipeline. We collect anonymous aggregated gameplay events (e.g. <em>box_opened</em>, <em>experience_completed</em>, <em>result_shared</em>) to understand which boxes people enjoy most and identify confusing questions.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-naija-muted">
              <li><strong>Device Classification:</strong> We classify your browser viewport into broad categories (e.g., <em>mobile</em>, <em>tablet</em>, <em>desktop</em>) to ensure our responsive layout performs well on all screen sizes.</li>
              <li><strong>Traffic Sources:</strong> We record aggregate referrers (e.g., <em>WhatsApp</em>, <em>X/Twitter</em>, <em>Instagram</em>, <em>Direct</em>) to measure how our community shares results.</li>
              <li><strong>Retention Policy:</strong> Raw individual gameplay events are retained for a maximum of 13 months, after which they are permanently rolled up into anonymized daily counts and question response totals.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-naija-text">5. Third-Party Trackers & Advertising</h2>
            <p>
              NaijaBox contains zero third-party behavioral ad trackers or invasive surveillance scripts. We do not load Facebook Pixels, Google Tag Manager advertising tags, or programmatic cookie-syncing networks.
            </p>
            <p>
              Any future advertising or sponsorships follow our non-intrusive principles: all paid listings or sponsored boxes are clearly labelled &quot;Sponsored&quot; or &quot;Promoted&quot;, and no ads are ever rendered during active gameplay.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-naija-text">6. Community Submissions & Reporting</h2>
            <p>
              If you submit a question, dilemma, or slang definition to the community, you may optionally provide a display name for credit attribution or choose to remain completely anonymous. Submitted questions undergo moderation before publication.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-naija-text">7. Contact Information</h2>
            <p>
              If you have any questions or concerns regarding our privacy practices or your data, please reach out to us at{' '}
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
