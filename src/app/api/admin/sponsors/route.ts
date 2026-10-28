import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/server/auth';
import { z } from 'zod';

const createSponsorSchema = z.object({
  name: z.string().min(2).max(100),
  logoUrl: z.string().url().nullable().optional(),
  url: z.string().url().nullable().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const allSponsors = await db
      .select()
      .from(schema.sponsors)
      .orderBy(desc(schema.sponsors.id));

    return NextResponse.json({ success: true, data: allSponsors });
  } catch (err) {
    console.error('Error fetching sponsors:', err);
    return NextResponse.json({ error: 'Failed to fetch sponsors' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await req.json();
    const parsed = createSponsorSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid sponsor data', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, logoUrl, url } = parsed.data;

    const [created] = await db
      .insert(schema.sponsors)
      .values({
        name,
        logoUrl: logoUrl || null,
        url: url || null,
      })
      .returning();

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err) {
    console.error('Error creating sponsor:', err);
    return NextResponse.json({ error: 'Failed to create sponsor' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Sponsor ID required' }, { status: 400 });

    // First delete associated sponsorships
    await db.delete(schema.sponsorships).where(eq(schema.sponsorships.sponsorId, id));
    await db.delete(schema.sponsors).where(eq(schema.sponsors.id, id));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting sponsor:', err);
    return NextResponse.json({ error: 'Failed to delete sponsor' }, { status: 500 });
  }
}
