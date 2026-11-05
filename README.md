# NaijaBox

> A box full of things to do.

NaijaBox is a collection of small, interactive web experiences built around Nigerian culture, internet culture, games, quizzes, useful tools and shopping intelligence. Opening it should feel like opening a box and finding something interesting inside: playful, modern, mobile-first, slightly chaotic.

## The 11 live experiences

| Box | Slug | Type | Primary Value |
|---|---|---|---|
| How Nigerian Are You? | `how-nigerian` | Personality test | Shareability & viral score bands |
| Naija Would You Rather | `would-you-rather` | Social dilemma | Real-time community stats & dilemma sharing |
| Guess the Price | `guess-the-price` | Price game | Fun + commerce funnel |
| Naija PriceCheck | `pricecheck` | Shopping utility | Search, price trends & transparency |
| Nigerian Slang Quiz | `slang-quiz` | Culture quiz | Viral trivia + SEO slang dictionary link |
| Reaction Time | `reaction-time` | Mini-game | Millisecond reflex test & percentile rankings |
| Random Decision Maker | `decision-maker` | Utility | Cultural presets & customizable picker |
| Which Nigerian Food Are You? | `food-personality` | Personality test | Humorous food archetypes & share cards |
| Nigerian Excuse Generator | `excuse-generator` | Utility | Emergency excuses, WhatsApp share & copy |
| Higher or Lower (Price Edition) | `higher-or-lower` | Price game | Market price comparisons & streak counter |
| Naija Football Trivia | `football-trivia` | Culture quiz | Super Eagles history across 3 difficulty tiers |

## Additional features

- **Searchable Nigerian Slang Dictionary** (`/slang` & `/slang/[term]`): Full cultural slang dictionary with Google-compliant JSON-LD `DefinedTerm` schema powered directly by quiz questions (zero duplicate data).
- **Optional Player Accounts** (`/account`): 100% optional player profiles for tracking streaks 🔥, games played 🎮, best reflex times ⚡, saved score history, and favourite boxes. Anonymous play via `nb_sid` is untouched and never gated.
- **Sponsorship Editions** (`/admin/sponsors`): Non-intrusive, strictly labelled sponsor badges (`SPONSORED` / `PROMOTED`) in post-experience result layouts with impression and click tracking (never rendered during active gameplay).
- **Admin & Moderator Management** (`/admin/users`): Role-based access control (owner vs moderator) with protected routes and moderation workflows.
- **Content Health Dashboard** (`/admin/content-health`): Real-time question pool health monitoring (Healthy / Warning / Critical) and batch moderation tools.

## Documentation map

Read in this order:

1. [`docs/PRD.md`](docs/PRD.md): product source of truth
2. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): system design and folder structure
3. [`docs/DECISIONS.md`](docs/DECISIONS.md): ADRs (implementation choices and why)
4. [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md): database schema and content schema
5. [`docs/USER_FLOWS.md`](docs/USER_FLOWS.md): public, contributor and admin flows
6. [`docs/ANALYTICS_EVENTS.md`](docs/ANALYTICS_EVENTS.md): event spec
7. [`docs/DEPLOY.md`](docs/DEPLOY.md): production deployment, VPS setup, backups and monitoring
8. [`docs/TASKS.md`](docs/TASKS.md): phased build plan with acceptance criteria
9. [`AGENTS.md`](AGENTS.md): rules for AI coding agents (Antigravity)

## Quick start (Local Development)

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Start PostgreSQL container
docker compose up -d db

# 3. Install dependencies
pnpm install

# 4. Run migrations and seed data (80+ Nigerian cultural questions)
pnpm db:migrate && pnpm db:seed

# 5. Start development server
pnpm dev
```

- Public site: http://localhost:3000
- Admin login: http://localhost:3000/admin (Default dev credentials in `.env.example`)
- Slang dictionary: http://localhost:3000/slang
- Player account: http://localhost:3000/account

## Production Deployment (VPS)

NaijaBox includes a complete production stack (`docker-compose.production.yml`) with automated HTTPS via Caddy reverse proxy:

```bash
# On your Ubuntu VPS:
cp .env.example .env
# Edit .env with your domain and strong production secrets (AUTH_SECRET, POSTGRES_PASSWORD)

# Launch app, database, and Caddy with automatic TLS
docker compose -f docker-compose.production.yml up -d

# Create initial owner account securely via CLI
pnpm admin:create-owner
```

See [`docs/DEPLOY.md`](docs/DEPLOY.md) for full VPS setup, DNS configuration, automated backup cron jobs, and rollback procedures.

## Core principles

- **"Would I send this to somebody?"** If not, it doesn't belong.
- **"Don't make users work to have fun."** Anonymous by default, zero registration wall, minimal typing.
- **Content lives in the database, never in source code.** Admin edits never require a deploy.
- **Strict anti-fabrication sample size gates.** Community percentages require `MIN_STATS_SAMPLE >= 30`.
- **Every experience ends in a result, a share action, and a path to another box.** Post-experience contract on every box.
- **Paid placements are always labelled.** "Sponsored" / "Promoted" badges are mandatory.

## Status

**All Phases (Phase 0 through Phase 6 & Launch-Readiness) are 100% complete and verified.**
- All 11 experiences fully implemented, registered, and playable at 360px and desktop.
- 100% unit test pass rate (12 test suites, 42 tests passing via Vitest).
- 100% E2E test pass rate (30 tests passing via Playwright across Mobile Chrome 360px and Desktop Chrome).
- Production build verified: 59 static and dynamic routes compiled, initial JS 106 kB (<120 kB ceiling).
- Zero TypeScript compiler errors (`tsc --noEmit`), zero ESLint warnings (`next lint`).
- Complete deployment automation, automated healthchecks (`/api/health`), and database backup tooling.
