import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/server/auth';
import { z } from 'zod';

const moderationActionSchema = z.object({
  question_id: z.string().uuid(),
  action: z.enum(['approve', 'edit_approve', 'reject', 'delete']),
  flags: z.array(z.enum(['spam', 'offensive', 'duplicate', 'low_quality', 'incorrect', 'not_relevant', 'other'])).optional(),
  notes: z.string().optional(),
  // For edit_approve:
  edited_text: z.string().min(1).optional(),
  edited_options: z.unknown().optional(),
  edited_explanation: z.string().optional(),
  author_name: z.string().optional(),
  show_attribution: z.boolean().optional(),
});

export async function GET() {
  try {
    // Get pending questions for review (oldest first)
    const pendingQuestions = await db
      .select()
      .from(schema.questions)
      .where(eq(schema.questions.status, 'pending'))
      .orderBy(desc(schema.questions.createdAt));

    return NextResponse.json({ success: true, data: pendingQuestions });
  } catch (err) {
    console.error('Error fetching moderation queue:', err);
    return NextResponse.json({ error: 'Failed to fetch moderation queue' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const reviewerId = (session?.user as { id?: string })?.id || null;

    const json = await req.json();
    const parsed = moderationActionSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid moderation payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      question_id,
      action,
      flags,
      notes,
      edited_text,
      edited_options,
      edited_explanation,
      author_name,
      show_attribution,
    } = parsed.data;

    // Verify question exists and is in pending state
    const [existing] = await db
      .select()
      .from(schema.questions)
      .where(eq(schema.questions.id, question_id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const moderationMetadata = {
      flags: flags || [],
      notes: notes || null,
      reviewerId,
      reviewedAt: new Date().toISOString(),
      action,
    };

    let targetStatus: schema.Question['status'];
    const updatePayload: Partial<schema.InsertQuestion> = {
      moderation: moderationMetadata,
      updatedAt: new Date(),
    };

    switch (action) {
      case 'approve':
        targetStatus = 'published';
        updatePayload.publishedAt = new Date();
        break;
      case 'edit_approve':
        targetStatus = 'published';
        updatePayload.publishedAt = new Date();
        if (edited_text) updatePayload.text = edited_text;
        if (edited_options !== undefined) updatePayload.options = edited_options;
        if (edited_explanation !== undefined) updatePayload.explanation = edited_explanation;
        if (author_name !== undefined) updatePayload.authorName = author_name;
        if (show_attribution !== undefined) updatePayload.showAttribution = show_attribution;
        break;
      case 'reject':
        targetStatus = 'rejected';
        break;
      case 'delete':
        targetStatus = 'deleted';
        break;
    }

    updatePayload.status = targetStatus;

    const [updated] = await db
      .update(schema.questions)
      .set(updatePayload)
      .where(eq(schema.questions.id, question_id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Question marked as ${targetStatus}`,
    });
  } catch (err) {
    console.error('Moderation error:', err);
    return NextResponse.json({ error: 'Failed to process moderation action' }, { status: 500 });
  }
}
