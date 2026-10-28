import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq, and, desc, like, inArray } from 'drizzle-orm';
import { z } from 'zod';

const createQuestionSchema = z.object({
  experience_id: z.string().uuid(),
  text: z.string().min(1),
  category_id: z.string().uuid().nullable().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).nullable().optional(),
  options: z.record(z.unknown()).or(z.array(z.unknown())),
  correct: z.array(z.string()).nullable().optional(),
  scoring: z.record(z.unknown()).nullable().optional(),
  explanation: z.string().nullable().optional(),
  sort_order: z.number().int().default(0),
  status: z.enum(['draft', 'published', 'unpublished']).default('draft'),
  author_name: z.string().nullable().optional(),
  show_attribution: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const experienceId = searchParams.get('experience_id');
    const status = searchParams.get('status') as schema.Question['status'] | null;
    const categoryId = searchParams.get('category_id');
    const search = searchParams.get('q');
    const source = searchParams.get('source') as schema.Question['source'] | null;

    const conditions = [];

    if (experienceId) {
      conditions.push(eq(schema.questions.experienceId, experienceId));
    }
    if (status) {
      conditions.push(eq(schema.questions.status, status));
    }
    if (categoryId) {
      conditions.push(eq(schema.questions.categoryId, categoryId));
    }
    if (source) {
      conditions.push(eq(schema.questions.source, source));
    }
    if (search) {
      conditions.push(like(schema.questions.text, `%${search}%`));
    }

    const query = db.select().from(schema.questions);
    const rows =
      conditions.length > 0
        ? await query.where(and(...conditions)).orderBy(desc(schema.questions.createdAt))
        : await query.orderBy(desc(schema.questions.createdAt));

    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    console.error('Admin get questions error:', err);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = createQuestionSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid question payload', details: parsed.error.format() }, { status: 400 });
    }

    const {
      experience_id,
      text,
      category_id,
      difficulty,
      options,
      correct,
      scoring,
      explanation,
      sort_order,
      status,
      author_name,
      show_attribution,
    } = parsed.data;

    const [inserted] = await db
      .insert(schema.questions)
      .values({
        experienceId: experience_id,
        text,
        categoryId: category_id,
        difficulty,
        options,
        correct,
        scoring,
        explanation,
        sortOrder: sort_order,
        status,
        source: 'admin',
        authorName: author_name,
        showAttribution: show_attribution,
        publishedAt: status === 'published' ? new Date() : null,
      })
      .returning();

    return NextResponse.json({ success: true, data: inserted }, { status: 201 });
  } catch (err) {
    console.error('Admin create question error:', err);
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}

const bulkActionSchema = z.object({
  action: z.enum(['publish', 'unpublish', 'delete']),
  ids: z.array(z.string().uuid()).min(1),
});

export async function PATCH(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = bulkActionSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid bulk action payload', details: parsed.error.format() }, { status: 400 });
    }

    const { action, ids } = parsed.data;

    if (action === 'publish') {
      await db
        .update(schema.questions)
        .set({ status: 'published', publishedAt: new Date() })
        .where(inArray(schema.questions.id, ids));
    } else if (action === 'unpublish') {
      await db
        .update(schema.questions)
        .set({ status: 'unpublished' })
        .where(inArray(schema.questions.id, ids));
    } else if (action === 'delete') {
      await db
        .update(schema.questions)
        .set({ status: 'deleted' })
        .where(inArray(schema.questions.id, ids));
    }

    return NextResponse.json({ success: true, count: ids.length, action });
  } catch (err) {
    console.error('Admin bulk questions error:', err);
    return NextResponse.json({ error: 'Failed to perform bulk action' }, { status: 500 });
  }
}
