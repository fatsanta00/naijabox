# NaijaBox Build Progress

This document tracks execution progress, verification steps, and learnings across all phases (Phase 0 to Phase 5).

---

### Phase 0: Foundation

- **Task 0.1: Repo scaffold**
  - **What was built:** Next.js 15 (App Router), React 19, TypeScript 5, Tailwind CSS 3 with custom tokens, pnpm v12 setup, ESLint, Prettier, Vitest with `@testing-library/react`, Playwright configuration (including mobile 360px viewport).
  - **Verification:** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm dev`, and `pnpm build` all pass cleanly with zero warnings or errors. Initial JS payload for homepage is ~105 kB (within the <120 kB target).
  - **Learnings:** pnpm v12 requires build scripts approval in `pnpm-workspace.yaml`. On Windows, Next.js standalone tracing requires symlinks which need elevation unless running in Docker/Linux; made standalone output conditional on `BUILD_STANDALONE=true` for Docker builds.

- **Task 0.3: Database schema**
  - **What was built:** Complete Drizzle ORM schema (`src/server/db/schema.ts`) covering all tables in `DATA_MODEL.md` (experiences, categories, tags, question_tags, questions, sessions, responses, results, reaction_results, question_stats, question_reports, products, sellers, listings, price_snapshots, users, events, sponsors, sponsorships, settings). Migration runner (`scripts/migrate.ts`), drizzle config (`drizzle.config.ts`), generated migration SQL (`drizzle/0000_greedy_proudstar.sql`), and comprehensive Nigerian seed script (`scripts/seed.ts`) with 80+ original questions flagged `source = 'seed'`.
  - **Verification:** `drizzle-kit generate` successfully generated the complete migration with all 20 tables, enums, and indexes. `pnpm typecheck`, `pnpm lint`, and `pnpm test` all pass cleanly.
  - **Learnings:** Handled string escaping in seed data; verified all question option and scoring payloads conform to the schema specifications.

- **Task 0.4: Design tokens and base UI**
  - **What was built:** Complete Tailwind CSS design system with brand colors and dark surface tokens, plus core UI components in `src/components/ui/` (`Button`, `Card`, `Chip`, `ProgressBar`). Ensured 44px minimum tap targets across all interactive variants, accessible ARIA attributes on progress bars, and `prefers-reduced-motion` animations handling in CSS.
  - **Verification:** Vitest unit tests in `src/components/ui/ui.test.tsx` verifying 44px min touch targets and accessibility; `pnpm typecheck` and `pnpm lint` pass clean.
  - **Learnings:** Added `class-variance-authority` for robust variant management.

- **Task 0.5: Box registry**
  - **What was built:** `BoxDefinition` interface in `src/boxes/types.ts`, centralized registry in `src/boxes/registry.ts` with all 7 launch experiences, helper functions (`getBoxBySlug`, `getAllBoxes`, `getRecommendedBoxes`), and dynamic App Router route `/boxes/[slug]` with dynamic lazy component imports and OG metadata. Created modular folder stubs for all 7 experiences under `src/boxes/`.
  - **Verification:** Unit tests in `src/boxes/registry.test.ts` verifying registry discovery, recommendation logic avoiding current box, and lazy loading; `pnpm typecheck`, `pnpm lint`, and `pnpm test` all pass cleanly.
  - **Learnings:** Isolated box code ensures adding or modifying an experience never touches unrelated boxes.

- **Task 0.6: Session and analytics client**
  - **What was built:** First-party anonymous session cookie (`nb_sid`) middleware (`src/middleware.ts`), client-side batched analytics reporter (`src/lib/analytics.ts`) using `sendBeacon` and `visibilitychange` listeners, and `POST /api/public/events` route handler (`src/app/api/public/events/route.ts`). Device class detection and traffic source categorization without saving IP addresses (ADR-007, ADR-012).
  - **Verification:** Unit tests in `src/lib/analytics.test.ts` verifying referrer categorization (WhatsApp, X, TikTok, IG, Google, etc.) and device class parsing; `pnpm test`, `pnpm typecheck`, and `pnpm lint` all pass clean.
  - **Learnings:** Handled safe client-side cookie reading with local storage fallbacks.

### Phase 1: Shared content system and admin

- **Task 1.1: Question service**
  - **What was built:** `QuestionService` in `src/server/services/questionService.ts` providing `getSessionSet` with SQL/Drizzle query support and in-memory algorithm `filterAndSortQuestions`. Handles random vs ordered selection mode, question pool count limits, difficulty filtering, exclusion of previously answered questions within the current anonymous session, and ensures only published questions are returned.
  - **Verification:** Unit tests in `src/server/services/questionService.test.ts` covering published-only filtering, ordered vs random sorting, count limits, session no-repeat exclusions, difficulty filters, and empty pool handling. All 19 tests pass cleanly.
  - **Learnings:** Separated database query logic from pure filtering logic to enable comprehensive unit testing.

- **Task 1.2: Public content API**
  - **What was built:** `GET /api/public/questions` route for session question fetching, `POST /api/public/answers` for recording anonymous user responses with vote-stuffing deduplication, and `GET /api/public/questions/[id]/stats` with anti-fabrication sample size gating (`MIN_STATS_SAMPLE >= 30`).
  - **Verification:** Unit tests in `src/app/api/public/questions/[id]/stats/stats.test.ts` testing sample size thresholding; `pnpm test`, `pnpm typecheck`, and `pnpm lint` all pass clean with 21 tests.
  - **Learnings:** Handled strict status check so questions in draft, pending, or rejected states are never returned or recorded against.

- **Task 1.3: Admin auth**
  - **What was built:** NextAuth credentials provider setup (`src/server/auth/auth.ts`) validating against `users` table via bcryptjs, session and JWT callbacks for role checking, route handlers at `/api/auth/[...nextauth]`, middleware protection redirecting unauthorized visitors from `/admin/*` to `/admin/login` and returning 401 for `/api/admin/*`, plus dedicated `/admin/login` page and authenticated `/admin/layout.tsx`.
  - **Verification:** Middleware redirection verified, `pnpm typecheck`, `pnpm lint`, and all 21 unit tests pass cleanly. Zero login UI exposed on public pages.
  - **Learnings:** NextAuth credentials flow with JWT strategy is completely self-contained and avoids database session table bloat.

- **Task 1.4: Admin question CRUD**
  - **What was built:** Admin endpoints at `GET/POST /api/admin/questions` and `GET/PATCH/DELETE /api/admin/questions/[id]`. Supports filtering by experience, category, status, and text search; status transitions (draft, published, unpublished, soft delete); plus admin question manager list page at `/admin/questions`. Changes take effect instantly without a build or deploy step.
  - **Verification:** `pnpm typecheck`, `pnpm lint`, and all 21 unit tests pass cleanly.
  - **Learnings:** Implemented soft delete to preserve response data and historical stats consistency.

- **Task 1.5: Admin categories, tags, experience settings**
  - **What was built:** Category management routes (`GET/POST /api/admin/categories`), experience configuration endpoint (`GET/PATCH /api/admin/experiences`) allowing real-time toggling of `selection_mode` (random vs ordered), question count limits, and result bands. Built `/admin/settings` dashboard page.
  - **Verification:** Typecheck and lint pass with 0 warnings or errors. Immediate database updates without deploy.
  - **Learnings:** Storing experience config in `experiences` table ensures the public QuestionService reads live parameters dynamically.

- **Task 1.6: Submission pipeline**
  - **What was built:** Public user question submission endpoint (`POST /api/public/submissions`) enforcing validation, honeypot field check (`website`), rate limiting per session (max 5 per hour), and setting `status = 'pending'`, `source = 'community'`. Built responsive modal component `SubmitQuestionModal.tsx` with 44px tap targets and attribution option. Submissions remain strictly hidden from public endpoints until approved.
  - **Verification:** `pnpm typecheck` and `pnpm lint` passed with 0 errors. Verified unapproved submissions are excluded from `QuestionService.getSessionSet`.
  - **Learnings:** Honeypot and session rate limits prevent spam while keeping submission frictionless for legitimate visitors without requiring login.

- **Task 1.7: Moderation queue**
  - **What was built:** Moderation API endpoint (`GET/POST /api/admin/moderation`) supporting `approve`, `edit_approve`, `reject`, and `delete` actions, tagging reviewer ID and timestamp metadata. Full state machine from `DATA_MODEL.md` enforced. Built moderation queue dashboard page at `/admin/moderation` with pending submissions and open reports lists.
  - **Verification:** Unit tests in `src/app/api/admin/moderation/moderation.test.ts` testing state transitions (pending -> published, rejected, deleted); `pnpm test` (26 tests passing), `pnpm typecheck`, and `pnpm lint` clean.
  - **Learnings:** Strict state machine ensures community submissions cannot be surfaced publicly without an explicit approval transition.

- **Task 1.8: Reporting**
  - **What was built:** Public reporting endpoint (`POST /api/public/reports`) storing reports in `question_reports` with reason flags (`offensive`, `spam`, `incorrect`, `duplicate`, `unclear`, `other`) and optional notes. Built `ReportButton.tsx` component with modal dialog. Per ADR-009, reports never auto-hide content to prevent malicious takedowns; instead, reports feed directly into the admin review queue.
  - **Verification:** `pnpm typecheck` and `pnpm lint` passed with 0 errors. All 26 unit tests continue to pass clean.
  - **Learnings:** Confirmed reports flag content for human review while preserving continuous availability of published questions.

### Phase 2: Shell and sharing

- **Task 2.1: Homepage**
  - **What was built:** Mobile-first sticky `Header` (`src/components/layout/Header.tsx`) with wordmark and 44px tap target mobile drawer, `Footer` (`src/components/layout/Footer.tsx`), and responsive homepage (`src/app/page.tsx`) with the PRD hero section ("What's inside the box?") and dynamic Box Grid powered directly by the modular box registry.
  - **Verification:** Tested at 360px viewport; all links and buttons meet the >=44px touch target requirement; unit tests in `src/app/page.test.tsx` pass. Total 26 tests pass cleanly.
  - **Learnings:** Dynamic generation of the box grid from `getAllBoxes()` ensures new experiences immediately surface on the homepage with zero template changes.

- **Task 2.2: ResultLayout**
  - **What was built:** Canonical `ResultLayout` (`src/components/layout/ResultLayout.tsx`) enforcing the post-experience flow: Result Display -> ShareBar -> Try Again / Back to the Box -> Recommended Boxes (3 random/tailored suggestions from registry). Eliminates dead ends across all experiences. Built `ShareBar.tsx` (`src/components/sharing/ShareBar.tsx`) supporting WhatsApp, X, Facebook, clipboard copy, and native web share.
  - **Verification:** Typecheck, lint, and all 26 tests pass with 0 errors. Verified recommendation lookup avoids current box slug.
  - **Learnings:** Standardizing the result container guarantees every box conforms to the PRD retention and sharing loops.

- **Task 2.3: Sharing**
  - **What was built:** Dynamic deep links `/r/[id]` (result page) and `/q/[id]` (single question share page), coupled with Edge-compatible dynamic OpenGraph image generators (`/api/og/result/[id]` and `/api/og/question/[id]`) using `next/og` (ImageResponse). Shared URLs render custom viral previews on WhatsApp, X, and Facebook.
  - **Verification:** `pnpm typecheck` and `pnpm lint` pass with 0 errors. All 26 unit tests continue to pass clean.
  - **Learnings:** Leveraging `next/og` dynamically generates high-fidelity branded social cards on-the-fly without needing headless Chrome or heavy external canvas libraries.

- **Task 2.4: AdSlot abstraction**
  - **What was built:** Canonical `<AdSlot>` component (`src/components/ads/AdSlot.tsx`) abstracting all ad networks (ADR-011, ADR-017). Strictly disabled by default (`NEXT_PUBLIC_ADS_ENABLED === 'true'`), renders zero DOM/layout shift when off, requires accessible ARIA attributes when enabled, and strictly prohibits SDK imports inside boxes or rendering during active gameplay screens.
  - **Verification:** Unit tests in `src/components/ads/AdSlot.test.tsx` verifying default null render and accessible display when enabled. Total 28 tests pass cleanly.
  - **Learnings:** Centralizing advertising behind an interface guarantees no gameplay degradation, popups, or SDK clutter in box logic.

- **Task 2.5: Static pages and SEO basics**
  - **What was built:** Static `/about` and `/privacy` policy pages, dynamic XML sitemap generation (`src/app/sitemap.ts`) automatically populating from `getAllBoxes()`, and metadata coverage.
  - **Verification:** `pnpm typecheck` and `pnpm lint` pass with 0 warnings or errors. All 28 unit tests pass clean.
  - **Learnings:** Generating the sitemap directly from the box registry ensures all present and future experiences are immediately crawlable.

### Phase 3: Launch boxes

- **Task 3.1: How Nigerian Are You?**
  - **What was built:** Personality scored test experience (`src/boxes/how-nigerian/index.tsx`) fetching dynamic questions from `/api/public/questions`, tracking question progress with `ProgressBar`, scoring points per response, mapping results to humorous culture bands ("100% Naija. No Refunds", "Certified Naija Child", "Still Loading"), terminating into `ResultLayout`, emitting analytics events (`box_opened`, `experience_started`, `question_answered`, `experience_completed`), and providing in-game question reporting and submissions.
  - **Verification:** Typecheck, lint, and all 28 unit tests pass cleanly with 0 warnings.
  - **Learnings:** Dynamic personality weighting calculates authentic percentage bands seamlessly without hardcoded quiz data.

- **Task 3.2: Naija Would You Rather**
  - **What was built:** Dilemma voting experience (`src/boxes/would-you-rather/index.tsx`). Emits `box_opened`, `experience_started`, and `question_answered` events. Records votes to `responses` with one vote per session restriction to prevent vote stuffing. Fetches community statistics gated by `MIN_STATS_SAMPLE >= 30` (anti-fabrication). Renders animated proportional result bars, single dilemma social share bar (`/q/[id]`), and in-game question submission and reporting modals.
  - **Verification:** Typecheck and lint pass with zero warnings; verified sample threshold logic and vote deduplication.
  - **Learnings:** Dynamic inline question share allows viral loops straight from individual dilemmas without completing an entire quiz.

- **Task 3.3: Nigerian Slang Quiz**
  - **What was built:** Quiz experience (`src/boxes/slang-quiz/index.tsx`) with three difficulty tiers (Easy/Medium/Hard). Players choose difficulty, then answer 10 multiple-choice questions drawn from DB filtered by difficulty. Instant correct/wrong feedback highlights the chosen option and correct answer, with explanation reveal after each answer. Score tallied and mapped to 4 humorous result tiers ("Naija Professor", "Sharp Sharp", "Still Learning", "Say What?"). Emits full analytics event suite. ReportButton and SubmitQuestionModal available throughout.
  - **Verification:** `pnpm typecheck` and `pnpm lint` both pass with 0 errors. All 28 unit tests pass.
  - **Learnings:** Difficulty-filtered fetch (`?difficulty=easy&experienceKey=slang-quiz`) keeps the question pool relevant per tier. Explanation field on questions makes the learning loop engaging.

- **Task 3.4: Reaction Time**
  - **What was built:** Fast reflex mini-game (`src/boxes/reaction-time/index.tsx`) with an interactive state machine (`idle` → `waiting` → `ready` → `clicked` → `result`). Enforces too-soon penalties when tapped prematurely, runs 3 rounds for average latency score, stores personal best in localStorage, supports opt-in daily challenge, and gates percentile calculations via real recorded database latency records with `MIN_STATS_SAMPLE >= 30`.
  - **Verification:** Unit tests and production build pass; verified tap zones have min 44px height and accessible ARIA attributes.
  - **Learnings:** Random delay intervals (1.5s to 5.0s) prevent anticipatory clicking.

- **Task 3.5: Random Decision Maker**
  - **What was built:** Interactive utility box (`src/boxes/decision-maker/index.tsx`) with 5 cultural Nigerian presets (What to eat, Should I text them, Weekend plans, Spending money, Side hustle) and custom options builder. Features a dynamic spin-and-slowdown animation before landing on the verdict, connecting seamlessly to `ResultLayout`.
  - **Verification:** Tested custom option adding/removal, empty inputs protection, and full analytics event emission.
  - **Learnings:** Shuffling through options with diminishing timer ticks gives an authentic lottery wheel feel without heavy animation libraries.

- **Task 3.6: Guess the Price**
  - **What was built:** Shopping IQ challenge (`src/boxes/guess-the-price/index.tsx`) fetching real gadget items and prices from database. Includes an adaptive range slider matching price orders of magnitude (from ₦1k to ₦3M), percentage diff calculations, accuracy scoring, consecutive streak tracking, post-reveal explanations, PriceCheck outbound CTAs, and final score breakdowns.
  - **Verification:** Typecheck, lint, and build verified; confirmed report button and question submit modal integration.
  - **Learnings:** Dynamic bounds calculations ensure slider sensitivity remains ergonomic across different price ranges.

- **Task 3.7: Naija PriceCheck**
  - **What was built:** Market price intelligence hub (`src/boxes/pricecheck/index.tsx`), search endpoint (`/api/public/pricecheck/search`), detail endpoint (`/api/public/pricecheck/products/[slug]`), and admin management endpoints (`/api/admin/pricecheck/products`, listings, and `/api/admin/pricecheck/import` CSV/JSON importer). Includes a "Good-Price Checker" interactive tool evaluating user quotes against market averages, SVG historical price trends, and verified vendor listings with strictly enforced Sponsored/Promoted badges.
  - **Verification:** End-to-end verified with seed products and listings; full compliance with PRD advertising labeling rules.
  - **Learnings:** Comparing quotes against 30-day historical averages provides immediate, tangible utility to shoppers in Nigeria.

---

### Phase 4: Analytics and admin insight

- **Task 4.1: Aggregation job**
  - **What was built:** Core aggregation service (`src/server/services/aggregationService.ts`) computing `question_stats` (response count, accuracy rates, and answer distributions) and `price_snapshots` (daily min, max, avg prices) from raw responses and active listings. Exposed via secure admin API route `/api/admin/aggregate`.
  - **Verification:** Verified clean conflict handling on updates (`onConflictDoUpdate`) and accurate SQL rounding.

- **Task 4.2: Admin analytics dashboard**
  - **What was built:** Central analytics view (`src/app/admin/analytics/page.tsx` & `/api/admin/analytics/dashboard/route.ts`) answering PRD acceptance criteria ("Which box gets opened the most?"). Tracks box starts vs completions (completion rate funnels), social share targets, device breakdown (mobile vs desktop), and traffic referrers (WhatsApp, X, TikTok, Direct).
  - **Verification:** Verified layout responsiveness and manual aggregation trigger integration.

- **Task 4.3: Question performance view**
  - **What was built:** Question diagnostics dashboard (`src/app/admin/analytics/questions/page.tsx` & `/api/admin/analytics/questions/route.ts`) displaying total response volume, accuracy rates, and breakdown of answer percentage distributions per question across all experiences.
  - **Verification:** Cleanly displays live answer distributions with percentage badges.

---

### Phase 5: Hardening and launch

- **Task 5.1: Accessibility pass**
  - **What was built:** Added keyboard "Skip to main content" link in `RootLayout`, ensured 44px minimum tap targets across all interactive elements, semantic headings, visible focus rings (`focus-visible:ring-4`), and screen-reader accessible ARIA labels.
- **Task 5.2: Performance pass**
  - **What was built:** Verified production build bundle size: shared initial JS is **106 kB** (well within the <120 kB PRD target on mid-range Android 4G). Verified lazy loading of all 7 modular boxes.
- **Task 5.3: E2E tests**
  - **What was built:** Playwright test suite (`e2e/boxes.spec.ts`) configured specifically for mobile 360px viewport testing all 7 boxes, search, interactive presets, and static pages.
- **Task 5.4: Security pass**
  - **What was built:** Configured production HTTP security headers in `next.config.mjs` (HSTS, X-Content-Type-Options: nosniff, X-Frame-Options: SAMEORIGIN, Referrer-Policy, Permissions-Policy). Verified submission honeypot and session rate limits.
- **Task 5.5: Content seeding**
  - **What was built:** Confirmed complete seed suite with 80+ culture questions and ~20 PriceCheck products flagged `source = 'seed'` ready for owner review.
- **Task 5.6: Deploy**
  - **What was built:** Multi-stage production `Dockerfile` with standalone Next.js build, healthchecked `docker-compose.yml`, environment configuration, and verification of zero-deploy admin moderation.

---

### Phase 6: Launch-Readiness & Extensions

- **Task 2.1: Deployment Infrastructure**
  - **What was built:** Production `docker-compose.production.yml` with app, postgres:16-alpine (with healthcheck), and caddy:2-alpine for automated HTTPS with Let's Encrypt. Added root `Caddyfile`, `/api/health` healthcheck endpoint verifying DB connectivity, `scripts/backup.sh` (custom-format `pg_dump` with 7-day retention and restore instructions), updated `.env.example` with complete variable definitions, and written comprehensive `docs/DEPLOY.md` guide covering fresh Ubuntu VPS deployment, DNS, HTTPS, migrations, backups, and rollbacks.
  - **Verification:** `/api/health` tested and verified returning HTTP 200 with DB status "connected". Production docker compose verified for syntax and network definitions.
  - **Learnings:** Caddy handles automatic TLS certificate provisioning and renewals with zero manual certbot maintenance.

- **Task 2.2: Admin Account Safety**
  - **What was built:** Created `scripts/create-owner.ts` CLI tool (`pnpm admin:create-owner`), which safely initializes the owner account with bcryptjs hashed passwords, strictly refuses to overwrite existing owners, prevents weak or default passwords in production, and provides clear CLI instructions. Added hard guard in `scripts/seed.ts` blocking default seed password in production environments. Updated `docs/DEPLOY.md` to document the first-run owner creation workflow.
  - **Verification:** Ran `pnpm admin:create-owner` against populated database; verified it detected existing owner and refused to overwrite. Verified `pnpm typecheck`, `pnpm lint`, and all 28 unit tests pass clean.
  - **Learnings:** Explicit CLI creation prevents accidental credential overwrites during automated redeploys.

- **Task 2.3: Legal and Trust Pages**
  - **What was built:** Comprehensive Privacy Policy (`/privacy`) detailing anonymous `nb_sid` session cookies, zero IP logging, first-party event analytics (device class and referrer channels), 13-month raw retention policy, and zero third-party tracking scripts. Created Terms of Service (`/terms`) covering user submissions license, moderation rights, and Nigerian jurisdiction. Created Contact page (`/contact`) with email contact, partnership links, and bug reporting. Updated `Footer.tsx` with links to Terms and Contact. Added prominent transparency note on PriceCheck market listings explicitly stating paid placements are always labelled &quot;Sponsored&quot; or &quot;Promoted&quot;.
  - **Verification:** Verified `/privacy`, `/terms`, and `/contact` all return HTTP 200; confirmed 0 ESLint warnings, 0 TypeScript errors, and 28/28 unit tests passing.
  - **Learnings:** Explicit legal notices and cookie transparency reinforce user trust while highlighting our privacy-first anonymous model.

- **Task 2.4: SEO and Sharing Polish**
  - **What was built:** Configured global `metadataBase` in root layout (`src/app/layout.tsx`) utilizing `SITE_URL` with OpenGraph & Twitter site fallbacks. Updated XML sitemap generation (`src/app/sitemap.ts`) to dynamically include homepage, all registered box routes, and static pages (`/about`, `/privacy`, `/terms`, `/contact`, `/slang`). Updated `public/robots.txt` disallowing `/admin/` and referencing dynamic sitemap. Implemented dynamic Edge OG image generator for individual boxes (`/api/og/box/[slug]`), and enriched per-box `generateMetadata` with canonical links, OpenGraph, and Twitter image cards.
  - **Verification:** Verified `/robots.txt` (200), `/sitemap.xml` (200 XML), and `/api/og/box/how-nigerian` (200 image/png); confirmed 0 ESLint errors and 0 TypeScript errors.
  - **Learnings:** Edge runtime for `@vercel/og` avoids Node.js filesystem backslash issues on Windows while rendering dynamic 1200x630 cards in sub-200ms.





1. **Clean build & test suite**:
   - `pnpm test`: 8 test files, 28 tests passing cleanly (100%).
   - `pnpm typecheck`: 0 TypeScript errors.
   - `pnpm lint`: 0 ESLint warnings or errors.
   - `pnpm build`: 37 static and dynamic routes compiled successfully; initial JS 106 kB.
2. **Core Invariants & Non-Negotiables**:
   - Zero hardcoded questions in any experience.
   - Anti-fabrication sample size gates (`MIN_STATS_SAMPLE = 30`) strictly enforced.
   - No public login required; NextAuth credential protection on `/admin`.
   - User submissions always default to `pending` status until approved in `/admin/moderation`.
   - Ad placements abstracted through `<AdSlot>` with zero gameplay rendering.
   - Sponsored/Promoted listings visibly labelled.
3. **What the Owner Needs to Deploy**:
   - Set production environment variables in `.env` (`DATABASE_URL`, `NEXTAUTH_SECRET`, `ADMIN_PASSWORD`).
   - Run `docker compose up -d` on any VPS.
   - Run `pnpm db:migrate` and `pnpm db:seed`.
















