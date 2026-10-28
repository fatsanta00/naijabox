import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getAllBoxes } from '@/boxes/registry';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const allBoxes = getAllBoxes();
    const allExperiences = await db.select().from(schema.experiences);
    const expMap = new Map(allExperiences.map((e) => [e.key, e]));

    // Query published counts grouped by experienceId
    const counts = await db
      .select({
        experienceId: schema.questions.experienceId,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.questions)
      .where(eq(schema.questions.status, 'published'))
      .groupBy(schema.questions.experienceId);

    const countMap = new Map(counts.map((c) => [c.experienceId, c.count]));

    const healthReport = allBoxes.map((box) => {
      // Find matching DB experience by slug or key
      const dbExp = expMap.get(box.slug);
      const publishedCount = dbExp ? countMap.get(dbExp.id) || 0 : 0;
      const minRecommended = 10;

      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (!box.usesQuestionSystem) {
        status = 'healthy'; // Boxes like reaction-time, decision-maker don't rely on question pools
      } else if (publishedCount < 5) {
        status = 'critical';
      } else if (publishedCount < minRecommended) {
        status = 'warning';
      }

      return {
        title: box.title,
        slug: box.slug,
        badge: box.badge || '📦',
        usesQuestionSystem: box.usesQuestionSystem,
        publishedCount,
        minRecommended: box.usesQuestionSystem ? minRecommended : 0,
        status,
      };
    });

    return NextResponse.json({
      success: true,
      data: healthReport,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Content health API error:', err);
    return NextResponse.json({ error: 'Failed to generate content health report' }, { status: 500 });
  }
}
