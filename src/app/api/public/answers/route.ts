import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { SESSION_COOKIE_NAME } from '@/middleware';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';

const answerSchema = z.object({
  question_id: z.string().uuid(),
  experience_id: z.string().uuid().optional(),
  answer: z.unknown(), // option id (string) or number (price guess)
  is_correct: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = answerSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid answer payload' }, { status: 400 });
    }

    const sessionId = req.cookies.get(SESSION_COOKIE_NAME)?.value || 'anon_session';
    const { question_id, answer, is_correct } = parsed.data;

    // Get question to verify experienceId and status
    const [q] = await db
      .select({
        id: schema.questions.id,
        experienceId: schema.questions.experienceId,
        status: schema.questions.status,
      })
      .from(schema.questions)
      .where(eq(schema.questions.id, question_id))
      .limit(1);

    if (!q || q.status !== 'published') {
      return NextResponse.json({ error: 'Question not found or unavailable' }, { status: 404 });
    }

    // Check if already answered in this session (e.g. for Would You Rather vote stuffing)
    const [existing] = await db
      .select({ id: schema.responses.id })
      .from(schema.responses)
      .where(
        and(
          eq(schema.responses.questionId, question_id),
          eq(schema.responses.sessionId, sessionId)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json({
        success: true,
        already_voted: true,
        message: 'Vote already recorded for this session',
      });
    }

    // Record response
    const [inserted] = await db
      .insert(schema.responses)
      .values({
        questionId: question_id,
        experienceId: q.experienceId,
        sessionId,
        answer: answer as Record<string, unknown> | string | number,
        isCorrect: is_correct,
      })
      .returning();

    return NextResponse.json({
      success: true,
      id: inserted.id,
    });
  } catch (err) {
    console.error('Error recording answer:', err);
    return NextResponse.json({ error: 'Failed to record answer' }, { status: 500 });
  }
}
