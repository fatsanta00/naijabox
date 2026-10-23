import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { asc } from 'drizzle-orm';
import { z } from 'zod';

const createCategorySchema = z.object({
  name: z.string().min(1).max(64),
  slug: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/),
  sort_order: z.number().int().default(0),
});

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(schema.categories)
      .orderBy(asc(schema.categories.sortOrder));

    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching categories:', err);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = createCategorySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid category payload', details: parsed.error.format() }, { status: 400 });
    }

    const { name, slug, sort_order } = parsed.data;

    const [inserted] = await db
      .insert(schema.categories)
      .values({
        name,
        slug,
        sortOrder: sort_order,
      })
      .returning();

    return NextResponse.json({ success: true, data: inserted }, { status: 201 });
  } catch (err) {
    console.error('Error creating category:', err);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
