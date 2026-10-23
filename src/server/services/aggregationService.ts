import { db } from '@/server/db';
import { responses, questionStats, listings, priceSnapshots } from '@/server/db/schema';
import { eq, sql, and } from 'drizzle-orm';

/**
 * Aggregation Job (ADR-008, TASKS 4.1)
 * Computes:
 * 1. question_stats from raw responses (total_responses, distribution, correct_rate)
 * 2. price_snapshots from active listings (avg_price, min_price, max_price, listing_count)
 */
export async function runAggregationJob(): Promise<{
  questionStatsUpdated: number;
  priceSnapshotsCreated: number;
}> {
  let questionStatsUpdated = 0;
  let priceSnapshotsCreated = 0;

  // ── 1. Aggregate Question Stats ───────────────────────────────────────────
  // Fetch distinct question IDs that have responses
  const questionRows = await db
    .select({ questionId: responses.questionId })
    .from(responses)
    .groupBy(responses.questionId);

  for (const { questionId } of questionRows) {
    const allResponses = await db
      .select({
        answer: responses.answer,
        isCorrect: responses.isCorrect,
      })
      .from(responses)
      .where(eq(responses.questionId, questionId));

    const total = allResponses.length;
    if (total === 0) continue;

    // Build distribution map
    const distribution: Record<string, number> = {};
    let correctCount = 0;
    let evaluatedCount = 0;

    for (const r of allResponses) {
      const ansObj = r.answer as Record<string, unknown> | string;
      const key =
        typeof ansObj === 'string'
          ? ansObj
          : (ansObj?.optionId || ansObj?.option_id || ansObj?.selected || JSON.stringify(ansObj)) as string;

      distribution[key] = (distribution[key] || 0) + 1;

      if (r.isCorrect !== null && r.isCorrect !== undefined) {
        evaluatedCount++;
        if (r.isCorrect) correctCount++;
      }
    }

    const correctRate = evaluatedCount > 0 ? (correctCount / evaluatedCount).toFixed(4) : null;

    // Upsert into question_stats
    await db
      .insert(questionStats)
      .values({
        questionId,
        totalResponses: total,
        distribution,
        correctRate,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: questionStats.questionId,
        set: {
          totalResponses: total,
          distribution,
          correctRate,
          updatedAt: new Date(),
        },
      });

    questionStatsUpdated++;
  }

  // ── 2. Aggregate Price Snapshots ──────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Group active listings by product
  const productRows = await db
    .select({
      productId: listings.productId,
      avgPrice: sql<string>`ROUND(AVG(${listings.priceNgn}), 2)`,
      minPrice: sql<string>`MIN(${listings.priceNgn})`,
      maxPrice: sql<string>`MAX(${listings.priceNgn})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(listings)
    .where(eq(listings.isActive, true))
    .groupBy(listings.productId);

  for (const p of productRows) {
    if (p.count === 0) continue;

    // Check if snapshot exists for today
    const existing = await db
      .select({ id: priceSnapshots.id })
      .from(priceSnapshots)
      .where(and(eq(priceSnapshots.productId, p.productId), eq(priceSnapshots.date, today)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(priceSnapshots)
        .set({
          avgPrice: p.avgPrice,
          minPrice: p.minPrice,
          maxPrice: p.maxPrice,
          listingCount: p.count,
        })
        .where(eq(priceSnapshots.id, existing[0].id));
    } else {
      await db.insert(priceSnapshots).values({
        productId: p.productId,
        date: today,
        avgPrice: p.avgPrice,
        minPrice: p.minPrice,
        maxPrice: p.maxPrice,
        listingCount: p.count,
      });
    }

    priceSnapshotsCreated++;
  }

  return { questionStatsUpdated, priceSnapshotsCreated };
}
