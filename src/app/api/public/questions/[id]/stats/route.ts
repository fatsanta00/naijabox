import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export const MIN_STATS_SAMPLE = Number(process.env.MIN_STATS_SAMPLE || 30);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch question_stats row
    const [stats] = await db
      .select()
      .from(schema.questionStats)
      .where(eq(schema.questionStats.questionId, id))
      .limit(1);

    if (!stats || stats.totalResponses < MIN_STATS_SAMPLE) {
      // Anti-fabrication gate (ADR-008): Do NOT return percentages when below sample size
      return NextResponse.json({
        available: false,
        total_responses: stats?.totalResponses ?? 0,
        min_required: MIN_STATS_SAMPLE,
        message: "You're one of the first to answer",
      });
    }

    return NextResponse.json({
      available: true,
      total_responses: stats.totalResponses,
      distribution: stats.distribution,
      correct_rate: stats.correctRate,
    });
  } catch (err) {
    console.error('Error fetching question stats:', err);
    return NextResponse.json({ error: 'Failed to fetch question statistics' }, { status: 500 });
  }
}
