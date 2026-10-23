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







