# NaijaBox

> A box full of things to do.

NaijaBox is a collection of small, interactive web experiences built around Nigerian culture, internet culture, games, quizzes, useful tools and shopping intelligence. Opening it should feel like opening a box and finding something interesting inside: playful, modern, mobile-first, slightly chaotic.

## The seven launch boxes

| Box | Type | Primary value |
|---|---|---|
| How Nigerian Are You? | Personality test | Shareability |
| Naija Would You Rather | Social game | Repeat engagement |
| Guess the Price | Price game | Fun + commerce funnel |
| Naija PriceCheck | Shopping utility | Search + monetization |
| Nigerian Slang Quiz | Culture quiz | Viral + SEO |
| Reaction Time | Mini-game | Replayability |
| Random Decision Maker | Utility | Repeat usage |

## Documentation map

Read in this order:

1. [`docs/PRD.md`](docs/PRD.md): product source of truth
2. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): system design and folder structure
3. [`docs/DECISIONS.md`](docs/DECISIONS.md): ADRs (implementation choices and why)
4. [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md): database schema and content schema
5. [`docs/USER_FLOWS.md`](docs/USER_FLOWS.md): public, contributor and admin flows
6. [`docs/ANALYTICS_EVENTS.md`](docs/ANALYTICS_EVENTS.md): event spec
7. [`docs/TASKS.md`](docs/TASKS.md): phased build plan with acceptance criteria
8. [`AGENTS.md`](AGENTS.md): rules for AI coding agents (Antigravity)

## Quick start (target state)

```bash
cp .env.example .env
docker compose up -d db
pnpm install
pnpm db:migrate && pnpm db:seed
pnpm dev
```

Public site: http://localhost:3000 · Admin: http://localhost:3000/admin

## Core principles

- **"Would I send this to somebody?"** If not, it doesn't belong.
- **"Don't make users work to have fun."** No sign-up, minimal typing.
- Content lives in the database, never in source code.
- Every experience ends in a result, a share action and a path to another box.

## Status

Planning complete. Build has not started. Start with Phase 0 in `docs/TASKS.md`.
