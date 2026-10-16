# USER FLOWS

Notation: **Screen** → action → outcome. Every flow assumes mobile (360px) first and no login.

## 1. First visit and discovery

1. Visitor lands on `/` (often from a WhatsApp, TikTok, Instagram, X or Google link).
2. Sees hero "What's inside the box?" and the grid of box cards.
3. Taps a card, or "Explore NaijaBox", which scrolls to the grid.
4. Box starts immediately, no signup.

Deep-link variant: visitor lands on `/r/<id>` or `/q/<id>`, sees the shared result or question, with a clear "Try it yourself" CTA into the box and a "Back to the Box" link.

## 2. Universal post-experience layout

Used by every box at completion:

1. Result or outcome
2. Share result (WhatsApp, X, Facebook, Copy link, native share; Instagram = save image)
3. Try Again (where appropriate)
4. Recommended experiences (2 to 3 cards, avoiding the one just played)
5. Back to the Box

## 3. How Nigerian Are You?

1. Intro card with "Start" button.
2. Questions one at a time, big tap options, progress bar; set drawn from the pool (random or ordered per settings).
3. Last answer → score computed → result stored → `/r/<id>`.
4. Result card: percentage + category label (e.g. "87% Nigerian: Certified Naija Child").
5. Share, "Try Another Box" CTA, recommended boxes.
6. Footer action: "Add a Question".

Edge: user abandons mid-way → progress kept in memory only; reload restarts.

## 4. Naija Would You Rather

1. Question with two large options.
2. User taps one → response recorded (one vote per session per question).
3. If `total >= MIN_STATS_SAMPLE`: show percentage split; otherwise show "You're one of the first to answer".
4. Buttons: Next, Share this question (`/q/<id>`), Report.
5. Endless feed with no repeats in the session; after N questions, suggest another box.

## 5. Guess the Price

1. Product card with name, image, category.
2. User enters a guess (number pad, ₦ prefilled, quick-step chips to reduce typing).
3. Reveal reference price, difference (₦ and %), and a playful verdict.
4. Streak and personal best updated (localStorage + session).
5. CTA: "Want to see actual prices? Check PriceCheck" → PriceCheck pre-searched for that product.
6. Next item.

## 6. Naija PriceCheck

1. Search box (typeahead from `products.aliases`).
2. Product page: summary (range, average, lowest, last updated), listing table (seller, price, location, condition), price history chart.
3. "Is this a good price?" input → plain-language verdict versus current average, with the last-updated date.
4. Listings flagged `is_paid` show a visible "Sponsored" or "Promoted" label; affiliate outbound links open in a new tab.
5. No results: suggest similar products and a "Tell us what to add" link.
6. Footer: recommended boxes.

## 7. Nigerian Slang Quiz

1. Pick difficulty (Easy, Medium, Hard) or "Mix".
2. Slang term shown with 3 to 4 meanings; user taps one; instant correct/incorrect feedback with a short explanation.
3. After the set (default 15 to 20), score screen with humorous label (e.g. "18/20: You're officially outside").
4. Share, Try Again, recommended boxes, "Add a Slang Question".

## 8. Reaction Time

1. Screen turns "wait" colour; after a random delay it changes; user taps.
2. Tapping early shows "Too soon" and a retry.
3. Shows ms and personal best; percentile shown only when real data meets `MIN_STATS_SAMPLE`.
4. Daily challenge variant uses one attempt set per day.
5. Share, Try Again, recommended boxes.

## 9. Random Decision Maker

1. Choose a preset ("What should I eat?") or type custom options (minimal typing, add via enter or chips).
2. Tap the main button → quick playful animation (respecting reduced motion) → one pick.
3. "Spin again", "Share", recommended boxes.

## 10. Submit a question (contributor)

1. Tap "Add a Question" inside a supported box.
2. Form adapts to box type (question text, options/answer, category, optional explanation, optional display name, attribution toggle).
3. Client and server validation, honeypot, rate limit.
4. Confirmation: "Thanks! It'll show up once it's reviewed." Status `pending`; nothing public.

## 11. Report a question

1. Tap Report on any published question.
2. Pick a reason (offensive, spam, incorrect, duplicate, doesn't make sense, other), optional note.
3. Confirmation; question stays live until admin acts.

## 12. Admin: sign in

`/admin/login` → credentials → dashboard. Failed attempts are rate limited. Public pages never link to admin.

## 13. Admin: manage questions

1. Questions list with filters (experience, category, tag, status, difficulty, source) and search.
2. Create / edit form for the selected question type; live preview.
3. Publish, unpublish, delete; drag to reorder for ordered experiences.
4. Manage categories and tags; configure experience settings (random vs ordered, question count, result bands).
5. All changes take effect immediately with no deploy.

## 14. Admin: moderate submissions and reports

1. Moderation queue shows `pending` items (oldest first) and open reports.
2. Open item: see content, apply flags (spam, offensive, duplicate, low quality, incorrect, not relevant, other).
3. Actions: **Approve**, **Edit & Approve**, **Reject**, **Delete**. Attribution settings editable here.
4. Reports: dismiss, or take action (unpublish, edit, delete).
5. Decisions are logged with reviewer and time.

## 15. Admin: analytics

Dashboard answering "Which box gets opened the most?": starts, completions, completion rate, shares, top questions, navigation between boxes, mobile vs desktop, traffic source, submission and moderation volume. Question detail view shows response rate and answer distribution.

## 16. Error and empty states

- Offline or API failure: friendly retry message, never a dead end (link back to the Box).
- Empty question pool for an experience: box card hidden from the homepage and admin warned.
- Not enough stats: show the "be one of the first" state, never a made-up number.
