# AGENTS.md: Rules for AI coding agents (Antigravity)

You are building **NaijaBox**. Read `docs/PRD.md` first. The PRD is the product source of truth. Do not change product behaviour on your own; where the PRD is silent, record the choice in `docs/DECISIONS.md` as a new ADR.

## Working process

1. Pick the next unchecked task in `docs/TASKS.md`. Work in phase order.
2. Before coding, read the relevant sections of `ARCHITECTURE.md`, `DATA_MODEL.md` and `USER_FLOWS.md`.
3. Implement, test, then tick the task and note anything learned.
4. Keep changes small and reviewable: one task, one commit.
5. If a task needs a decision not covered by an ADR, stop and write the ADR first.

## Non-negotiable constraints

- **No hard-coded questions.** All question content (quizzes, would-you-rather, slang, price items) comes from the database via the shared content system.
- **No login for public use.** Auth exists only for `/admin`.
- **User submissions are never public until approved.** Status flow: `pending → approved | rejected | deleted`.
- **No fabricated statistics.** Community percentages and "faster than X%" appear only when computed from real recorded data and above the minimum sample size (see `DATA_MODEL.md`).
- **Paid placements must be labelled** ("Sponsored" / "Promoted") wherever they appear.
- **Modular boxes.** A new experience is added by creating one folder under `src/boxes/<slug>/` and registering it. No edits to unrelated boxes.
- **Ad provider is abstracted** behind an `<AdSlot>` component. Never import an ad SDK directly in a box.
- **No proprietary builder/runtime lock-in.** Must run via Docker on any VPS.
- **Admin edits never require a deploy.**

## Quality bar

- Mobile first. Design at 360px width, then scale up. Tap targets at least 44px.
- Keep initial JS small. Lazy-load box code. Avoid heavy animation libraries.
- Accessibility: semantic HTML, visible focus, labels on all inputs, sufficient contrast, `prefers-reduced-motion` respected.
- Every box must implement the post-experience layout: Result → Share → Try Again (if relevant) → Recommended boxes → Back to the Box.
- Every shareable result needs a deep link and an OG image.
- Emit analytics events from `ANALYTICS_EVENTS.md` for every box.

## Tone and design

Playful, modern, minimal, slightly chaotic. Nigerian identity comes through copy, humour and content, **not** flags, green backgrounds or Ankara patterns. Copy uses natural Nigerian English and light Pidgin; keep it inclusive and non-stereotyping.

## Definition of done (per task)

- Works at 360px and desktop widths
- Lint, typecheck and tests pass
- Analytics events fire
- Docs updated if behaviour or schema changed
- Task ticked in `docs/TASKS.md`
