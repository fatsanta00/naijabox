# TASKS

Work in phase order. Tick tasks as they complete: `- [x]`. Each task has acceptance criteria (AC). Per-task definition of done is in `AGENTS.md`.

## Phase 0: Foundation

- [x] **0.1 Repo scaffold.** Next.js + TypeScript + Tailwind + pnpm, ESLint, Prettier, Vitest, Playwright.
  AC: `pnpm dev`, `pnpm lint`, `pnpm typecheck`, `pnpm test` all run clean.
- [x] **0.2 Docker and env.** `Dockerfile`, `docker-compose.yml` (app + Postgres), `.env.example`.
  AC: `docker compose up -d db` works; app builds in Docker.
- [x] **0.3 Database schema.** Drizzle schema for content, play data, moderation, PriceCheck, events, users (`DATA_MODEL.md`), initial migration, `db:migrate`, `db:seed`.
  AC: migration applies on a clean DB; seed inserts categories and a few clearly flagged `source = 'seed'` questions per experience.
- [x] **0.4 Design tokens and base UI.** Colours, type, spacing, Card, Button, Chip, ProgressBar, 44px tap targets.
  AC: tokens documented; works at 360px; reduced-motion respected.
- [x] **0.5 Box registry.** `BoxDefinition`, `registry.ts`, lazy-loaded box route `/boxes/[slug]`.
  AC: a dummy box can be added by creating one folder and one registry line.
- [x] **0.6 Session and analytics client.** `nb_sid` cookie, `lib/analytics.ts`, `POST /api/public/events`.
  AC: `page_view` recorded in `events`; no IP stored.

## Phase 1: Shared content system and admin

- [x] **1.1 Question service.** `getSessionSet` with random/ordered, count, difficulty, no repeats in a session.
  AC: unit tests cover no-repeat, count limits, empty pool.
- [x] **1.2 Public content API.** Published-only questions, answer recording, stats endpoint honouring `MIN_STATS_SAMPLE`.
  AC: draft/pending/rejected never returned; stats return `{available:false}` below threshold.
- [x] **1.3 Admin auth.** Auth.js credentials, seeded owner, middleware on `/admin` and `/api/admin`.
  AC: unauthenticated requests get 401/redirect; public site has no login UI.
- [x] **1.4 Admin question CRUD.** List, filters, create/edit per question type, publish/unpublish, delete, reorder.
  AC: change appears on public site with no deploy.
- [x] **1.5 Admin categories, tags, experience settings.**
  AC: add a category in admin and use it immediately; toggle random vs ordered and count per experience.
- [x] **1.6 Submission pipeline.** Public submit form, validation, honeypot, rate limit, status `pending`.
  AC: submitted question is invisible publicly until approved.
- [x] **1.7 Moderation queue.** Approve, Edit & Approve, Reject, Delete, flags, reviewer log.
  AC: full state machine from `DATA_MODEL.md` enforced and tested.
- [x] **1.8 Reporting.** Report button, reasons, admin report queue, dismiss/action.
  AC: report never auto-hides a question.

## Phase 2: Shell and sharing

- [x] **2.1 Homepage.** Header + mobile menu, hero ("What's inside the box?"), box grid from registry.
  AC: first-time visitor understands the product above the fold at 360px.
- [x] **2.2 ResultLayout.** Result → Share → Try Again → Recommended → Back to the Box.
  AC: all boxes use it; no dead ends.
- [x] **2.3 Sharing.** ShareBar (WhatsApp, X, Facebook, copy link, native share, save image), `/r/[id]`, `/q/[id]`, OG images via `next/og`.
  AC: shared link opens the exact result/question with a correct preview.
- [x] **2.4 AdSlot abstraction.** Provider adapter, placement rules, disabled by default.
  AC: no ads render during gameplay screens.
- [x] **2.5 Static pages and SEO basics.** About, privacy, sitemap generated from registry, robots, metadata.

## Phase 3: Launch boxes

- [x] **3.1 How Nigerian Are You?** Personality scoring, result bands from experience settings.
- [x] **3.2 Naija Would You Rather.** Voting, one vote per session, stats gate, share a question.
- [x] **3.3 Nigerian Slang Quiz.** Difficulty levels, instant feedback, humorous result labels.
- [x] **3.4 Reaction Time.** State machine, too-soon handling, personal best, daily challenge, percentile gated by real data.
- [x] **3.5 Random Decision Maker.** Presets, custom options, playful pick animation.
- [x] **3.6 Guess the Price.** Guess input, reveal, diff, streak and best, CTA to PriceCheck.
- [x] **3.7 Naija PriceCheck.** Search, product page, listings, history chart, good-price check, paid labels, admin entry and CSV import (ADR-010).
  AC per box: works at 360px; analytics events from `ANALYTICS_EVENTS.md`; post-experience layout; submit/report where it uses questions.

## Phase 4: Analytics and admin insight

- [x] **4.1 Aggregation job.** `question_stats`, `price_snapshots`, refresh schedule.
- [x] **4.2 Admin analytics dashboard.** Most opened box, funnels, completion, shares, top questions, traffic, device.
  AC: "Which box gets opened the most?" answered in one view.
- [x] **4.3 Question performance view.** Response rate and answer distribution per question.

## Phase 5: Hardening and launch

- [x] **5.1 Accessibility pass.** Keyboard, focus, labels, contrast, screen reader checks on all boxes.
- [x] **5.2 Performance pass.** Bundle budget, image optimisation, LCP target on mid-range Android 4G.
- [x] **5.3 E2E tests.** Playwright at 360px for each box, submit → approve flow, share deep links.
- [x] **5.4 Security pass.** Rate limits, input validation, admin hardening, secrets, headers.
- [x] **5.5 Content seeding.** Owner reviews and publishes launch content via admin.
- [x] **5.6 Deploy.** Production Docker deploy, migrations, nightly backups, uptime check.
  AC: V1 success criteria in `PRD.md` section 32 verified on a real phone.

## Phase 6: Launch-Readiness & Extensions

### Step 2: Launch-Readiness

- [x] **2.1 Deployment Infrastructure.** `/api/health` route, `docker-compose.production.yml`, `Caddyfile`, `scripts/backup.sh`, `docs/DEPLOY.md`, updated `.env.example`.
  AC: health endpoint returns `{"status":"ok","db":"connected","ts":"..."}`, production compose runs app+db+caddy, DEPLOY.md covers full VPS setup.

- [x] **2.2 Admin Account Safety.** `scripts/create-owner.ts` CLI script, warning in seed.ts, DEPLOY.md updated.
  AC: script creates owner only if none exists; refuses and warns if owner already present.

- [x] **2.3 Legal and Trust Pages.** Update privacy page, create terms and contact pages, footer links, `.env.example` CONTACT_EMAIL, PriceCheck sponsored label note.
  AC: /privacy, /terms, /contact all render; footer includes Terms and Contact links.

- [x] **2.4 SEO and Sharing Polish.** Fix `metadataBase`, verify sitemap covers all boxes + static pages, per-box `generateMetadata`, `robots.ts`.
  AC: `metadataBase` uses `SITE_URL` env var; sitemap includes all pages; OG metadata correct per box.

- [x] **2.5 Content Review Tooling.** Admin questions `?source=seed` filter, bulk actions (Publish/Unpublish/Delete Selected), `/admin/content-health` page and API.
  AC: content health shows Warning (<10) / Critical (<5) per experience; bulk actions work.

- [x] **2.6 Error Handling.** Custom `not-found.tsx` (404), `error.tsx` (500), hide boxes with 0 published questions from homepage.
  AC: 404/500 pages have branding and links; boxes with empty pools not shown on homepage.

- [x] **2.7 Security and Abuse.** Admin login rate limiting (10 attempts / 5 min / IP-hash), Playwright `e2e/security.spec.ts` for headers + auth enforcement.
  AC: security headers present; `/api/admin/questions` returns 401 without auth; rate limit enforced.

- [ ] **2.8 Performance and Accessibility.** `pnpm build` bundle size note, Lighthouse score estimates in PROGRESS.md, aria/heading/contrast fixes.
  AC: PROGRESS.md has Lighthouse estimates; all a11y issues fixed.

- [ ] **2.9 Extended E2E Tests.** Extend `e2e/boxes.spec.ts`: submit→moderate flow, stats gate, paid label enforcement, decision-maker end screen.
  AC: new e2e tests pass for moderation submission, stats gate, sponsored labels, ResultLayout elements.

### Step 3: Phase 6 — Extensions

- [ ] **3.1 Admin Moderators.** `/api/admin/users` route, `/admin/users` page, middleware role-based access, admin nav role visibility.
  AC: owner can create/delete moderators; moderators can access moderation but not user/settings pages.

- [ ] **3.2 Searchable Slang Dictionary.** `/slang` page, `/slang/[term]` detail page, `/api/public/slang` and `/api/public/slang/[term]` routes, link from slang-quiz, sitemap.
  AC: all published slang-quiz questions browsable; JSON-LD DefinedTerm schema; SSR; SEO metadata.

- [ ] **3.3 Sponsorship Editions.** `/api/admin/sponsors` + `/api/admin/sponsorships` routes, `/admin/sponsors` page, `SponsorBadge` component, ResultLayout integration, analytics events.
  AC: sponsor badge shows on result screens; never during gameplay; `sponsor_impression`/`sponsor_click` events fired; ANALYTICS_EVENTS.md updated.

- [ ] **3.4a Which Nigerian Food Are You? box.** `src/boxes/food-personality/index.tsx`, registered as `food-personality`, 15 seeded questions, full box contract.
  AC: box playable; analytics events fire; ResultLayout; 360px; 44px targets.

- [ ] **3.4b Nigerian Excuse Generator box.** `src/boxes/excuse-generator/index.tsx`, registered as `excuse-generator`, 30 seeded excuse items, share excuse text.
  AC: box playable; generates excuse from DB; share works; analytics events fire.

- [ ] **3.4c Higher or Lower (prices) box.** `src/boxes/higher-or-lower/index.tsx`, registered as `higher-or-lower`, reuses pricecheck products, 5 rounds, score at end.
  AC: box playable; uses real product data; analytics events fire; ResultLayout.

- [ ] **3.4d Football Trivia box.** `src/boxes/football-trivia/index.tsx`, registered as `football-trivia`, 20 seeded questions, difficulty levels.
  AC: box playable; difficulty filtering works; analytics events fire; ResultLayout.

- [ ] **3.5 Optional Public Accounts.** `user_id` nullable column in sessions, `/api/public/auth/register` + `/api/public/auth/login`, `/account` page, anonymous play still works fully.
  AC: users can register/login; saved scores shown; anonymous play unaffected.

## Open questions for the owner

- Admin login: single owner account only at launch, or add moderators? (Phase 6 adds moderators)
- Which ad provider (if any) at launch?
- Launch domain and branding assets (logo/wordmark) available?
- Initial PriceCheck data source: manual, CSV, or a specific retailer partner?
