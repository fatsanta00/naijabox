import { BoxDefinition } from './types';

export const boxRegistry: BoxDefinition[] = [
  {
    slug: 'how-nigerian',
    title: 'How Nigerian Are You?',
    tagline: 'Take the ultimate test. Certified Naija child or still loading?',
    kind: 'test',
    navGroup: 'quizzes',
    badge: 'Viral',
    usesQuestionSystem: true,
    experienceKey: 'how-nigerian',
    component: () => import('./how-nigerian'),
    recommendNext: ['slang-quiz', 'would-you-rather'],
  },
  {
    slug: 'would-you-rather',
    title: 'Naija Would You Rather',
    tagline: 'Unlimited data or free light? Hard choices only.',
    kind: 'quiz',
    navGroup: 'quizzes',
    badge: 'Popular',
    usesQuestionSystem: true,
    experienceKey: 'would-you-rather',
    component: () => import('./would-you-rather'),
    recommendNext: ['how-nigerian', 'guess-the-price'],
  },
  {
    slug: 'slang-quiz',
    title: 'Nigerian Slang Quiz',
    tagline: "Test your street vocab. Are you officially outside or you need orientation?",
    kind: 'quiz',
    navGroup: 'quizzes',
    badge: 'Trending',
    usesQuestionSystem: true,
    experienceKey: 'slang-quiz',
    component: () => import('./slang-quiz'),
    recommendNext: ['how-nigerian', 'reaction-time'],
  },
  {
    slug: 'guess-the-price',
    title: 'Guess the Price',
    tagline: 'How well do you know current Nigerian prices? Test your shopping IQ.',
    kind: 'game',
    navGroup: 'games',
    badge: 'Fun',
    usesQuestionSystem: true,
    experienceKey: 'guess-the-price',
    component: () => import('./guess-the-price'),
    recommendNext: ['pricecheck', 'reaction-time'],
  },
  {
    slug: 'reaction-time',
    title: 'Reaction Time',
    tagline: 'Wait for green, tap fast. How sharp are your reflexes?',
    kind: 'game',
    navGroup: 'games',
    badge: 'Speed',
    usesQuestionSystem: false,
    component: () => import('./reaction-time'),
    recommendNext: ['guess-the-price', 'decision-maker'],
  },
  {
    slug: 'decision-maker',
    title: 'Random Decision Maker',
    tagline: 'What to eat? Should you text them? Let the box decide for you.',
    kind: 'tool',
    navGroup: 'tools',
    badge: 'Utility',
    usesQuestionSystem: false,
    component: () => import('./decision-maker'),
    recommendNext: ['would-you-rather', 'slang-quiz'],
  },
  {
    slug: 'pricecheck',
    title: 'Naija PriceCheck',
    tagline: 'Real market prices for phones, laptops, and everyday items in Nigeria.',
    kind: 'tool',
    navGroup: 'pricecheck',
    badge: 'Utility',
    usesQuestionSystem: false,
    component: () => import('./pricecheck'),
    recommendNext: ['guess-the-price', 'how-nigerian'],
  },
];

export function getBoxBySlug(slug: string): BoxDefinition | undefined {
  return boxRegistry.find((b) => b.slug === slug);
}

export function getAllBoxes(): BoxDefinition[] {
  return boxRegistry;
}

export function getRecommendedBoxes(currentSlug: string, count = 3): BoxDefinition[] {
  const current = getBoxBySlug(currentSlug);
  if (current?.recommendNext) {
    const recommended = current.recommendNext
      .map((slug) => getBoxBySlug(slug))
      .filter((b): b is BoxDefinition => b !== undefined);
    if (recommended.length >= count) return recommended.slice(0, count);
  }
  return boxRegistry.filter((b) => b.slug !== currentSlug).slice(0, count);
}
