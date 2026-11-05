# DECISIONS (ADRs)

The PRD fixes product behaviour. These records cover implementation choices the PRD left open (PRD section 33). Format: Context, Decision, Consequences. Status is Accepted unless noted. Add new ADRs at the bottom; never silently change an accepted one, supersede it.

---

## ADR-001: Next.js (App Router) + TypeScript
**Context:** Needs server-rendered, shareable pages with OG images, fast mobile loads, SEO and an admin area, deployable without a proprietary runtime.
**Decision:** Next.js App Router with TypeScript, self-hosted via Docker.
**Consequences:** One codebase for public site, admin and API. Avoid Vercel-only features so it stays portable.

## ADR-002: PostgreSQL
**Context:** Relational content, moderation states, aggregates and price history.
**Decision:** PostgreSQL, with JSONB for per-question-type option/scoring payloads.
**Consequences:** Strong aggregation for stats; JSON payloads validated in code (Zod).

## ADR-003: Drizzle ORM
**Context:** Need typed schema and SQL-first migrations.
**Decision:** Drizzle with generated migrations in `drizzle/`.
**Consequences:** Migrations are committed. `pnpm db:migrate` runs on deploy.

## ADR-004: Tailwind CSS, minimal UI dependencies
**Context:** Mobile first, small bundles, custom playful look.
**Decision:** Tailwind plus a small in-repo component set. No heavy UI kit or animation library.
**Consequences:** Faster loads; design tokens defined once in the Tailwind config.

## ADR-005: Auth only for /admin (Auth.js credentials)
**Context:** PRD requires no login for public use; the owner needs a secure dashboard.
**Decision:** Auth.js credentials provider with a single seeded owner account; `role` column allows future moderators. Middleware protects `/admin/*` and `/api/admin/*`.
**Consequences:** No public sign-up. Public accounts later extend the same user table.

## ADR-006: Docker-based self-hosting
**Context:** PRD forbids dependence on a proprietary builder/runtime.
**Decision:** `Dockerfile` + `docker-compose.yml` (app, db). Any VPS or container host works.
**Consequences:** Hosting provider is swappable.

## ADR-007: Anonymous session cookie
**Context:** Need no-repeat questions, response dedupe, personal bests and repeat-visitor analytics without accounts.
**Decision:** First-party random `nb_sid` cookie plus localStorage mirror for bests. No IPs stored with content.
**Consequences:** Stats are anonymous. Clearing cookies resets bests. Mentioned in the privacy page.

## ADR-008: Stats aggregation with a minimum sample size
**Context:** PRD forbids fabricated or premature statistics.
**Decision:** Aggregates computed from real `responses`/`reaction_results`; public endpoints return data only when `total >= MIN_STATS_SAMPLE` (default 30, env-configurable). Aggregates refreshed by a scheduled job (every few minutes) or on-demand with short caching.
**Consequences:** New questions show no percentages at first; UI shows a "be one of the first" state instead.

## ADR-009: Reports flag, admin decides
**Context:** PRD requires a Report action surfacing in admin.
**Decision:** Reports never auto-hide content. A report count threshold may highlight a question in the queue, but only admin unpublishes.
**Consequences:** Prevents abuse of reports to remove content; requires admin attention.

## ADR-010: PriceCheck ingestion via adapters
**Context:** PRD doesn't say where price data comes from, and scraping has legal and reliability risk.
**Decision:** V1 uses admin entry, CSV import and affiliate/partner feeds behind a `PriceSource` adapter interface. Every price shows source and last-updated date. Scraping third-party sites is out of V1 scope unless a later ADR covers terms of service and legal review.
**Consequences:** Data starts small and curated. Trust is prioritised over coverage.

## ADR-011: Ads behind `<AdSlot>`
**Context:** PRD requires no tight coupling to one ad provider and no intrusive ads.
**Decision:** Single `AdSlot` component with provider adapters and placement rules (result and listing screens only, never during gameplay, no interstitials).
**Consequences:** Providers swappable; disabled by default in dev.

## ADR-012: First-party analytics events
**Context:** PRD requires built-in experience and question-level analytics.
**Decision:** Own `events` table via batched `sendBeacon`, using the spec in `ANALYTICS_EVENTS.md`. Third-party tools can be added through `lib/analytics.ts`.
**Consequences:** Full control of funnel queries; storage grows and needs retention (default 13 months raw, then aggregate).

## ADR-013: Result sharing via stored result records
**Context:** Shared links must deep-link to a result with a good preview.
**Decision:** On completion, store a `results` row (score, label, box slug, display text) and share `/r/<id>`; OG image rendered by `next/og`.
**Consequences:** Results are public by id (unguessable nanoid) and contain no personal data.

## ADR-014: Spam protection for submissions
**Context:** Anonymous submissions invite spam.
**Decision:** Honeypot field, per-session and per-hashed-IP rate limits, length limits, basic duplicate check. CAPTCHA only if abuse appears (new ADR).
**Consequences:** Low friction for real contributors.

## ADR-015: Content language and tone
**Context:** Copy is part of the brand.
**Decision:** Natural Nigerian English with light Pidgin; avoid stereotypes. Seed content is written to this tone and reviewed by the owner before publishing.
**Consequences:** Seed data stays small and flagged `source = 'seed'`.

## ADR-016: Single owner admin account at launch
**Context:** Need initial admin authentication without unnecessary complexity.
**Decision:** Single seeded owner account created via environment variables / seed script; `users.role` enum allows moderators in future.
**Consequences:** Simple initial operations with zero signup sprawl; owner has full administrative access.

## ADR-017: Ads disabled by default at launch
**Context:** Ad monetization requires ad networks/direct sponsors which may not be active on day 1.
**Decision:** Ads are disabled by default (`NEXT_PUBLIC_ADS_ENABLED=false`). `<AdSlot>` abstraction safely renders nothing when disabled or placeholder in dev test mode.
**Consequences:** Fast, clean launch experience with zero layout shift or broken ad requests.

## ADR-018: Typographic text wordmark placeholder
**Context:** Custom branding/logo asset is pending design finalization.
**Decision:** Use a clean, playful modern typographic wordmark with custom styling rather than waiting on SVG logo files.
**Consequences:** Matches the "modern internet design + Nigerian personality" tone without blocking launch.

## ADR-019: PriceCheck data via manual entry and CSV import
**Context:** Automated scraping has reliability and legal hurdles.
**Decision:** PriceCheck V1 is populated via admin manual entry and structured CSV import adapter.
**Consequences:** High-quality, verified price intelligence from launch without fragile scrapers.

## ADR-020: Optional public player accounts
**Context:** Users want to optionally save their scores, track play history, view active streaks, and favourite experiences across sessions and devices, while anonymous play remains 100% accessible and ungated.
**Decision:** Extend the `users` table with `role: 'player'` and optional `name`. Extend `sessions` with `userId` linked upon login/register. Add `user_favourites` table for favourited box experiences. Public auth APIs (`/api/public/auth/register`, `/api/public/auth/login`, `/api/public/auth/logout`, `/api/public/auth/me`, `/api/public/auth/favourites`) issue an HTTP-only player session cookie (`nb_user_token`). Anonymous sessions (`nb_sid`) continue operating without any gating or account requirement.
**Consequences:** Players who choose to create an account gain cross-device persistence and an `/account` dashboard. Anonymous players remain completely unaffected with zero login friction.


