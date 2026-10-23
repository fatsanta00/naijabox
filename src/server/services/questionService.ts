import { db } from '../db';
import * as schema from '../db/schema';
import { eq, and, notInArray, asc, sql } from 'drizzle-orm';

export interface SessionSetOptions {
  sessionId?: string;
  count?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  excludeQuestionIds?: string[];
}

export interface PublicQuestion {
  id: string;
  experienceId: string;
  text: string;
  categoryId: string | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  options: unknown;
  explanation: string | null;
  sortOrder: number;
  authorName: string | null;
  showAttribution: boolean;
}

export class QuestionService {
  /**
   * Fetch questions for a play session honouring:
   * - published status only
   * - experience key lookup
   * - selection mode (random vs ordered)
   * - question_count configuration
   * - difficulty filter
   * - no-repeat within session
   */
  public static async getSessionSet(
    experienceKey: string,
    options: SessionSetOptions = {}
  ): Promise<PublicQuestion[]> {
    // 1. Fetch experience definition
    const [exp] = await db
      .select()
      .from(schema.experiences)
      .where(and(eq(schema.experiences.key, experienceKey), eq(schema.experiences.isActive, true)))
      .limit(1);

    if (!exp) {
      return [];
    }

    // 2. Determine exclusions for no-repeat logic
    const excludedIds: string[] = [...(options.excludeQuestionIds || [])];

    if (options.sessionId) {
      // Find questions this session already answered in this experience
      const answered = await db
        .select({ questionId: schema.responses.questionId })
        .from(schema.responses)
        .where(
          and(
            eq(schema.responses.sessionId, options.sessionId),
            eq(schema.responses.experienceId, exp.id)
          )
        );

      for (const a of answered) {
        if (!excludedIds.includes(a.questionId)) {
          excludedIds.push(a.questionId);
        }
      }
    }

    // 3. Build conditions
    const conditions = [
      eq(schema.questions.experienceId, exp.id),
      eq(schema.questions.status, 'published'),
    ];

    if (options.difficulty) {
      conditions.push(eq(schema.questions.difficulty, options.difficulty));
    }

    if (excludedIds.length > 0) {
      conditions.push(notInArray(schema.questions.id, excludedIds));
    }

    // 4. Query with appropriate ordering
    const query = db
      .select({
        id: schema.questions.id,
        experienceId: schema.questions.experienceId,
        text: schema.questions.text,
        categoryId: schema.questions.categoryId,
        difficulty: schema.questions.difficulty,
        options: schema.questions.options,
        explanation: schema.questions.explanation,
        sortOrder: schema.questions.sortOrder,
        authorName: schema.questions.authorName,
        showAttribution: schema.questions.showAttribution,
      })
      .from(schema.questions)
      .where(and(...conditions));

    let rows: PublicQuestion[];
    if (exp.selectionMode === 'ordered') {
      rows = await query.orderBy(asc(schema.questions.sortOrder));
    } else {
      // Random selection
      rows = await query.orderBy(sql`RANDOM()`);
    }

    // 5. Apply limit
    const limit = options.count ?? exp.questionCount ?? 15;
    return rows.slice(0, limit);
  }

  /**
   * Helper algorithm to select questions in-memory (useful for unit testing without DB)
   */
  public static filterAndSortQuestions(
    pool: Array<schema.Question>,
    options: {
      selectionMode: 'random' | 'ordered';
      count?: number;
      difficulty?: 'easy' | 'medium' | 'hard';
      excludeIds?: string[];
      randomSeed?: number;
    }
  ): Array<schema.Question> {
    let filtered = pool.filter((q) => q.status === 'published');

    if (options.difficulty) {
      filtered = filtered.filter((q) => q.difficulty === options.difficulty);
    }

    if (options.excludeIds && options.excludeIds.length > 0) {
      const excludeSet = new Set(options.excludeIds);
      filtered = filtered.filter((q) => !excludeSet.has(q.id));
    }

    if (options.selectionMode === 'ordered') {
      filtered.sort((a, b) => a.sortOrder - b.sortOrder);
    } else {
      // Deterministic or pseudo-random shuffle
      filtered = [...filtered].sort(() => 0.5 - Math.random());
    }

    const limit = options.count ?? 15;
    return filtered.slice(0, limit);
  }
}
