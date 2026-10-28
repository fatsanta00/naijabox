import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/server/auth';
import { z } from 'zod';

const createSponsorshipSchema = z.object({
  sponsorId: z.string().uuid(),
  experienceId: z.string().uuid().nullable().optional(),
  label: z.string().min(2).max(100),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rows = await db
      .select({
        id: schema.sponsorships.id,
        sponsorId: schema.sponsorships.sponsorId,
        sponsorName: schema.sponsors.name,
        sponsorUrl: schema.sponsors.url,
        sponsorLogoUrl: schema.sponsors.logoUrl,
        experienceId: schema.sponsorships.experienceId,
        experienceTitle: schema.experiences.title,
        experienceKey: schema.experiences.key,
        label: schema.sponsorships.label,
        startsAt: schema.sponsorships.startsAt,
        endsAt: schema.sponsorships.endsAt,
        isActive: schema.sponsorships.isActive,
      })
      .from(schema.sponsorships)
      .innerJoin(schema.sponsors, eq(schema.sponsorships.sponsorId, schema.sponsors.id))
      .leftJoin(schema.experiences, eq(schema.sponsorships.experienceId, schema.experiences.id))
      .orderBy(desc(schema.sponsorships.id));

    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching sponsorships:', err);
    return NextResponse.json({ error: 'Failed to fetch sponsorships' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await req.json();
    const parsed = createSponsorshipSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid sponsorship payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { sponsorId, experienceId, label, startsAt, endsAt, isActive } = parsed.data;

    const [created] = await db
      .insert(schema.sponsorships)
      .values({
        sponsorId,
        experienceId: experienceId || null,
        label,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        isActive: isActive ?? true,
      })
      .returning();

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err) {
    console.error('Error creating sponsorship:', err);
    return NextResponse.json({ error: 'Failed to create sponsorship' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await req.json();
    const { id, isActive } = json;
    if (!id || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'id and isActive boolean required' }, { status: 400 });
    }

    const [updated] = await db
      .update(schema.sponsorships)
      .set({ isActive })
      .where(eq(schema.sponsorships.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error updating sponsorship:', err);
    return NextResponse.json({ error: 'Failed to update sponsorship' }, { status: 500 });
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
    if (!id) return NextResponse.json({ error: 'Sponsorship ID required' }, { status: 400 });

    await db.delete(schema.sponsorships).where(eq(schema.sponsorships.id, id));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting sponsorship:', err);
    return NextResponse.json({ error: 'Failed to delete sponsorship' }, { status: 500 });
  }
}
