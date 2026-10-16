# ARCHITECTURE

Implementation choices here are recorded as ADRs in `DECISIONS.md`. Product behaviour comes from `PRD.md`.

## 1. Stack (see ADR-001 to ADR-006)

- **Framework:** Next.js (App Router) + TypeScript, Node runtime
- **Database:** PostgreSQL
- **ORM/migrations:** Drizzle
- **Styling:** Tailwind CSS
- **Admin auth:** Auth.js (credentials), admin routes only
- **Share images:** `next/og` (dynamic OG image routes)
- **Deployment:** Docker image + `docker compose` (app + Postgres), runnable on any VPS
- **Package manager:** pnpm

## 2. High-level shape

```
Browser (mobile first)
   │
   ├── Public site (no auth)  ── /, /boxes/<slug>, /r/<resultId>, /q/<questionId>
   │        │
   │        └── Route handlers /api/public/*  (content, answers, submissions, reports, events)
   │
   └── Admin (auth)           ── /admin/*
            │
            └── Route handlers /api/admin/*   (CRUD, moderation, stats)

Both → service layer (src/server) → Drizzle → PostgreSQL
```

Public UI and admin UI share the database and services but not components or routes. Admin code is not shipped in public bundles.

## 3. Folder structure

```
naijabox/
├── AGENTS.md
├── README.md
├── docs/
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── drizzle/                     # generated migrations
├── scripts/
│   └── seed.ts                  # seed categories + starter content (dev only)
└── src/
    ├── app/
    │   ├── (public)/
    │   │   ├── page.tsx         # homepage / box grid
    │   │   ├── boxes/[slug]/page.tsx
    │   │   ├── r/[id]/page.tsx  # shared result deep link
    │   │   ├── q/[id]/page.tsx  # shared single question deep link
    │   │   └── about/page.tsx
    │   ├── admin/               # protected
    │   └── api/
    │       ├── public/
    │       └── admin/
    ├── boxes/                   # one folder per experience
    │   ├── registry.ts          # list of installed boxes
    │   ├── types.ts             # BoxDefinition interface
    │   ├── how-nigerian/
    │   ├── would-you-rather/
    │   ├── guess-the-price/
    │   ├── pricecheck/
    │   ├── slang-quiz/
    │   ├── reaction-time/
    │   └── decision-maker/
    ├── components/              # shared UI: Card, ShareBar, ResultLayout, AdSlot, ReportButton
    ├── content/                 # shared question/content system (client-safe types + hooks)
    ├── server/
    │   ├── db/                  # schema, client
    │   ├── services/            # questions, sessions, submissions, moderation, stats, prices
    │   └── auth/
    ├── lib/                     # analytics client, share helpers, rng, formatting
    └── styles/
```

## 4. Box module contract

Each box exports a `BoxDefinition` from `src/boxes/<slug>/index.ts` and is listed in `registry.ts`. The homepage, nav, recommendations and sitemap are generated from the registry, so adding a box never touches other boxes.

```ts
interface BoxDefinition {
  slug: string;                 // 'slang-quiz'
  title: string;
  tagline: string;              // card copy
  kind: 'game' | 'quiz' | 'tool' | 'test' | 'weird';
  navGroup: 'games' | 'quizzes' | 'tools' | 'pricecheck';
  usesQuestionSystem: boolean;
  experienceKey?: string;       // links to experiences.key in the DB
  component: () => Promise<{ default: React.ComponentType<BoxProps> }>; // lazy loaded
  recommendNext?: string[];     // hints for "Try another box"
}
```

Every box renders inside `<ResultLayout>` at completion, which enforces: Result → Share → Try Again → Recommended boxes → Back to the Box.

## 5. Shared question/content system

- One `questions` table for all question-based boxes, keyed by `experience_id`.
- A `QuestionService.getSessionSet(experienceKey, options)` returns the question set for a play session, honouring the experience's `selection_mode` (`random` or `ordered`), `question_count`, difficulty filter and no-repeat rules.
- Option and scoring payloads are JSON validated by a per-question-type Zod schema (`quiz_single`, `would_you_rather`, `personality_scored`, `price_guess`).
- Answers (`responses`) are anonymous and tied to a session id, not a person.
- Boxes never import question data; they only call the content API.

Guess the Price items are also questions (type `price_guess`) so they are admin-editable. PriceCheck listings use their own tables (see `DATA_MODEL.md`).

## 6. Sessions and anonymity

- First visit sets an anonymous `nb_sid` cookie (random UUID, first party, no personal data) for no-repeat logic, dedupe of responses, personal bests (also mirrored in localStorage) and repeat-visitor analytics.
- No IP addresses are stored with responses. Rate limiting uses a short-lived hashed IP in memory/Redis-free table, never joined to content.

## 7. Moderation architecture

State machine on `questions.status`:

```
draft ─► published ◄─► unpublished
pending ─► approved (published) | rejected | deleted
```

User submissions enter as `pending` with `source = 'community'`. Only `published` questions are returned by public endpoints. Admin Edit & Approve edits fields then sets `published`. Reports create `question_reports` rows and surface in the admin queue; they do not auto-hide a question (admin decision, see ADR-009).

## 8. Stats and anti-fabrication

- Answer distributions come from `responses` aggregates, cached by a materialized view or periodic job (ADR-008).
- Public stats endpoints return a distribution only if `total >= MIN_STATS_SAMPLE` (config, default 30). Otherwise they return `{ available: false }` and the UI shows no percentage.
- Reaction-time percentile uses recorded `reaction_results` only, with the same minimum sample rule.

## 9. Sharing and deep links

- Result pages `/r/[id]` are server-rendered with metadata and an OG image from `/api/og/result/[id]`.
- Single questions `/q/[id]` deep link to a Would You Rather or slang question.
- Share targets: WhatsApp (`wa.me`), X intent, Facebook sharer, copy link, native Web Share API where available. Instagram is treated as save image / screenshot-friendly card (no web share intent exists).
- Results store only score, category label and box slug, never answers tied to identity.

## 10. Ads and monetization

- `<AdSlot placement="...">` is the only way a page shows ads. It reads provider config from env/admin settings and renders nothing if disabled.
- Placement rules: never during active gameplay; only on result and listing screens; no interstitials or popups.
- Sponsorship is data (`sponsors`, `sponsorships`) that decorates a box or edition with a labelled "Sponsored by" badge.
- PriceCheck sponsored/promoted listings carry `is_paid = true` and always render a visible "Sponsored" or "Promoted" label.

## 11. PriceCheck data

- Price data lives in `products`, `listings`, `price_snapshots`.
- Ingestion is an implementation choice (ADR-010): V1 supports admin/CSV import and affiliate feeds behind an adapter interface, so sources can be added without touching the UI.
- "Good price" analysis is a pure function over current listings (average, min, range) with an explicit "last updated" date shown.

## 12. Analytics

First-party `events` table written through `POST /api/public/events` (batched, `sendBeacon`), with the event names in `ANALYTICS_EVENTS.md`. Admin dashboards read from SQL aggregates. An external analytics tool may be added later behind `lib/analytics.ts`.

## 13. Non-functional targets

- Mobile first, design at 360px. Initial JS for the homepage under ~120 KB gzipped; box code lazy-loaded.
- LCP under 2.5s on a mid-range Android on 4G.
- Accessibility: WCAG 2.1 AA targets, `prefers-reduced-motion` respected.
- SEO: server-rendered pages, sitemap from registry, structured data for the slang dictionary pages (later phase).
- Testing: Vitest unit tests for services, Playwright for core flows at a 360px viewport.

## 14. Deployment

- Single Docker image for the app; Postgres via compose or any managed Postgres.
- Env config via `.env` (`DATABASE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`, `MIN_STATS_SAMPLE`, `SITE_URL`, ad provider keys).
- Migrations run on deploy with `pnpm db:migrate`. Content changes happen through `/admin` and never need a deploy.
- Nightly database backup job is required before launch.

## 15. Extensibility

To add a box: create `src/boxes/<slug>/`, export a `BoxDefinition`, add it to `registry.ts`, optionally insert an `experiences` row and question types. Nothing else changes. Future accounts attach to `sessions` via an optional `user_id` without breaking anonymous play.
