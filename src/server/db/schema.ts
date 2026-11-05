import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  pgEnum,
  bigserial,
  date,
  numeric,
  unique,
  index,
} from 'drizzle-orm/pg-core';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const questionTypeEnum = pgEnum('question_type', [
  'personality_scored',
  'quiz_single',
  'would_you_rather',
  'price_guess',
]);

export const selectionModeEnum = pgEnum('selection_mode', ['random', 'ordered']);

export const difficultyEnum = pgEnum('difficulty', ['easy', 'medium', 'hard']);

export const questionStatusEnum = pgEnum('question_status', [
  'draft',
  'pending',
  'published',
  'unpublished',
  'rejected',
  'deleted',
]);

export const questionSourceEnum = pgEnum('question_source', [
  'admin',
  'community',
  'seed',
]);

export const deviceClassEnum = pgEnum('device_class', ['mobile', 'desktop']);

export const conditionEnum = pgEnum('condition', ['new', 'used', 'refurbished']);

export const paidLabelEnum = pgEnum('paid_label', ['sponsored', 'promoted']);

export const userRoleEnum = pgEnum('user_role', ['owner', 'moderator', 'player']);

export const reportReasonEnum = pgEnum('report_reason', [
  'offensive',
  'spam',
  'incorrect',
  'duplicate',
  'unclear',
  'other',
]);

export const reportStatusEnum = pgEnum('report_status', [
  'open',
  'dismissed',
  'actioned',
]);

export const referrerSourceEnum = pgEnum('referrer_source', [
  'whatsapp',
  'tiktok',
  'instagram',
  'x',
  'facebook',
  'google',
  'direct',
  'other',
]);

// ─── Content System ───────────────────────────────────────────────────────────

export const experiences = pgTable('experiences', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: text('key').notNull().unique(),
  title: text('title').notNull(),
  questionType: questionTypeEnum('question_type').notNull(),
  selectionMode: selectionModeEnum('selection_mode').notNull().default('random'),
  questionCount: integer('question_count'),
  isActive: boolean('is_active').notNull().default(true),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
});

export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
});

export const questions = pgTable(
  'questions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    experienceId: uuid('experience_id')
      .notNull()
      .references(() => experiences.id),
    text: text('text').notNull(),
    categoryId: uuid('category_id').references(() => categories.id),
    difficulty: difficultyEnum('difficulty'),
    options: jsonb('options').notNull().default({}),
    correct: jsonb('correct'),
    scoring: jsonb('scoring'),
    explanation: text('explanation'),
    sortOrder: integer('sort_order').notNull().default(0),
    status: questionStatusEnum('status').notNull().default('draft'),
    source: questionSourceEnum('source').notNull().default('admin'),
    authorName: text('author_name'),
    showAttribution: boolean('show_attribution').notNull().default(false),
    submittedBySession: text('submitted_by_session'),
    moderation: jsonb('moderation'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
  },
  (t) => ({
    expStatusIdx: index('questions_exp_status_idx').on(t.experienceId, t.status),
    categoryIdx: index('questions_category_idx').on(t.categoryId),
    statusCreatedIdx: index('questions_status_created_idx').on(t.status, t.createdAt),
  })
);

export const questionTags = pgTable(
  'question_tags',
  {
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: unique().on(t.questionId, t.tagId),
  })
);

// ─── Play Data (anonymous) ────────────────────────────────────────────────────

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
  deviceClass: deviceClassEnum('device_class'),
  referrerSource: referrerSourceEnum('referrer_source'),
  userId: uuid('user_id'),
});

export const responses = pgTable(
  'responses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id),
    sessionId: text('session_id').notNull(),
    experienceId: uuid('experience_id')
      .notNull()
      .references(() => experiences.id),
    answer: jsonb('answer').notNull(),
    isCorrect: boolean('is_correct'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    questionIdx: index('responses_question_idx').on(t.questionId),
    sessionIdx: index('responses_session_idx').on(t.sessionId),
    // Unique per question+session for WYR vote stuffing prevention
    uniqueVote: unique('responses_q_session_unique').on(t.questionId, t.sessionId),
  })
);

export const results = pgTable('results', {
  id: text('id').primaryKey(), // nanoid
  experienceId: uuid('experience_id')
    .notNull()
    .references(() => experiences.id),
  sessionId: text('session_id').notNull(),
  score: numeric('score').notNull(),
  maxScore: numeric('max_score'),
  label: text('label').notNull(),
  displayText: text('display_text').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const reactionResults = pgTable('reaction_results', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: text('session_id').notNull(),
  ms: integer('ms').notNull(),
  isDaily: boolean('is_daily').notNull().default(false),
  challengeDate: date('challenge_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const questionStats = pgTable('question_stats', {
  questionId: uuid('question_id')
    .primaryKey()
    .references(() => questions.id),
  totalResponses: integer('total_responses').notNull().default(0),
  distribution: jsonb('distribution').default({}),
  correctRate: numeric('correct_rate'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Moderation ───────────────────────────────────────────────────────────────

export const questionReports = pgTable('question_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  questionId: uuid('question_id')
    .notNull()
    .references(() => questions.id),
  sessionId: text('session_id').notNull(),
  reason: reportReasonEnum('reason').notNull(),
  note: text('note'),
  status: reportStatusEnum('status').notNull().default('open'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolvedBy: uuid('resolved_by'),
});

// ─── PriceCheck ───────────────────────────────────────────────────────────────

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  brand: text('brand'),
  category: text('category'),
  variant: text('variant'),
  imageUrl: text('image_url'),
  aliases: text('aliases').array().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const sellers = pgTable('sellers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  location: text('location'),
  url: text('url'),
  isPartner: boolean('is_partner').notNull().default(false),
});

export const listings = pgTable(
  'listings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    sellerId: uuid('seller_id').references(() => sellers.id),
    priceNgn: integer('price_ngn').notNull(),
    condition: conditionEnum('condition').notNull().default('new'),
    location: text('location'),
    url: text('url'),
    affiliateUrl: text('affiliate_url'),
    isPaid: boolean('is_paid').notNull().default(false),
    paidLabel: paidLabelEnum('paid_label'),
    source: text('source'),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    isActive: boolean('is_active').notNull().default(true),
  },
  (t) => ({
    productActiveIdx: index('listings_product_active_idx').on(t.productId, t.isActive),
  })
);

export const priceSnapshots = pgTable('price_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  date: date('date').notNull(),
  avgPrice: numeric('avg_price').notNull(),
  minPrice: numeric('min_price').notNull(),
  maxPrice: numeric('max_price').notNull(),
  listingCount: integer('listing_count').notNull(),
});

// ─── Admin and Platform ───────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull().default('moderator'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userFavourites = pgTable(
  'user_favourites',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    boxSlug: text('box_slug').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueUserBox: unique('user_favourites_user_box_unique').on(t.userId, t.boxSlug),
    userIdx: index('user_favourites_user_idx').on(t.userId),
  })
);

export const events = pgTable(
  'events',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    name: text('name').notNull(),
    sessionId: text('session_id').notNull(),
    experienceId: uuid('experience_id'),
    questionId: uuid('question_id'),
    props: jsonb('props').default({}),
    path: text('path'),
    referrerSource: referrerSourceEnum('referrer_source'),
    deviceClass: deviceClassEnum('device_class'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    nameCreatedIdx: index('events_name_created_idx').on(t.name, t.createdAt),
    expCreatedIdx: index('events_exp_created_idx').on(t.experienceId, t.createdAt),
    sessionIdx: index('events_session_idx').on(t.sessionId),
  })
);

export const sponsors = pgTable('sponsors', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  logoUrl: text('logo_url'),
  url: text('url'),
});

export const sponsorships = pgTable('sponsorships', {
  id: uuid('id').defaultRandom().primaryKey(),
  sponsorId: uuid('sponsor_id')
    .notNull()
    .references(() => sponsors.id),
  experienceId: uuid('experience_id').references(() => experiences.id),
  label: text('label').notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  isActive: boolean('is_active').notNull().default(true),
});

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
});

// ─── Type Exports ─────────────────────────────────────────────────────────────

export type Experience = typeof experiences.$inferSelect;
export type InsertExperience = typeof experiences.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = typeof questions.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Response = typeof responses.$inferSelect;
export type Result = typeof results.$inferSelect;
export type InsertResult = typeof results.$inferInsert;
export type ReactionResult = typeof reactionResults.$inferSelect;
export type QuestionStats = typeof questionStats.$inferSelect;
export type QuestionReport = typeof questionReports.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Seller = typeof sellers.$inferSelect;
export type Listing = typeof listings.$inferSelect;
export type PriceSnapshot = typeof priceSnapshots.$inferSelect;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UserFavourite = typeof userFavourites.$inferSelect;
export type InsertUserFavourite = typeof userFavourites.$inferInsert;
export type Event = typeof events.$inferSelect;
export type Setting = typeof settings.$inferSelect;
