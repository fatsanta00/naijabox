import { db } from '../db';
import * as schema from '../db/schema';
import { eq, and, asc } from 'drizzle-orm';

export interface SlangTerm {
  id: string;
  term: string;
  slug: string;
  meaning: string;
  explanation: string | null;
  category: string;
  categorySlug: string;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  authorName: string | null;
  showAttribution: boolean;
}

export function toSlangSlug(term: string): string {
  return term
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

interface QuestionOption {
  id: string;
  text: string;
}

function extractMeaning(options: unknown, correct: unknown): string {
  if (!Array.isArray(options)) return '';

  const opts = options as QuestionOption[];
  if (Array.isArray(correct) && correct.length > 0) {
    const matched = opts.find((o) => o.id === correct[0]);
    if (matched) return matched.text;
  }

  // Fallback to first option text if available
  return opts[0]?.text || '';
}

export class SlangService {
  /**
   * Fetch all published Nigerian slang terms directly from the question pool.
   * Guarantees single source of truth without data duplication (PRD compliance).
   */
  public static async getAllTerms(): Promise<SlangTerm[]> {
    // 1. Fetch slang-quiz experience
    const [exp] = await db
      .select({ id: schema.experiences.id })
      .from(schema.experiences)
      .where(and(eq(schema.experiences.key, 'slang-quiz'), eq(schema.experiences.isActive, true)))
      .limit(1);

    if (!exp) return [];

    // 2. Fetch all published questions for slang-quiz with category info
    const rows = await db
      .select({
        id: schema.questions.id,
        term: schema.questions.text,
        options: schema.questions.options,
        correct: schema.questions.correct,
        explanation: schema.questions.explanation,
        difficulty: schema.questions.difficulty,
        authorName: schema.questions.authorName,
        showAttribution: schema.questions.showAttribution,
        categoryName: schema.categories.name,
        categorySlug: schema.categories.slug,
      })
      .from(schema.questions)
      .leftJoin(schema.categories, eq(schema.questions.categoryId, schema.categories.id))
      .where(and(eq(schema.questions.experienceId, exp.id), eq(schema.questions.status, 'published')))
      .orderBy(asc(schema.questions.text));

    return rows.map((r) => ({
      id: r.id,
      term: r.term,
      slug: toSlangSlug(r.term),
      meaning: extractMeaning(r.options, r.correct),
      explanation: r.explanation,
      category: r.categoryName || 'General Slang',
      categorySlug: r.categorySlug || 'general',
      difficulty: r.difficulty,
      authorName: r.authorName,
      showAttribution: r.showAttribution,
    }));
  }

  /**
   * Fetch a single published slang term by its URL-friendly slug.
   */
  public static async getTermBySlug(slug: string): Promise<SlangTerm | null> {
    const terms = await this.getAllTerms();
    const normalized = slug.toLowerCase().trim();
    return terms.find((t) => t.slug === normalized) || null;
  }
}
