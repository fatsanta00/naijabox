import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateQuestionSchema = z.object({
  text: z.string().min(1).optional(),
  category_id: z.string().uuid().nullable().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).nullable().optional(),
  options: z.record(z.unknown()).or(z.array(z.unknown())).optional(),
  correct: z.array(z.string()).nullable().optional(),
  scoring: z.record(z.unknown()).nullable().optional(),
  explanation: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
  status: z.enum(['draft', 'published', 'unpublished', 'rejected', 'deleted']).optional(),
  author_name: z.string().nullable().optional(),
  show_attribution: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [q] = await db.select().from(schema.questions).where(eq(schema.questions.id, id)).limit(1);

    if (!q) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: q });
  } catch (err) {
    console.error('Admin get question by id error:', err);
    return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await req.json();
    const parsed = updateQuestionSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid update payload', details: parsed.error.format() }, { status: 400 });
    }

    const updates: Partial<schema.InsertQuestion> = {
      updatedAt: new Date(),
    };

    const d = parsed.data;
    if (d.text !== undefined) updates.text = d.text;
    if (d.category_id !== undefined) updates.categoryId = d.category_id;
    if (d.difficulty !== undefined) updates.difficulty = d.difficulty;
    if (d.options !== undefined) updates.options = d.options;
    if (d.correct !== undefined) updates.correct = d.correct;
    if (d.scoring !== undefined) updates.scoring = d.scoring;
    if (d.explanation !== undefined) updates.explanation = d.explanation;
    if (d.sort_order !== undefined) updates.sortOrder = d.sort_order;
    if (d.status !== undefined) {
      updates.status = d.status;
      if (d.status === 'published') {
        updates.publishedAt = new Date();
      }
    }
    if (d.author_name !== undefined) updates.authorName = d.author_name;
    if (d.show_attribution !== undefined) updates.showAttribution = d.show_attribution;

    const [updated] = await db
      .update(schema.questions)
      .set(updates)
      .where(eq(schema.questions.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('Admin patch question error:', err);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Soft delete to preserve response statistics integrity
    const [deleted] = await db
      .update(schema.questions)
      .set({ status: 'deleted', updatedAt: new Date() })
      .where(eq(schema.questions.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Question soft deleted' });
  } catch (err) {
    console.error('Admin delete question error:', err);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}
