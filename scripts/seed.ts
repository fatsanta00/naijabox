/**
 * Seed script — dev only.
 * All content is flagged source='seed' for owner review before launch.
 * Run: pnpm db:seed
 */
import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../src/server/db/schema';
import { hashPassword } from '../src/server/auth/password';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');

const sql = postgres(connectionString, { max: 1 });
const db = drizzle(sql, { schema });

// ─── Helper ───────────────────────────────────────────────────────────────────

async function upsertExperience(data: schema.InsertExperience) {
  const [exp] = await db
    .insert(schema.experiences)
    .values(data)
    .onConflictDoUpdate({ target: schema.experiences.key, set: { ...data } })
    .returning();
  return exp;
}

async function upsertCategory(data: schema.InsertCategory) {
  const [cat] = await db
    .insert(schema.categories)
    .values(data)
    .onConflictDoUpdate({ target: schema.categories.slug, set: { name: data.name } })
    .returning();
  return cat;
}

async function insertQ(data: schema.InsertQuestion) {
  await db.insert(schema.questions).values(data).onConflictDoNothing();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding NaijaBox database...');

  // ── Admin user (Development Only) ─────────────────────────────────────────
  // WARNING: In production, do NOT rely on default credentials in seed.ts!
  // Always use `pnpm admin:create-owner` or pass explicit secure ADMIN_EMAIL/ADMIN_PASSWORD.
  const adminEmail = process.env.ADMIN_EMAIL || 'owner@naijabox.app';
  const adminPassword = process.env.ADMIN_PASSWORD || 'naijabox_admin_secret_123';
  if (process.env.NODE_ENV === 'production' && adminPassword === 'naijabox_admin_secret_123') {
    throw new Error('SECURITY VIOLATION: Default admin password cannot be used in production! Set ADMIN_PASSWORD or use scripts/create-owner.ts.');
  }
  const passwordHash = await hashPassword(adminPassword);

  await db
    .insert(schema.users)
    .values({ email: adminEmail, passwordHash, role: 'owner' })
    .onConflictDoUpdate({ target: schema.users.email, set: { passwordHash, role: 'owner' } });
  console.log(`✓ Admin user: ${adminEmail}`);

  // ── Categories ───────────────────────────────────────────────────────────
  const categoryData: schema.InsertCategory[] = [
    { slug: 'nigerian-culture', name: 'Nigerian Culture', sortOrder: 1 },
    { slug: 'funny', name: 'Funny', sortOrder: 2 },
    { slug: 'relationships', name: 'Relationships', sortOrder: 3 },
    { slug: 'university', name: 'University', sortOrder: 4 },
    { slug: 'money', name: 'Money', sortOrder: 5 },
    { slug: 'food', name: 'Food', sortOrder: 6 },
    { slug: 'football', name: 'Football', sortOrder: 7 },
    { slug: 'lifestyle', name: 'Lifestyle', sortOrder: 8 },
    { slug: 'internet-slang', name: 'Internet/Slang', sortOrder: 9 },
    { slug: 'other', name: 'Other', sortOrder: 10 },
  ];

  const cats: Record<string, string> = {};
  for (const c of categoryData) {
    const cat = await upsertCategory(c);
    cats[c.slug] = cat.id;
  }
  console.log(`✓ ${categoryData.length} categories`);

  // ── Default settings ─────────────────────────────────────────────────────
  await db
    .insert(schema.settings)
    .values([
      { key: 'min_stats_sample', value: Number(process.env.MIN_STATS_SAMPLE || 30) },
      { key: 'ads_enabled', value: process.env.NEXT_PUBLIC_ADS_ENABLED === 'true' },
      { key: 'ad_provider', value: process.env.AD_PROVIDER || 'none' },
    ])
    .onConflictDoNothing();

  // ── Experiences ──────────────────────────────────────────────────────────

  // How Nigerian Are You?
  const howNigerian = await upsertExperience({
    key: 'how-nigerian',
    title: 'How Nigerian Are You?',
    questionType: 'personality_scored',
    selectionMode: 'random',
    questionCount: 15,
    settings: {
      bands: [
        { min: 0, max: 20, label: 'International Man of Mystery', emoji: '🌍' },
        { min: 21, max: 40, label: 'Still Loading', emoji: '📡' },
        { min: 41, max: 60, label: 'Half-Nigerian', emoji: '🤝' },
        { min: 61, max: 80, label: 'Certified Naija Child', emoji: '🔥' },
        { min: 81, max: 100, label: '100% Naija. No Refunds', emoji: '🇳🇬' },
      ],
    },
  });

  // Would You Rather
  const wyr = await upsertExperience({
    key: 'would-you-rather',
    title: 'Naija Would You Rather',
    questionType: 'would_you_rather',
    selectionMode: 'random',
    questionCount: null,
  });

  // Slang Quiz
  const slangQuiz = await upsertExperience({
    key: 'slang-quiz',
    title: 'Nigerian Slang Quiz',
    questionType: 'quiz_single',
    selectionMode: 'random',
    questionCount: 15,
    settings: {
      resultLabels: [
        { min: 0, max: 6, label: 'E don do — you need orientation', emoji: '😂' },
        { min: 7, max: 10, label: 'You dey try small', emoji: '👍' },
        { min: 11, max: 13, label: 'Almost Outside', emoji: '🔥' },
        { min: 14, max: 15, label: "You're officially outside", emoji: '🏆' },
      ],
    },
  });

  // Guess the Price
  const guessPrice = await upsertExperience({
    key: 'guess-the-price',
    title: 'Guess the Price',
    questionType: 'price_guess',
    selectionMode: 'random',
    questionCount: 10,
  });

  // Which Nigerian Food Are You?
  const foodPersonality = await upsertExperience({
    key: 'food-personality',
    title: 'Which Nigerian Food Are You?',
    questionType: 'personality_scored',
    selectionMode: 'random',
    questionCount: 10,
    settings: {
      bands: [
        { min: 0, max: 20, label: 'Cold Garri & Groundnut', emoji: '🥣' },
        { min: 21, max: 40, label: 'Midnight Indomie & Fried Egg', emoji: '🍜' },
        { min: 41, max: 60, label: 'Hot Suya with Extra Yaji', emoji: '🥩' },
        { min: 61, max: 80, label: 'Pounded Yam & Egusi Soup', emoji: '🍲' },
        { min: 81, max: 100, label: 'Smoky Party Jollof Rice', emoji: '🍛' },
      ],
    },
  });

  console.log('✓ Experiences created');

  // ── How Nigerian Are You? questions ──────────────────────────────────────
  const howNigerianQuestions: schema.InsertQuestion[] = [
    {
      experienceId: howNigerian.id,
      text: 'What do you call the midday meal?',
      categoryId: cats['nigerian-culture'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'Lunch', points: 0 },
        { id: 'b', text: 'Food', points: 1 },
        { id: 'c', text: 'Afternoon chop', points: 2 },
        { id: 'd', text: 'Just wait — my mama is cooking', points: 3 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: howNigerian.id,
      text: 'NEPA takes light at 8pm. What do you do?',
      categoryId: cats['nigerian-culture'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'Call the electricity company to complain', points: 0 },
        { id: 'b', text: 'Switch on the generator immediately', points: 2 },
        { id: 'c', text: 'Shout "UP NEPA!" when it comes back', points: 3 },
        { id: 'd', text: 'Go to sleep', points: 1 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: howNigerian.id,
      text: 'Someone tells you "we will do it tomorrow." You believe them?',
      categoryId: cats['nigerian-culture'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'Of course — a promise is a promise', points: 0 },
        { id: 'b', text: "I'll wait and see", points: 1 },
        { id: 'c', text: 'African time is real', points: 2 },
        { id: 'd', text: 'Not unless they say which tomorrow', points: 3 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: howNigerian.id,
      text: 'How do you eat pounded yam?',
      categoryId: cats['food'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'With a fork and knife', points: 0 },
        { id: 'b', text: 'With a spoon', points: 1 },
        { id: 'c', text: 'With my right hand, wrap it, dip it in egusi', points: 3 },
        { id: 'd', text: 'I don\'t eat pounded yam', points: 0 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: howNigerian.id,
      text: "Your uncle's wife's cousin calls you at 2am. You pick up?",
      categoryId: cats['relationships'],
      difficulty: 'medium',
      options: [
        { id: 'a', text: 'No — it\'s 2am', points: 0 },
        { id: 'b', text: 'Maybe — I\'ll check if I know the number', points: 1 },
        { id: 'c', text: 'Family is family — I pick up', points: 2 },
        { id: 'd', text: 'Pick up and ask if they need money they want to send me', points: 3 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: howNigerian.id,
      text: 'What\'s the correct response when an elder greets you?',
      categoryId: cats['nigerian-culture'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'Just wave', points: 0 },
        { id: 'b', text: 'Say hello back casually', points: 1 },
        { id: 'c', text: 'Kneel or bow slightly and respond properly', points: 3 },
        { id: 'd', text: 'Shake hands firmly', points: 2 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: howNigerian.id,
      text: "The match is 90+5 minutes, Nigeria is drawing. You pray or panic?",
      categoryId: cats['football'],
      difficulty: 'medium',
      options: [
        { id: 'a', text: 'Stay calm — football is just a game', points: 0 },
        { id: 'b', text: 'Panic, obviously', points: 2 },
        { id: 'c', text: 'Pray, pace, argue with the TV — all at once', points: 3 },
        { id: 'd', text: 'Check the odds on Bet9ja', points: 2 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: howNigerian.id,
      text: 'You arrive at a party. What time was it supposed to start?',
      categoryId: cats['lifestyle'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'I arrived on time — 4pm sharp', points: 0 },
        { id: 'b', text: '4pm but I came at 5:30pm', points: 2 },
        { id: 'c', text: '4pm but I came at 7pm — the food was just arriving', points: 3 },
        { id: 'd', text: 'I came early at 3pm to help set up', points: 1 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: howNigerian.id,
      text: 'Stranger sneezes near you. What do you say?',
      categoryId: cats['nigerian-culture'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'Nothing — none of my business', points: 0 },
        { id: 'b', text: '"Bless you"', points: 1 },
        { id: 'c', text: '"Ewoo! You sick?"', points: 2 },
        { id: 'd', text: '"Ndo. God bless you"', points: 3 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: howNigerian.id,
      text: 'How do you respond when someone says "how far"?',
      categoryId: cats['internet-slang'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'I look confused', points: 0 },
        { id: 'b', text: '"I\'m fine, thank you"', points: 1 },
        { id: 'c', text: '"Omo e don far o"', points: 2 },
        { id: 'd', text: '"I dey" or "No be small"', points: 3 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: howNigerian.id,
      text: 'You hear "manage it" from someone giving you food. What happens?',
      categoryId: cats['nigerian-culture'],
      difficulty: 'medium',
      options: [
        { id: 'a', text: 'I refuse politely — I came with my own food', points: 0 },
        { id: 'b', text: 'I accept and eat everything on the plate', points: 3 },
        { id: 'c', text: 'I eat half and say I\'m full', points: 1 },
        { id: 'd', text: 'I manage it and lick the plate', points: 3 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: howNigerian.id,
      text: "Your parents find out you're not yet married at 30. What happens next?",
      categoryId: cats['relationships'],
      difficulty: 'medium',
      options: [
        { id: 'a', text: 'They\'re totally fine with it', points: 0 },
        { id: 'b', text: 'Mild concern, a gentle question or two', points: 1 },
        { id: 'c', text: 'Prayer sessions begin. Aunties are mobilized', points: 3 },
        { id: 'd', text: 'Emergency family meeting is called', points: 2 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: howNigerian.id,
      text: 'How do you bargain at the market?',
      categoryId: cats['money'],
      difficulty: 'medium',
      options: [
        { id: 'a', text: 'Pay the first price they say', points: 0 },
        { id: 'b', text: 'Ask for a small discount politely', points: 1 },
        { id: 'c', text: 'Counter with half the price and work up slowly', points: 3 },
        { id: 'd', text: 'Pretend to walk away and wait for them to call me back', points: 3 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: howNigerian.id,
      text: 'Somebody is driving badly. What is your reaction?',
      categoryId: cats['lifestyle'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'Stay calm and give way', points: 0 },
        { id: 'b', text: 'Honk once and move on', points: 1 },
        { id: 'c', text: 'Full window-down argument', points: 3 },
        { id: 'd', text: 'Overtake them and give them a look', points: 2 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: howNigerian.id,
      text: 'What do you say when you\'re about to eat and someone walks in?',
      categoryId: cats['nigerian-culture'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'I ignore them and keep eating', points: 0 },
        { id: 'b', text: '"Join me" — and mean it', points: 2 },
        { id: 'c', text: '"Come and eat!" — even if you don\'t have enough', points: 3 },
        { id: 'd', text: 'Ask if they want some', points: 1 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: howNigerian.id,
      text: 'What does "sha" mean at the end of a sentence?',
      categoryId: cats['internet-slang'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'Nothing — it\'s just noise', points: 0 },
        { id: 'b', text: 'A polite ending like "please"', points: 1 },
        { id: 'c', text: 'Emphasis — "just do it sha"', points: 3 },
        { id: 'd', text: 'An expression of frustration only', points: 1 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: howNigerian.id,
      text: 'Someone shares food with you "touch and follow". What does that mean?',
      categoryId: cats['nigerian-culture'],
      difficulty: 'hard',
      options: [
        { id: 'a', text: 'Eat and follow them home', points: 0 },
        { id: 'b', text: 'A tiny, barely-enough portion', points: 3 },
        { id: 'c', text: 'Food that tastes amazing', points: 1 },
        { id: 'd', text: 'Sharing equally among many people', points: 1 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: howNigerian.id,
      text: 'It\'s December 25. Correct attire?',
      categoryId: cats['nigerian-culture'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'Jeans and a t-shirt', points: 0 },
        { id: 'b', text: 'Something warm — it\'s cold', points: 0 },
        { id: 'c', text: 'Full Christmas-special Ankara or lace outfit', points: 3 },
        { id: 'd', text: 'Whatever — I\'m staying home', points: 1 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: howNigerian.id,
      text: 'What happens if you call an elder by their first name?',
      categoryId: cats['nigerian-culture'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'Nothing — names are names', points: 0 },
        { id: 'b', text: 'They correct me gently', points: 1 },
        { id: 'c', text: 'I will hear it — from them and everyone nearby', points: 3 },
        { id: 'd', text: 'A long talk about respect follows', points: 2 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: howNigerian.id,
      text: 'Describe "eba" to a foreigner in one sentence.',
      categoryId: cats['food'],
      difficulty: 'medium',
      options: [
        { id: 'a', text: 'I cannot — I don\'t know what that is', points: 0 },
        { id: 'b', text: 'A Nigerian swallow made from cassava flakes', points: 2 },
        { id: 'c', text: 'Life itself, served with egusi or okra soup', points: 3 },
        { id: 'd', text: 'Garri soaked in hot water — very nutritious', points: 2 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
  ];

  for (const q of howNigerianQuestions) {
    await insertQ(q);
  }
  console.log(`✓ ${howNigerianQuestions.length} "How Nigerian" questions`);

  // ── Would You Rather questions ───────────────────────────────────────────
  const wyrQuestions: schema.InsertQuestion[] = [
    {
      experienceId: wyr.id,
      text: 'Would you rather have free data for life or free electricity for life?',
      categoryId: cats['lifestyle'],
      options: [
        { id: 'a', text: 'Free data for life' },
        { id: 'b', text: 'Free electricity for life' },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: wyr.id,
      text: 'Would you rather eat jollof rice at every meal for a year or never eat jollof again?',
      categoryId: cats['food'],
      options: [
        { id: 'a', text: 'Jollof at every meal for a year' },
        { id: 'b', text: 'Never eat jollof again' },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: wyr.id,
      text: 'Would you rather have NEPA take your light during a big game or during a heatwave?',
      categoryId: cats['nigerian-culture'],
      options: [
        { id: 'a', text: 'During a big game' },
        { id: 'b', text: 'During a heatwave' },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: wyr.id,
      text: 'Would you rather be stuck in Lagos traffic for 3 hours or miss a flight?',
      categoryId: cats['lifestyle'],
      options: [
        { id: 'a', text: 'Stuck in Lagos traffic for 3 hours' },
        { id: 'b', text: 'Miss a flight' },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: wyr.id,
      text: "Would you rather have your mum see your CGPA or see your WhatsApp chats?",
      categoryId: cats['university'],
      options: [
        { id: 'a', text: 'She sees my CGPA' },
        { id: 'b', text: 'She sees my WhatsApp chats' },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: wyr.id,
      text: 'Would you rather know what everyone thinks of you or never know?',
      categoryId: cats['relationships'],
      options: [
        { id: 'a', text: 'Know exactly what everyone thinks of me' },
        { id: 'b', text: 'Never know what anyone thinks of me' },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: wyr.id,
      text: 'Would you rather get ₦500,000 today or ₦5,000,000 in five years?',
      categoryId: cats['money'],
      options: [
        { id: 'a', text: '₦500,000 today' },
        { id: 'b', text: '₦5,000,000 in five years' },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: wyr.id,
      text: "Would you rather live with your Nigerian parents forever or live alone but never eat their food again?",
      categoryId: cats['relationships'],
      options: [
        { id: 'a', text: "Live with parents forever" },
        { id: 'b', text: "Live alone, no parents' food ever again" },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: wyr.id,
      text: 'Would you rather have a job that pays ₦1M/month doing boring work or ₦200K doing what you love?',
      categoryId: cats['money'],
      options: [
        { id: 'a', text: '₦1M/month — boring work' },
        { id: 'b', text: '₦200K — doing what I love' },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: wyr.id,
      text: 'Would you rather fail a course and retake it quietly or fail loudly in front of your entire class?',
      categoryId: cats['university'],
      options: [
        { id: 'a', text: 'Fail and retake it quietly' },
        { id: 'b', text: 'Fail loudly in front of my entire class' },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: wyr.id,
      text: 'Would you rather support Nigeria and lose or not watch football at all?',
      categoryId: cats['football'],
      options: [
        { id: 'a', text: "Support Nigeria and lose every time" },
        { id: 'b', text: "Not watch football at all" },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: wyr.id,
      text: 'Would you rather have a generator that never runs out of fuel or a solar panel that charges everything?',
      categoryId: cats['lifestyle'],
      options: [
        { id: 'a', text: 'Generator that never runs out of fuel' },
        { id: 'b', text: 'Solar panel that charges everything' },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: wyr.id,
      text: "Would you rather text someone to break up or do it face-to-face?",
      categoryId: cats['relationships'],
      options: [
        { id: 'a', text: 'Text — less drama' },
        { id: 'b', text: 'Face-to-face — it\'s the respectful thing' },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: wyr.id,
      text: 'Would you rather speak Pidgin only for a week or speak only English in a market?',
      categoryId: cats['nigerian-culture'],
      options: [
        { id: 'a', text: 'Pidgin only for a week' },
        { id: 'b', text: 'Only English in a market — every day' },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: wyr.id,
      text: 'Would you rather be chronically early to everything or always exactly 1 hour late?',
      categoryId: cats['lifestyle'],
      options: [
        { id: 'a', text: 'Chronically early to everything' },
        { id: 'b', text: 'Always exactly 1 hour late' },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: wyr.id,
      text: "Would you rather your Nigerian auntie know your salary or know your relationship status?",
      categoryId: cats['funny'],
      options: [
        { id: 'a', text: 'She knows my salary' },
        { id: 'b', text: 'She knows my relationship status' },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: wyr.id,
      text: 'Would you rather eat pepper soup with no pepper or suya with no suya spice?',
      categoryId: cats['food'],
      options: [
        { id: 'a', text: 'Pepper soup with no pepper' },
        { id: 'b', text: 'Suya with no suya spice' },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: wyr.id,
      text: 'Would you rather have no internet for a month or no money for a month (basic needs covered)?',
      categoryId: cats['lifestyle'],
      options: [
        { id: 'a', text: 'No internet for a month' },
        { id: 'b', text: 'No money for a month (basics covered)' },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: wyr.id,
      text: 'Would you rather attend a wedding where the aso-ebi clashes with yours or skip it entirely?',
      categoryId: cats['nigerian-culture'],
      options: [
        { id: 'a', text: 'Attend — aso-ebi clash and all' },
        { id: 'b', text: 'Skip it entirely' },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: wyr.id,
      text: 'Would you rather work for a startup with equity or a big company with a big salary?',
      categoryId: cats['money'],
      options: [
        { id: 'a', text: 'Startup with equity' },
        { id: 'b', text: 'Big company, big salary' },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
  ];

  for (const q of wyrQuestions) {
    await insertQ(q);
  }
  console.log(`✓ ${wyrQuestions.length} "Would You Rather" questions`);

  // ── Slang Quiz questions ─────────────────────────────────────────────────
  const slangQuestions: schema.InsertQuestion[] = [
    {
      experienceId: slangQuiz.id,
      text: 'Omo',
      categoryId: cats['internet-slang'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'An exclamation of surprise or emphasis' },
        { id: 'b', text: 'A type of fabric' },
        { id: 'c', text: 'A person who wears glasses' },
        { id: 'd', text: 'To run very fast' },
      ],
      correct: ['a'],
      explanation: '"Omo" is a versatile Yoruba exclamation used throughout Nigeria for surprise, emphasis or just vibes.',
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: slangQuiz.id,
      text: 'Sapa',
      categoryId: cats['money'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'A type of soup' },
        { id: 'b', text: 'The state of being broke / extreme poverty', },
        { id: 'c', text: 'A popular fashion style' },
        { id: 'd', text: 'A fast-talking person' },
      ],
      correct: ['b'],
      explanation: 'Sapa hit Nigerian internet culture hard — it\'s that state when your account balance is mocking you.',
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: slangQuiz.id,
      text: 'Japa',
      categoryId: cats['internet-slang'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'To jump very high' },
        { id: 'b', text: 'A style of cooking' },
        { id: 'c', text: 'To emigrate, especially to a Western country' },
        { id: 'd', text: 'Running away from an embarrassing situation' },
      ],
      correct: ['c'],
      explanation: '"Japa" originally means "to run" in Yoruba but evolved to specifically mean relocating abroad for a better life.',
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: slangQuiz.id,
      text: 'Ajala',
      categoryId: cats['nigerian-culture'],
      difficulty: 'medium',
      options: [
        { id: 'a', text: 'A person who travels frequently and loves adventure' },
        { id: 'b', text: 'A type of traditional hat' },
        { id: 'c', text: 'Someone who eats too much' },
        { id: 'd', text: 'An old Yoruba king' },
      ],
      correct: ['a'],
      explanation: 'Named after Thomas Ajala, a famous Nigerian traveller who visited 87 countries on a motorcycle.',
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: slangQuiz.id,
      text: 'Packaging',
      categoryId: cats['internet-slang'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'Putting things in boxes' },
        { id: 'b', text: 'Pretending to be richer or more successful than you are' },
        { id: 'c', text: 'Dressing up for an event' },
        { id: 'd', text: 'Keeping secrets from a partner' },
      ],
      correct: ['b'],
      explanation: 'When someone is "packaging," they\'re performing a lifestyle they can\'t fully afford.',
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: slangQuiz.id,
      text: 'Oya',
      categoryId: cats['nigerian-culture'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'A word meaning "slowly"' },
        { id: 'b', text: 'An urgent call to action — "come on", "let\'s go", "now"' },
        { id: 'c', text: 'A term of endearment' },
        { id: 'd', text: 'A greeting word' },
      ],
      correct: ['b'],
      explanation: '"Oya" is one of the most versatile words in Nigerian English — it means hurry up, let\'s go, or "okay then."',
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: slangQuiz.id,
      text: 'Agbero',
      categoryId: cats['nigerian-culture'],
      difficulty: 'medium',
      options: [
        { id: 'a', text: 'A local government official' },
        { id: 'b', text: 'A person who manages or extorts money at motor parks' },
        { id: 'c', text: 'A type of large bag' },
        { id: 'd', text: 'A traditional healer' },
      ],
      correct: ['b'],
      explanation: 'Agberos are the tout-like figures at Lagos motor parks — better to have them on your side.',
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: slangQuiz.id,
      text: 'Buga',
      categoryId: cats['internet-slang'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'To beg someone insistently' },
        { id: 'b', text: 'To show off, flex or flaunt your success' },
        { id: 'c', text: 'To dance alone at a party' },
        { id: 'd', text: 'A type of traditional instrument' },
      ],
      correct: ['b'],
      explanation: 'Popularized by Kizz Daniel\'s hit song "Buga" — it means to flex, show off, and enjoy your success unapologetically.',
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: slangQuiz.id,
      text: 'Shayo',
      categoryId: cats['lifestyle'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'Food prepared for a celebration' },
        { id: 'b', text: 'Alcohol or getting drunk' },
        { id: 'c', text: 'A style of dancing' },
        { id: 'd', text: 'Feeling very sleepy' },
      ],
      correct: ['b'],
      explanation: '"Shayo" or "shayor" means alcohol or being drunk — "e don shayo" means he\'s wasted.',
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: slangQuiz.id,
      text: 'Scatter',
      categoryId: cats['internet-slang'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'To destroy or thoroughly embarrass someone in an argument' },
        { id: 'b', text: 'To share food among many people' },
        { id: 'c', text: 'To leave a gathering quickly' },
        { id: 'd', text: 'To lose something valuable' },
      ],
      correct: ['a'],
      explanation: '"She scattered him in the comments" means she thoroughly destroyed him — it\'s a compliment to the scatterer.',
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: slangQuiz.id,
      text: 'Wuru-wuru',
      categoryId: cats['nigerian-culture'],
      difficulty: 'medium',
      options: [
        { id: 'a', text: 'A type of stew' },
        { id: 'b', text: 'Crooked, suspicious or fraudulent dealing' },
        { id: 'c', text: 'To move or dance quickly' },
        { id: 'd', text: 'Noise made by a crowd' },
      ],
      correct: ['b'],
      explanation: '"No wuru-wuru" means no shady business — keep it straight and transparent.',
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: slangQuiz.id,
      text: 'Waka',
      categoryId: cats['nigerian-culture'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'To walk or go somewhere / also "goodbye"' },
        { id: 'b', text: 'A type of music' },
        { id: 'c', text: 'A disrespectful gesture' },
        { id: 'd', text: 'Being very hungry' },
      ],
      correct: ['a'],
      explanation: '"Waka" means to walk or leave. "Waka well" is a farewell, sometimes sarcastic.',
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: slangQuiz.id,
      text: 'Mumu',
      categoryId: cats['funny'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'A traditional dance' },
        { id: 'b', text: 'A foolish or gullible person' },
        { id: 'c', text: 'Someone who talks too much' },
        { id: 'd', text: 'A type of local food' },
      ],
      correct: ['b'],
      explanation: '"Mumu" means a fool or someone easily deceived. "Don\'t mumu yourself" means don\'t be foolish.',
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: slangQuiz.id,
      text: 'Comot',
      categoryId: cats['nigerian-culture'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'To come here' },
        { id: 'b', text: 'To leave, move away, or get out of the way' },
        { id: 'c', text: 'To vomit' },
        { id: 'd', text: 'To speak very fast' },
      ],
      correct: ['b'],
      explanation: '"Comot" is Pidgin for "come out" — used to mean get out, leave, or clear the way.',
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: slangQuiz.id,
      text: 'Yahoo-Yahoo',
      categoryId: cats['internet-slang'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'Internet fraud, scamming' },
        { id: 'b', text: 'Using Yahoo email exclusively' },
        { id: 'c', text: 'A type of online game popular in Nigeria' },
        { id: 'd', text: 'Talking too much on the phone' },
      ],
      correct: ['a'],
      explanation: 'Yahoo-Yahoo refers to internet fraud, often 419 scams. The term predates the email platform\'s decline.',
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: slangQuiz.id,
      text: 'Ehen',
      categoryId: cats['nigerian-culture'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'A way to express "finally" or "exactly" or signal agreement' },
        { id: 'b', text: 'An expression of pain' },
        { id: 'c', text: 'A dismissive response meaning "I don\'t care"' },
        { id: 'd', text: 'A greeting for elderly people' },
      ],
      correct: ['a'],
      explanation: '"Ehen" is the all-purpose confirmation noise: "yes, go on", "exactly!", "I thought so too".',
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: slangQuiz.id,
      text: 'E choke',
      categoryId: cats['internet-slang'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'Something is very impressive or overwhelming' },
        { id: 'b', text: 'A person is telling a lie' },
        { id: 'c', text: 'Someone is eating too fast' },
        { id: 'd', text: 'Something smells bad' },
      ],
      correct: ['a'],
      explanation: '"E choke" — made globally famous by Davido — means something is so impressive it takes your breath away.',
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: slangQuiz.id,
      text: 'Knacking',
      categoryId: cats['internet-slang'],
      difficulty: 'medium',
      options: [
        { id: 'a', text: 'Making a knocking sound' },
        { id: 'b', text: 'Sleeping deeply' },
        { id: 'c', text: 'Beating or hitting someone hard — or having sex (context-dependent)' },
        { id: 'd', text: 'Talking nonsense' },
      ],
      correct: ['c'],
      explanation: '"Knack" or "knacking" means to beat/hit someone, but in street slang it often means sex — all context.',
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: slangQuiz.id,
      text: 'Gra-gra',
      categoryId: cats['nigerian-culture'],
      difficulty: 'medium',
      options: [
        { id: 'a', text: 'Unnecessary roughness, aggression or showing off forcefully' },
        { id: 'b', text: 'A type of local food' },
        { id: 'c', text: 'Moving very slowly' },
        { id: 'd', text: 'Gossip or rumour spreading' },
      ],
      correct: ['a'],
      explanation: '"No need for gra-gra" — meaning calm down, no need for all this aggression or over-the-top behaviour.',
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: slangQuiz.id,
      text: 'Bants',
      categoryId: cats['internet-slang'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'Underpants or shorts' },
        { id: 'b', text: 'Playful teasing or jokes between friends' },
        { id: 'c', text: 'Serious gossip' },
        { id: 'd', text: 'Complaints about something' },
      ],
      correct: ['b'],
      explanation: '"Bants" means banter — playful teasing, usually between friends who are comfortable enough to push each other.',
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: slangQuiz.id,
      text: 'Werey',
      categoryId: cats['funny'],
      difficulty: 'medium',
      options: [
        { id: 'a', text: 'A clever or smart person' },
        { id: 'b', text: 'A crazy, mentally unstable or wildly reckless person' },
        { id: 'c', text: 'Someone who is always in a hurry' },
        { id: 'd', text: 'A person who cannot keep secrets' },
      ],
      correct: ['b'],
      explanation: '"Werey" is Yoruba for a mad or reckless person. "You dey act like werey" means you\'re behaving crazy.',
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: slangQuiz.id,
      text: 'Egbon',
      categoryId: cats['nigerian-culture'],
      difficulty: 'medium',
      options: [
        { id: 'a', text: 'A Yoruba word for an older person or respected senior' },
        { id: 'b', text: 'A type of food dish' },
        { id: 'c', text: 'A government official' },
        { id: 'd', text: 'A word meaning "enemy"' },
      ],
      correct: ['a'],
      explanation: '"Egbon" literally means "elder sibling" in Yoruba but is used to respectfully address any senior person.',
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: slangQuiz.id,
      text: 'Na wa',
      categoryId: cats['nigerian-culture'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'An expression of shock, disbelief or mild outrage' },
        { id: 'b', text: '"That\'s correct" or agreement' },
        { id: 'c', text: 'A traditional greeting in the east' },
        { id: 'd', text: '"Let\'s go" or "move quickly"' },
      ],
      correct: ['a'],
      explanation: '"Na wa o!" is the classic Nigerian expression for when someone has done something beyond belief — positive or negative.',
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: slangQuiz.id,
      text: 'Abi?',
      categoryId: cats['nigerian-culture'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'A confirmation-seeking tag — "right?", "isn\'t it?", "don\'t you agree?"' },
        { id: 'b', text: 'A greeting in the north' },
        { id: 'c', text: 'An expression of frustration' },
        { id: 'd', text: 'A way to introduce a new topic in conversation' },
      ],
      correct: ['a'],
      explanation: '"Abi?" at the end of a sentence is seeking agreement or confirmation — "You understand, abi?"',
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: slangQuiz.id,
      text: 'Sharp sharp',
      categoryId: cats['nigerian-culture'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'Very quickly, immediately, without delay' },
        { id: 'b', text: 'Cutting someone out of a deal' },
        { id: 'c', text: 'Being intelligent or clever' },
        { id: 'd', text: 'Extremely expensive' },
      ],
      correct: ['a'],
      explanation: '"Sharp sharp" means do it right now, immediately — no dawdling, no African time.',
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: slangQuiz.id,
      text: 'Tokunbo',
      categoryId: cats['lifestyle'],
      difficulty: 'medium',
      options: [
        { id: 'a', text: 'An imported, second-hand item (especially cars or electronics)' },
        { id: 'b', text: 'A Yoruba name meaning "from overseas"' },
        { id: 'c', text: 'Both A and B are correct' },
        { id: 'd', text: 'A newly manufactured local product' },
      ],
      correct: ['c'],
      explanation: 'Tokunbo is both a Yoruba name meaning "from overseas" and a widely used term for second-hand imported goods.',
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: slangQuiz.id,
      text: 'Chop',
      categoryId: cats['food'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'To cut something with a sharp tool' },
        { id: 'b', text: 'To eat, or food itself' },
        { id: 'c', text: 'To steal money from someone' },
        { id: 'd', text: 'A type of snack sold in the market' },
      ],
      correct: ['b'],
      explanation: '"Chop" means to eat. "Come chop" means come and eat. "Chop money" is the Nigerian term for an allowance.',
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: slangQuiz.id,
      text: 'Olosho',
      categoryId: cats['internet-slang'],
      difficulty: 'hard',
      options: [
        { id: 'a', text: 'A person who talks too much' },
        { id: 'b', text: 'A female sex worker or a derogatory term for a promiscuous woman' },
        { id: 'c', text: 'A person who is always late' },
        { id: 'd', text: 'A nosy person or gossip' },
      ],
      correct: ['b'],
      explanation: '"Olosho" is a strong derogatory term — use with full awareness of how offensive it can be.',
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: slangQuiz.id,
      text: 'Shakara',
      categoryId: cats['nigerian-culture'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'To show off or play hard to get' },
        { id: 'b', text: 'A type of fish popular in the south' },
        { id: 'c', text: 'Feeling very confident' },
        { id: 'd', text: 'Arguing with no valid point' },
      ],
      correct: ['a'],
      explanation: '"Shakara" means to put on airs, show off, or play hard to get — "she dey do shakara" means she\'s being difficult or flirtatious.',
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: slangQuiz.id,
      text: 'Frenemies',
      categoryId: cats['relationships'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'People who are both friends and enemies — smile to your face, stab your back' },
        { id: 'b', text: 'Close friends who argue a lot' },
        { id: 'c', text: 'People met for free at events' },
        { id: 'd', text: 'Long-distance friends' },
      ],
      correct: ['a'],
      explanation: 'Frenemies — people who act like friends but compete with or undermine you. Very common in Nigerian social circles.',
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
  ];

  for (const q of slangQuestions) {
    await insertQ(q);
  }
  console.log(`✓ ${slangQuestions.length} Slang Quiz questions`);

  // ── Guess the Price questions ─────────────────────────────────────────────
  const guessQuestions: schema.InsertQuestion[] = [
    {
      experienceId: guessPrice.id,
      text: 'iPhone 15 (128GB, New)',
      categoryId: cats['lifestyle'],
      options: {
        item: { name: 'iPhone 15 128GB', category: 'Phones' },
        reference_price_ngn: 1050000,
        price_as_of: '2026-09-01',
        price_source: 'Jumia / market average',
      },
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: guessPrice.id,
      text: 'Samsung Galaxy S24 (256GB, New)',
      categoryId: cats['lifestyle'],
      options: {
        item: { name: 'Samsung Galaxy S24 256GB', category: 'Phones' },
        reference_price_ngn: 970000,
        price_as_of: '2026-09-01',
        price_source: 'Jumia / market average',
      },
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: guessPrice.id,
      text: 'Tecno Camon 30 Pro (256GB, New)',
      categoryId: cats['lifestyle'],
      options: {
        item: { name: 'Tecno Camon 30 Pro 256GB', category: 'Phones' },
        reference_price_ngn: 320000,
        price_as_of: '2026-09-01',
        price_source: 'Jumia / market average',
      },
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: guessPrice.id,
      text: 'AirPods Pro (2nd Gen, New)',
      categoryId: cats['lifestyle'],
      options: {
        item: { name: 'Apple AirPods Pro 2nd Gen', category: 'Audio' },
        reference_price_ngn: 390000,
        price_as_of: '2026-09-01',
        price_source: 'Jumia / market average',
      },
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: guessPrice.id,
      text: 'Sony PlayStation 5 (Disc Edition, New)',
      categoryId: cats['lifestyle'],
      options: {
        item: { name: 'Sony PlayStation 5 Disc Edition', category: 'Gaming' },
        reference_price_ngn: 750000,
        price_as_of: '2026-09-01',
        price_source: 'Jumia / market average',
      },
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: guessPrice.id,
      text: 'HP Laptop 15 (Intel Core i5, 8GB RAM, 512GB SSD, New)',
      categoryId: cats['lifestyle'],
      options: {
        item: { name: 'HP Laptop 15 i5 8GB 512GB', category: 'Laptops' },
        reference_price_ngn: 680000,
        price_as_of: '2026-09-01',
        price_source: 'Jumia / market average',
      },
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: guessPrice.id,
      text: 'Toyota Camry (2018, Used, Lagos)',
      categoryId: cats['lifestyle'],
      options: {
        item: { name: 'Toyota Camry 2018 (used)', category: 'Cars' },
        reference_price_ngn: 12500000,
        price_as_of: '2026-09-01',
        price_source: 'Cheki.com.ng / market average',
      },
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: guessPrice.id,
      text: 'Bag of 50kg Rice (Local Brand)',
      categoryId: cats['food'],
      options: {
        item: { name: '50kg Bag of Local Rice', category: 'Grocery' },
        reference_price_ngn: 82000,
        price_as_of: '2026-09-01',
        price_source: 'Lagos market average',
      },
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: guessPrice.id,
      text: 'LG 43-inch Smart TV (4K, New)',
      categoryId: cats['lifestyle'],
      options: {
        item: { name: 'LG 43-inch 4K Smart TV', category: 'TVs' },
        reference_price_ngn: 420000,
        price_as_of: '2026-09-01',
        price_source: 'Jumia / market average',
      },
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: guessPrice.id,
      text: 'Generator 3.5KVA (Thermocool, New)',
      categoryId: cats['lifestyle'],
      options: {
        item: { name: 'Thermocool 3.5KVA Generator', category: 'Electronics' },
        reference_price_ngn: 210000,
        price_as_of: '2026-09-01',
        price_source: 'Jumia / market average',
      },
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: guessPrice.id,
      text: 'Dangote Cement (50kg bag)',
      categoryId: cats['other'],
      options: {
        item: { name: 'Dangote Cement 50kg', category: 'Building Materials' },
        reference_price_ngn: 9500,
        price_as_of: '2026-09-01',
        price_source: 'Lagos market average',
      },
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: guessPrice.id,
      text: 'Nike Air Force 1 (Authentic, New)',
      categoryId: cats['lifestyle'],
      options: {
        item: { name: 'Nike Air Force 1 (Authentic)', category: 'Footwear' },
        reference_price_ngn: 120000,
        price_as_of: '2026-09-01',
        price_source: 'Nike authorised retailers',
      },
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: guessPrice.id,
      text: 'Litre of Petrol (Lagos, official pump price)',
      categoryId: cats['lifestyle'],
      options: {
        item: { name: 'Petrol per litre (Lagos)', category: 'Fuel' },
        reference_price_ngn: 897,
        price_as_of: '2026-09-01',
        price_source: 'NNPC official pump price',
      },
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: guessPrice.id,
      text: 'iPhone 15 Pro Max (256GB, New)',
      categoryId: cats['lifestyle'],
      options: {
        item: { name: 'iPhone 15 Pro Max 256GB', category: 'Phones' },
        reference_price_ngn: 1650000,
        price_as_of: '2026-09-01',
        price_source: 'Jumia / market average',
      },
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: guessPrice.id,
      text: 'Big Brother Naija VIP Ticket (Season Finale)',
      categoryId: cats['nigerian-culture'],
      options: {
        item: { name: 'BBN Season Finale VIP Ticket', category: 'Entertainment' },
        reference_price_ngn: 150000,
        price_as_of: '2026-09-01',
        price_source: 'MultiChoice official',
      },
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: guessPrice.id,
      text: 'Indomie Noodles (Box of 40 packs)',
      categoryId: cats['food'],
      options: {
        item: { name: 'Indomie Box (40 packs)', category: 'Grocery' },
        reference_price_ngn: 8800,
        price_as_of: '2026-09-01',
        price_source: 'Wholesale market average',
      },
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: guessPrice.id,
      text: 'MacBook Air M2 (256GB, New)',
      categoryId: cats['lifestyle'],
      options: {
        item: { name: 'Apple MacBook Air M2 256GB', category: 'Laptops' },
        reference_price_ngn: 1300000,
        price_as_of: '2026-09-01',
        price_source: 'Jumia / market average',
      },
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: guessPrice.id,
      text: 'I Better Pass My Neighbour Generator (Small, New)',
      categoryId: cats['lifestyle'],
      options: {
        item: { name: 'I Better Pass My Neighbour Generator (small)', category: 'Electronics' },
        reference_price_ngn: 58000,
        price_as_of: '2026-09-01',
        price_source: 'Market average',
      },
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: guessPrice.id,
      text: 'A plate of jollof rice at a popular Lagos restaurant',
      categoryId: cats['food'],
      options: {
        item: { name: 'Jollof rice at Lagos restaurant', category: 'Food & Dining' },
        reference_price_ngn: 5500,
        price_as_of: '2026-09-01',
        price_source: 'Popular restaurant average (Lagos)',
      },
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: guessPrice.id,
      text: 'Keke Napep (Tricycle, Brand New)',
      categoryId: cats['lifestyle'],
      options: {
        item: { name: 'Keke Napep / Tricycle (new)', category: 'Transport' },
        reference_price_ngn: 1450000,
        price_as_of: '2026-09-01',
        price_source: 'Lagos market average',
      },
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
  ];

  for (const q of guessQuestions) {
    await insertQ(q);
  }
  console.log(`✓ ${guessQuestions.length} "Guess the Price" questions`);

  // ── Which Nigerian Food Are You? questions ───────────────────────────────
  const foodQuestions: schema.InsertQuestion[] = [
    {
      experienceId: foodPersonality.id,
      text: "It's Saturday afternoon and there's an owambe nearby. What is your reaction?",
      categoryId: cats['food'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'I came strictly for the dance floor and souvenir bag', points: 3 },
        { id: 'b', text: 'Sit respectfully with the elders and wait for real food', points: 2 },
        { id: 'c', text: 'Check who has small chops or drink, then leave', points: 1 },
        { id: 'd', text: 'Stay in my room with AC and mind my business', points: 0 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: foodPersonality.id,
      text: 'Your phone battery drops to 3% and NEPA just took the light. How do you handle it?',
      categoryId: cats['food'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'Panic, complain in family group chat, light rechargeable lamp immediately', points: 3 },
        { id: 'b', text: 'Calmly find power bank, start generator without noise', points: 2 },
        { id: 'c', text: 'Step outside to the junction to buy suya and charge phone with aboki', points: 1 },
        { id: 'd', text: 'Just sleep. Problem no dey finish', points: 0 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: foodPersonality.id,
      text: 'How do you handle someone who owes you money and is posting vacations on Instagram?',
      categoryId: cats['food'],
      difficulty: 'medium',
      options: [
        { id: 'a', text: 'Comment "Safe journey boss, hope you remember that 50k" on every photo', points: 3 },
        { id: 'b', text: 'Call their older sibling or church pastor directly', points: 2 },
        { id: 'c', text: 'Post cryptic status about wicked people and karma', points: 1 },
        { id: 'd', text: 'Cut your losses and count it as giving to charity', points: 0 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: foodPersonality.id,
      text: 'What is your natural temperament when someone cuts you off in Lagos traffic?',
      categoryId: cats['food'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'Wind down glass, shout "Werey!", make hand gesture', points: 3 },
        { id: 'b', text: 'Look at them with sheer disappointment, shake head', points: 2 },
        { id: 'c', text: 'Speed up and block them immediately at the next bend', points: 1 },
        { id: 'd', text: 'Let them go, life is too short to fight yellow bus drivers', points: 0 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: foodPersonality.id,
      text: 'Your ideal Friday night looks like:',
      categoryId: cats['food'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'Club, lounge, VIP section, loud amapiano, sparklers', points: 3 },
        { id: 'b', text: 'Quiet dinner with two close friends, discussing investments', points: 2 },
        { id: 'c', text: 'Street side bar, pepper soup, cold malt, loud banter', points: 1 },
        { id: 'd', text: 'In bed by 9:30 PM with laptop and movie', points: 0 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: foodPersonality.id,
      text: 'How do you pack when travelling for a 2-day weekend trip?',
      categoryId: cats['food'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'Two massive boxes, iron, 6 outfits, extra shoes "just in case"', points: 3 },
        { id: 'b', text: 'Well-organised duffel bag with ironed native and toiletries', points: 2 },
        { id: 'c', text: 'One backpack with essentials, buy whatever else at destination', points: 1 },
        { id: 'd', text: 'Throw two shirts into a polythene bag and leave', points: 0 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: foodPersonality.id,
      text: 'When cooking in the kitchen, what is your relationship with seasoning cubes and pepper?',
      categoryId: cats['food'],
      difficulty: 'medium',
      options: [
        { id: 'a', text: 'Red oil must float, aroma must reach next compound', points: 3 },
        { id: 'b', text: 'Rich stock with goat meat and crayfish, balanced perfection', points: 2 },
        { id: 'c', text: 'Extra chili pepper until forehead is sweating', points: 1 },
        { id: 'd', text: 'Just pinch of salt and water, simplicity is king', points: 0 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: foodPersonality.id,
      text: 'What role do you play in your circle of friends?',
      categoryId: cats['food'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'The hype person: planning events, bringing the vibes', points: 3 },
        { id: 'b', text: 'The anchor: gives sober advice, settles fights', points: 2 },
        { id: 'c', text: 'The spontaneous one: always ready for unexpected trouble', points: 1 },
        { id: 'd', text: 'The ghost: only appears when food is confirmed', points: 0 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: foodPersonality.id,
      text: 'If a tailor tells you "Your cloth will be ready on Friday morning", what do you believe?',
      categoryId: cats['food'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'He is lying, so I will arrive at his shop unannounced on Thursday', points: 3 },
        { id: 'b', text: 'Call him Friday 7 a.m. with stern elder voice', points: 2 },
        { id: 'c', text: 'Threaten to involve area boys if sewing fails', points: 1 },
        { id: 'd', text: 'Mentally prepare to wear an old outfit', points: 0 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: foodPersonality.id,
      text: 'What is your superpower in a crisis?',
      categoryId: cats['food'],
      difficulty: 'medium',
      options: [
        { id: 'a', text: 'Making everybody laugh and forget the pain', points: 3 },
        { id: 'b', text: 'Staying calm and executing the logical rescue plan', points: 2 },
        { id: 'c', text: 'Fighting back with fire until victory', points: 1 },
        { id: 'd', text: 'Adapting instantly with zero complaints', points: 0 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: foodPersonality.id,
      text: 'Which compliment would warm your soul the most?',
      categoryId: cats['food'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: '"Your presence alone made this party complete!"', points: 3 },
        { id: 'b', text: '"You are one of the most dependable people I have ever met."', points: 2 },
        { id: 'c', text: '"You are dangerous in a good way, no one can play with you."', points: 1 },
        { id: 'd', text: '"You saved my life today, thank you."', points: 0 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: foodPersonality.id,
      text: 'How do you respond when someone offers you unsolicited advice?',
      categoryId: cats['food'],
      difficulty: 'medium',
      options: [
        { id: 'a', text: 'Laugh it off and turn it into a joke for Twitter', points: 3 },
        { id: 'b', text: '"Thank you sir/ma" with a respectful nod, then ignore completely', points: 2 },
        { id: 'c', text: 'Defend your choices immediately with facts and attitude', points: 1 },
        { id: 'd', text: 'Smile awkwardly and look for an escape route', points: 0 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: foodPersonality.id,
      text: 'What is your honest morning wake-up routine?',
      categoryId: cats['food'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'Wake up energized, play Afrobeats, seize the day', points: 3 },
        { id: 'b', text: 'Pray, stretch, review daily tasks systematically', points: 2 },
        { id: 'c', text: 'Jump out of bed late, rushing against the clock', points: 1 },
        { id: 'd', text: 'Check notifications for 45 minutes while lying motionless', points: 0 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: foodPersonality.id,
      text: 'At a buffet, how do you approach the food station?',
      categoryId: cats['food'],
      difficulty: 'easy',
      options: [
        { id: 'a', text: 'Mountain of jollof, fried rice, dodo, salad, and beef touching the roof', points: 3 },
        { id: 'b', text: 'Swallow section first: clean solid portion with thick soup', points: 2 },
        { id: 'c', text: 'Double meat and protein, minimal carbs', points: 1 },
        { id: 'd', text: 'Moderate plate, come back if necessary', points: 0 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
    {
      experienceId: foodPersonality.id,
      text: 'If Nigeria was completely reset today, what would be your immediate move?',
      categoryId: cats['food'],
      difficulty: 'hard',
      options: [
        { id: 'a', text: 'Host a nationwide street carnival to celebrate new beginnings', points: 3 },
        { id: 'b', text: 'Run for local government chairman to fix infrastructure', points: 2 },
        { id: 'c', text: 'Open a reliable logistics business immediately', points: 1 },
        { id: 'd', text: 'Wait 6 months to see if the reset is real or fake', points: 0 },
      ],
      status: 'published',
      source: 'seed',
      publishedAt: new Date(),
    },
  ];

  for (const q of foodQuestions) {
    await insertQ(q);
  }
  console.log(`✓ ${foodQuestions.length} "Food Personality" questions`);

  // ── PriceCheck seed data ──────────────────────────────────────────────────
  const [seller] = await db
    .insert(schema.sellers)
    .values({ name: 'Jumia Nigeria', location: 'Online', url: 'https://jumia.com.ng', isPartner: false })
    .onConflictDoNothing()
    .returning();

  if (seller) {
    const [iphone15] = await db
      .insert(schema.products)
      .values({
        slug: 'apple-iphone-15-128gb',
        name: 'Apple iPhone 15',
        brand: 'Apple',
        category: 'Smartphones',
        variant: '128GB',
        aliases: ['iphone 15', 'iphone15', 'apple iphone 15 128', 'iphone 15 128gb'],
      })
      .onConflictDoNothing()
      .returning();

    if (iphone15) {
      await db
        .insert(schema.listings)
        .values({
          productId: iphone15.id,
          sellerId: seller.id,
          priceNgn: 1050000,
          condition: 'new',
          location: 'Lagos',
          url: 'https://jumia.com.ng',
          isPaid: false,
          source: 'seed',
        })
        .onConflictDoNothing();

      await db
        .insert(schema.priceSnapshots)
        .values({
          productId: iphone15.id,
          date: '2026-09-01',
          avgPrice: '1050000',
          minPrice: '980000',
          maxPrice: '1150000',
          listingCount: 5,
        })
        .onConflictDoNothing();
    }
  }
  console.log('✓ PriceCheck seed data');

  console.log('\n🎉 Seed complete! Review content at /admin before publishing.');
  await sql.end();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
