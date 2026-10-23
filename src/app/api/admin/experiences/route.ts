import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateExperienceSchema = z.object({
  selection_mode: z.enum(['random', 'ordered']).optional(),
  question_count: z.number().int().positive().nullable().optional(),
  is_active: z.boolean().optional(),
  settings: z.record(z.unknown()).optional(),
});

export async function GET() {
  try {
    const rows = await db.select().from(schema.experiences);
    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching experiences:', err);
    return NextResponse.json({ error: 'Failed to fetch experiences' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const json = await req.json();
    const { key, ...rest } = json;

    if (!key) {
      return NextResponse.json({ error: 'Experience key is required' }, { status: 400 });
    }

    const parsed = updateExperienceSchema.safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
    }

    const updates: Partial<schema.InsertExperience> = {
      updatedAt: new Date(),
    };

    if (parsed.data.selection_mode !== undefined) updates.selectionMode = parsed.data.selection_mode;
    if (parsed.data.question_count !== undefined) updates.questionCount = parsed.data.question_count;
    if (parsed.data.is_active !== undefined) updates.isActive = parsed.data.is_active;
    if (parsed.data.settings !== undefined) updates.settings = parsed.data.settings;

    const [updated] = await db
      .update(schema.experiences)
      .set(updates)
      .where(eq(schema.experiences.key, key))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Experience not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error updating experience:', err);
    return NextResponse.json({ error: 'Failed to update experience settings' }, { status: 500 });
  }
}
