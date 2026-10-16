# NaijaBox: Product Requirements Document

**Tagline:** A box full of things to do.
**Version:** 1.0
**Type:** Product specification and handoff document

---

## 1. Product overview

NaijaBox is a collection of small, highly interactive web experiences ("boxes") built around Nigerian culture, internet culture, games, quizzes, useful tools, shopping intelligence and curiosity. It should feel like opening a box and finding something interesting inside. The homepage is part of the product: visitors should be encouraged to explore rather than arrive with one specific task.

## 2. Goals

- A website people genuinely enjoy exploring.
- Highly shareable individual experiences.
- Repeat visits and multi-experience sessions.
- Organic traffic via useful tools and searchable content.
- Advertising and sponsorship opportunities.
- Affiliate/commerce opportunities (e.g. PriceCheck).
- A recognizable Nigerian internet brand.

**Non-goal:** NaijaBox should not initially feel like a traditional Nigerian information site or corporate portal.

## 3. Audience

- **Primary:** Nigerians ~16–35: university students, young professionals, social-media and internet-culture users, people who like quizzes, games, personality tests and shareable results.
- **Secondary:** Nigerians in the diaspora and other Africans interested in Nigerian culture.

## 4. Design language

Playful, modern, minimal, slightly chaotic, Nigerian without stereotypes, fast, mobile-first, interactive. Avoid flags, green backgrounds, Ankara patterns and similar clichés. Nigerian identity comes from content, language, humour, questions and personality. Direction: **modern internet design + Nigerian personality.**

## 5. Homepage

Arcade menu / box of experiments.

- **Header:** wordmark, Explore, Games, Quizzes, Tools, PriceCheck, About. Collapses to a compact menu on mobile.
- **Hero:** headline "What's inside the box?"; copy "Games, quizzes, weird questions, useful tools and things you probably didn't know you needed."; primary CTA "Explore NaijaBox".
- Experiences shown as visually distinct cards that communicate what they do immediately and spark curiosity.

## 6. Launch experiences

| Experience | Purpose | Primary value |
|---|---|---|
| How Nigerian Are You? | Viral personality test | Shareability |
| Naija Would You Rather | Social question game | Repeat engagement |
| Guess the Price | Price guessing game | Fun + commerce funnel |
| Naija PriceCheck | Shopping utility | Search + monetization |
| Nigerian Slang Quiz | Culture quiz | Viral + SEO |
| Reaction Time | Mini-game | Addictive replayability |
| Random Decision Maker | Utility/randomizer | Repeat usage |

## 7. How Nigerian Are You?

Shareable personality/culture test.

1. User starts. 2. Questions one at a time, getting funnier/harder. 3. Final percentage plus humorous result category. 4. Share result. 5. Prompted to try another box.

Example: "You are 87% Nigerian: Certified Naija Child." Result page has a shareable result card and a strong **"Try Another Box"** CTA.

## 8. Naija Would You Rather

Two clear choices; after choosing, reveal the aggregate percentage per option.

- Randomized questions.
- Categories: money, relationships, food, university, lifestyle, culture, ridiculous scenarios.
- Shareable individual questions.
- Aggregate stats only where enough response data exists.

## 9. Guess the Price

Show a Nigerian product; user guesses its price (e.g. "iPhone 15, 128GB").

- Reveal actual/reference price; show how far off the guess was.
- Streaks and personal bests.
- Categories: phones, laptops, consoles, TVs, AirPods, cars, everyday products.
- After reveal, CTA into PriceCheck ("Want to see actual prices? Check PriceCheck.").

## 10. Naija PriceCheck

A serious shopping-intelligence utility inside the playful ecosystem. Users search a product (e.g. "iPhone 15 128GB") and see:

- Seller, price, location, new/used condition
- Current price range, average, lowest recorded price
- Price history, last-updated date

**Good-price analysis:** user enters an offered price and gets a plain-language verdict ("That's a very good price" / "That's about ₦120,000 above the current average").

**Monetization:** affiliate links, sponsored sellers, promoted listings, retailer partnerships, display ads. **Paid placements must be clearly labelled.**

## 11. Nigerian Slang Quiz

Show a slang term; user picks its meaning. Ranges from common to youth/internet to harder/older expressions. Difficulty: Easy, Medium, Hard. Humorous, shareable results (e.g. "18/20: You're officially outside."). Slang database must be expandable into a large searchable collection.

## 12. Reaction Time

Deliberately simple. Wait for a visual change, tap fast.

- Show reaction time in ms; personal best.
- Optional comparison against other NaijaBox users; daily challenge; shareable result.
- Example: "243ms: Faster than 72% of NaijaBox players." **Comparisons must use actual recorded data, never fabricated statistics.**

## 13. Random Decision Maker

Custom options or presets: What should I eat? Where should we go? Should I text them? What movie should I watch? What should I buy? Which assignment first? Who should pay? Interaction should be fast and playful, not a generic randomizer.

## 14. Shared question content system

All question-based experiences use one shared system. Questions are **never hard-coded in pages**; they live in a database and load dynamically so the owner can change content without code changes. Supports How Nigerian Are You?, Slang Quiz, Would You Rather and future quizzes/tests.

**Fields:** question text; experience/type; category; tags; answer options; correct answer(s); result/scoring data; difficulty; author/source; content status; created/updated dates; optional moderation metadata.

## 15. Admin content management

Separate admin dashboard where the owner can:

- Create, edit, delete questions
- Publish / unpublish
- Reorder where sequencing matters
- Manage categories and tags
- Set difficulty
- Review submissions: approve, edit, reject, delete
- Review reports
- View question performance statistics

**Adding or changing a question must not require a developer or a redeploy.**

## 16. User-submitted questions

Each relevant experience offers an "Add a Question" action. Form: question text, answer/options (where applicable), category, optional explanation/context, optional display name. Simple and mobile-friendly.

## 17. Moderation workflow

Submissions never go public automatically.

1. Submitted → **Pending**
2. Admin reviews
3. Approve / Edit & Approve / Reject / Delete
4. Approved questions become available

Flags: spam, offensive, duplicate, low quality, incorrect, not relevant, other. Users can also report published questions.

## 18. Community attribution

Approved questions may show "Submitted by @username" or "Submitted by Stephen". Optional and configurable by contributor/admin; anonymous is allowed.

## 19. Categories and tags

Initial categories: Nigerian Culture, Funny, Relationships, University, Money, Food, Football, Lifestyle, Internet/Slang, Other. New categories can be added from the admin dashboard.

## 20. Randomization and replayability

- Randomized selection (e.g. 15 of 100 questions per session); different users get different sequences.
- No repeats within a session.
- Configurable question counts.
- Admin controls randomized vs ordered per experience.
- Pools can grow without UI changes.

## 21. Community statistics

Responses become aggregated anonymous stats (e.g. "62% chose free electricity; 38% chose free data").

- Show only when enough responses exist to be meaningful.
- Never expose private user data.
- Track question-level response rates and answer distributions.

## 22. Question reporting

Every community/public question has a Report action. Reasons: offensive, spam, incorrect, duplicate, doesn't make sense, other. Reports appear in admin moderation.

## 23. Navigation between experiences

No dead ends. Post-experience layout: **Result → Share → Try Again (where appropriate) → Recommended experiences → Back to the Box.** Loop: Experience → Result → Share/Explore → Another Experience → Repeat.

## 24. Sharing

First-class feature. Options: WhatsApp, X, Facebook, Instagram where technically appropriate, Copy link. Links deep-link to the specific experience/result, not the homepage. Result cards must look good screenshotted or posted.

## 25. Accounts

Launch: **no account required.** Play and use tools anonymously; submission may optionally request a display name. Accounts later for saved scores, streaks, leaderboards, favourites, history and PriceCheck alerts. Registration must never be an unnecessary barrier.

## 26. Monetization

Free for users. Revenue from scale and partnerships.

- **Ads:** display ads that don't wreck the experience; no aggressive popups or interstitials, especially during short games.
- **Sponsorship:** brands sponsor experiences or special editions (telcos, banks/fintechs, food, beverage, electronics retail, fashion/lifestyle).
- **Affiliate:** PriceCheck links to legitimate retailers.
- **Promoted listings:** paid visibility on PriceCheck, clearly labelled.

## 27. Analytics

Built in from day one. Track visitors, unique visitors, experience starts, completion rate, session duration, shares, repeat visitors, traffic source, mobile vs desktop, experience-to-experience navigation, question-level response stats, submission volume, moderation volume, most popular experiences and questions. Key question: **"Which box gets opened the most?"**

## 28. Mobile-first

Responsive; fast on mobile networks; large tap targets; minimal typing; lightweight animation; easy share buttons; no unnecessary account creation; works on common Nigerian smartphone screens. Design for traffic from WhatsApp, TikTok, Instagram, X and Google.

## 29. Future expansion

- **Games:** Nigerian Wordle, Guess the Song, Higher or Lower, Memory Game, Mini Chess, Football Trivia.
- **Tests:** Which Nigerian State/Food/Celebrity Are You?, How Lagosian Are You?, Nigerian Relationship Test.
- **Tools:** Salary, Rent, Cost-of-Living, GPA, Fuel and Data calculators.
- **Weird:** Nigerian Name Generator, Excuse Generator, "What Would Your Nigerian Mum Say?", Random Nigerian Argument Generator, "How Long Would You Survive Without Your Phone?"

## 30. Product philosophy

1. **"Would I send this to somebody?"** If yes, it belongs.
2. **"Don't make users work to have fun."** Open it, click something, get a result, laugh, share, open another box.

For tools: open it, understand it immediately, get value quickly, keep exploring if desired.

## 31. Architecture requirements

- Modular experiences; new boxes without restructuring.
- One reusable question/content system.
- Database-driven editable content.
- Admin separated from public UI.
- Moderation states and approval workflow for UGC.
- Analytics at experience and question level.
- No authentication for basic public usage.
- Monetization not coupled to one ad provider.
- Independently deployable; no proprietary website builder/runtime.
- Maintainability and easy addition of new boxes.

## 32. V1 success

**Visitor** can: understand NaijaBox in seconds; start without an account; finish easily on a phone; get a satisfying result; share it; discover another box without going back to search; understand more content exists.

**Owner** can: add, edit, approve, reject, hide and analyze question content without touching source code.

## 33. Handoff note

This PRD is the product source of truth. Do not replace product decisions with assumptions. Where implementation choices are unspecified, identify them as implementation choices (see `DECISIONS.md`) and choose a maintainable solution that preserves the described behaviour.
