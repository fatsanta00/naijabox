# ANALYTICS EVENTS

First-party events (ADR-012) sent via `lib/analytics.ts` using batched `sendBeacon` to `POST /api/public/events`. Every event automatically includes `session_id`, `path`, `referrer_source`, `device_class` and timestamp. No personal data in `props`.

Naming: `snake_case`, past tense for completed actions. `experience` = box slug.

## Core events

| Event | When | Props |
|---|---|---|
| `page_view` | Any public page load | `page_type` (`home`, `box`, `result`, `question`, `about`) |
| `box_card_clicked` | Card tapped on home or recommendations | `experience`, `placement` (`home_grid`, `recommended`, `nav`), `position` |
| `experience_started` | User begins a box | `experience`, `entry` (`direct`, `deep_link`, `recommended`, `retry`) |
| `experience_completed` | Result reached | `experience`, `duration_ms`, `result_id` null |
| `experience_abandoned` | Left before completion (best effort on `pagehide`) | `experience`, `progress_pct` |
| `question_shown` | Question displayed | `experience`, `question_id`, `index` |
| `question_answered` | Answer submitted | `experience`, `question_id`, `index`, `is_correct` null, `time_ms` |
| `result_shown` | Result screen rendered | `experience`, `result_id`, `score`, `label` |
| `share_clicked` | Share button pressed | `experience`, `target` (`whatsapp`, `x`, `facebook`, `copy_link`, `native`, `save_image`), `subject` (`result`, `question`, `box`), `subject_id` |
| `shared_link_opened` | Landing on `/r/*` or `/q/*` | `subject`, `subject_id`, `source` |
| `try_again_clicked` | Try Again pressed | `experience` |
| `recommended_clicked` | Recommended box tapped from end screen | `from_experience`, `to_experience`, `position` |
| `back_to_box_clicked` | Back to the Box pressed | `from_experience` |
| `nav_clicked` | Header navigation used | `item` |

## Box specific

| Event | Props |
|---|---|
| `wyr_voted` | `question_id`, `option_id`, `stats_visible` (bool) |
| `price_guess_submitted` | `question_id`, `guess_ngn`, `diff_pct`, `streak` |
| `price_guess_cta_clicked` | `question_id` (to PriceCheck) |
| `reaction_completed` | `ms`, `is_daily`, `is_personal_best`, `too_soon_count` |
| `decision_made` | `preset` or `custom`, `option_count` |
| `pricecheck_searched` | `query_length`, `results_count`, `matched_product_id` null |
| `pricecheck_product_viewed` | `product_id` |
| `pricecheck_goodprice_checked` | `product_id`, `verdict` (`very_good`, `good`, `fair`, `high`, `very_high`) |
| `pricecheck_outbound_clicked` | `listing_id`, `is_paid`, `paid_label` null, `is_affiliate` |
| `slang_difficulty_selected` | `difficulty` |

## Content and moderation

| Event | Props |
|---|---|
| `submission_started` | `experience` |
| `submission_sent` | `experience`, `has_name`, `category_id` |
| `submission_failed` | `experience`, `reason` (`validation`, `rate_limit`, `server`) |
| `report_sent` | `question_id`, `reason` |
| `admin_question_created` / `_updated` / `_published` / `_unpublished` / `_deleted` | `question_id`, `experience` |
| `admin_submission_approved` / `_edited_approved` / `_rejected` / `_deleted` | `question_id`, `flags` |
| `admin_report_dismissed` / `_actioned` | `report_id` |

Admin events are recorded server side from the admin API, not from the browser.

## Monetization

| Event | Props |
|---|---|
| `ad_slot_rendered` | `placement`, `provider` |
| `ad_clicked` | `placement`, `provider` (only where provider callbacks allow it) |
| `sponsor_badge_viewed` | `sponsor_id`, `experience` |
| `sponsor_clicked` | `sponsor_id`, `experience` |

## Derived metrics (computed in SQL, not sent)

| Metric | Definition |
|---|---|
| Unique visitors | Distinct `session_id` per period |
| Repeat visitors | Sessions with events on 2+ distinct days |
| Completion rate | `experience_completed` / `experience_started` per box |
| Avg session duration | Last minus first event per session |
| Cross-box navigation | `recommended_clicked` and `box_card_clicked` flows between boxes |
| Share rate | `share_clicked` / `result_shown` |
| Most opened box | Count of `experience_started` by `experience` |
| Most popular questions | Count of `question_answered` and share count by `question_id` |
| Traffic source | `referrer_source` bucket: `whatsapp`, `tiktok`, `instagram`, `x`, `facebook`, `google`, `direct`, `other` |

## Rules

- Every box must emit at least: `experience_started`, `question_answered` (if applicable), `experience_completed`, `result_shown`, `share_clicked`, and the navigation events.
- Never log free-text user input (PriceCheck queries log length and match only, submissions are stored in `questions`, not events).
- Respect Do Not Track / consent settings if consent handling is added later (new ADR).
- Raw events retained 13 months, then aggregated (ADR-012).
