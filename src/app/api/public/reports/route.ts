import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { SESSION_COOKIE_NAME } from '@/middleware';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const reportSchema = z.object({
  question_id: z.string().uuid(),
  reason: z.enum(['offensive', 'spam', 'incorrect', 'duplicate', 'unclear', 'other']),
  note: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = reportSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid report payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { question_id, reason, note } = parsed.data;
    const sessionId = req.cookies.get(SESSION_COOKIE_NAME)?.value || 'anon_session';

    // Verify question exists
    const [q] = await db
      .select({ id: schema.questions.id, status: schema.questions.status })
      .from(schema.questions)
      .where(eq(schema.questions.id, question_id))
      .limit(1);

    if (!q) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Insert report record
    // HARD RULE (ADR-009): Reports flag, admin decides. Reports NEVER auto-hide content.
    const [report] = await db
      .insert(schema.questionReports)
      .values({
        questionId: question_id,
        sessionId,
        reason,
        note: note || null,
        status: 'open',
      })
      .returning();

    return NextResponse.json({
      success: true,
      report_id: report.id,
      message: 'Report submitted. Our team will review this shortly.',
    });
  } catch (err) {
    console.error('Error submitting report:', err);
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
  }
}
