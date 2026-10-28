import { describe, it, expect } from 'vitest';
import { getBoxBySlug, getAllBoxes, getRecommendedBoxes } from './registry';

describe('Box Registry', () => {
  it('registers all launch boxes and extensions', () => {
    const boxes = getAllBoxes();
    expect(boxes.length).toBeGreaterThanOrEqual(7);
    const slugs = boxes.map((b) => b.slug);
    expect(slugs).toContain('how-nigerian');
    expect(slugs).toContain('would-you-rather');
    expect(slugs).toContain('slang-quiz');
    expect(slugs).toContain('guess-the-price');
    expect(slugs).toContain('reaction-time');
    expect(slugs).toContain('decision-maker');
    expect(slugs).toContain('pricecheck');
    expect(slugs).toContain('food-personality');
    expect(slugs).toContain('excuse-generator');
  });

  it('can look up a box by slug', () => {
    const box = getBoxBySlug('slang-quiz');
    expect(box).toBeDefined();
    expect(box?.title).toBe('Nigerian Slang Quiz');
    expect(box?.usesQuestionSystem).toBe(true);
  });

  it('returns recommended boxes avoiding current slug', () => {
    const recs = getRecommendedBoxes('how-nigerian', 3);
    expect(recs.length).toBe(3);
    expect(recs.every((r) => r.slug !== 'how-nigerian')).toBe(true);
  });

  it('dynamically loads box components', async () => {
    const box = getBoxBySlug('reaction-time');
    expect(box).toBeDefined();
    const mod = await box!.component();
    expect(mod.default).toBeDefined();
  });
});
