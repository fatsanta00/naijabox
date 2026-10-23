import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { questions, questionStats, experiences } from '@/server/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * GET /api/admin/analytics/questions
 * Returns questions with their response stats (response count, correct rate, answer distribution)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const experienceKey = searchParams.get('experience');

    const rows = await db
      .select({
        id: questions.id,
        text: questions.text,
        status: questions.status,
        difficulty: questions.difficulty,
        experienceTitle: experiences.title,
        experienceKey: experiences.key,
        totalResponses: questionStats.totalResponses,
        correctRate: questionStats.correctRate,
        distribution: questionStats.distribution,
        statsUpdatedAt: questionStats.updatedAt,
      })
      .from(questions)
      .leftJoin(experiences, eq(questions.experienceId, experiences.id))
      .leftJoin(questionStats, eq(questions.id, questionStats.questionId))
      .orderBy(desc(questionStats.totalResponses))
      .limit(100);

    const filtered = experienceKey
      ? rows.filter((r) => r.experienceKey === experienceKey)
      : rows;

    return NextResponse.json({ questions: filtered });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch question performance';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
