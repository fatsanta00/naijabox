# DATA_MODEL

PostgreSQL via Drizzle. Types are indicative; the Drizzle schema in `src/server/db/` is the executable source once written. Timestamps are `timestamptz`. IDs are UUID unless noted.

## Config constants

| Name | Default | Meaning |
|---|---|---|
| `MIN_STATS_SAMPLE` | 30 | Minimum responses before a distribution or percentile is shown publicly |
| `DEFAULT_QUESTION_COUNT` | 15 | Fallback count when an experience has none set |

## Content system

### experiences
| Column | Type | Notes |
|---|---|---|
| id | uuid pk | |
| key | text unique | matches `BoxDefinition.experienceKey`, e.g. `slang-quiz` |
| title | text | |
| question_type | enum | `personality_scored`, `quiz_single`, `would_you_rather`, `price_guess` |
| selection_mode | enum | `random` or `ordered` (admin controlled) |
| question_count | int null | per session; null = all |
| is_active | bool | |
| settings | jsonb | result bands, labels, copy |

### categories
`id`, `slug` unique, `name`, `sort_order`, `is_active`. Seeded with: Nigerian Culture, Funny, Relationships, University, Money, Food, Football, Lifestyle, Internet/Slang, Other. Admin can add more.

### tags and question_tags
`tags(id, slug unique, name)`; `question_tags(question_id, tag_id)`.

### questions
| Column | Type | Notes |
|---|---|---|
| id | uuid pk | |
| experience_id | fk experiences | |
| text | text | the question or slang term or product title |
| category_id | fk categories null | |
| difficulty | enum null | `easy`, `medium`, `hard` |
| options | jsonb | see payloads below |
| correct | jsonb null | correct option id(s) where applicable |
| scoring | jsonb null | points per option or result mapping |
| explanation | text null | shown after answer or from submitter context |
| sort_order | int | used when `selection_mode = ordered` |
| status | enum | `draft`, `pending`, `published`, `unpublished`, `rejected`, `deleted` |
| source | enum | `admin`, `community`, `seed` |
| author_name | text null | display name |
| show_attribution | bool | default false unless contributor opted in |
| submitted_by_session | text null | internal only, never exposed |
| moderation | jsonb null | flags, notes, reviewer, reviewed_at |
| created_at, updated_at | timestamptz | |
| published_at | timestamptz null | |

Status transitions:

```
community submit: pending ─► published (approve / edit & approve)
                         ─► rejected
                         ─► deleted
admin create:     draft ─► published ◄─► unpublished
```

Public queries return only `status = 'published'`. Soft delete keeps analytics integrity; hard purge is an admin action.

### Option and scoring payloads (validated with Zod)

```jsonc
// quiz_single (slang quiz)
{ "options": [{ "id": "a", "text": "..." }, ...], "correct": ["b"] }

// would_you_rather
{ "options": [{ "id": "a", "text": "Unlimited data" }, { "id": "b", "text": "Unlimited electricity" }] }

// personality_scored (How Nigerian Are You?)
{ "options": [{ "id": "a", "text": "...", "points": 3 }, ...] }
// experiences.settings.bands: [{ "min": 0, "max": 20, "label": "..." }, ...]

// price_guess
{ "item": { "name": "iPhone 15 128GB", "image_url": "..." },
  "reference_price_ngn": 1200000, "price_as_of": "2026-10-01", "price_source": "..." }
```

## Play data (anonymous)

### sessions
`id` (text, from cookie), `first_seen_at`, `last_seen_at`, `device_class` (`mobile`/`desktop`), `referrer_source`, `user_id` null (future).

### responses
`id`, `question_id`, `session_id`, `experience_id`, `answer` jsonb (option id or guess number), `is_correct` bool null, `created_at`. Unique `(question_id, session_id)` for Would You Rather to prevent vote stuffing.

### results
`id` (nanoid, public), `experience_id`, `session_id`, `score` numeric, `max_score` numeric null, `label` text, `display_text` text, `created_at`.

### reaction_results
`id`, `session_id`, `ms` int, `is_daily` bool, `challenge_date` date null, `created_at`.

### question_stats (aggregate, refreshed by job)
`question_id`, `total_responses`, `distribution` jsonb, `correct_rate` numeric null, `updated_at`. Public API exposes `distribution` only if `total_responses >= MIN_STATS_SAMPLE`.

## Moderation

### question_reports
`id`, `question_id`, `session_id`, `reason` enum (`offensive`, `spam`, `incorrect`, `duplicate`, `unclear`, `other`), `note` text null, `status` enum (`open`, `dismissed`, `actioned`), `created_at`, `resolved_at`, `resolved_by`.

### Moderation flags (in `questions.moderation.flags`)
`spam`, `offensive`, `duplicate`, `low_quality`, `incorrect`, `not_relevant`, `other`.

## PriceCheck

### products
`id`, `slug` unique, `name`, `brand`, `category`, `variant` (e.g. 128GB), `image_url`, `aliases` text[] for search.

### sellers
`id`, `name`, `location`, `url`, `is_partner` bool.

### listings
`id`, `product_id`, `seller_id`, `price_ngn` int, `condition` enum (`new`, `used`, `refurbished`), `location`, `url`, `affiliate_url` null, `is_paid` bool, `paid_label` enum (`sponsored`, `promoted`) null, `source`, `last_seen_at`, `is_active`.

### price_snapshots
`id`, `product_id`, `date`, `avg_price`, `min_price`, `max_price`, `listing_count`. Drives price history.

Rules: any listing with `is_paid = true` must have `paid_label` set; UI refuses to render a paid listing without a label.

## Admin and platform

### users
`id`, `email` unique, `password_hash`, `role` enum (`owner`, `moderator`), `created_at`. Only admin users at launch.

### events
`id` bigserial, `name`, `session_id`, `experience_id` null, `question_id` null, `props` jsonb, `path`, `referrer_source`, `device_class`, `created_at`. Partitioned by month once volume warrants it.

### sponsors and sponsorships
`sponsors(id, name, logo_url, url)`; `sponsorships(id, sponsor_id, experience_id null, label, starts_at, ends_at, is_active)`.

### settings
`key` pk, `value` jsonb. Holds ad config, feature toggles and the minimum sample override.

## Indexes (minimum)

- `questions(experience_id, status)`, `questions(category_id)`, `questions(status, created_at)` for the moderation queue
- `responses(question_id)`, `responses(session_id)`
- `events(name, created_at)`, `events(experience_id, created_at)`
- `listings(product_id, is_active)`, GIN on `products.aliases` and trigram on `products.name`
