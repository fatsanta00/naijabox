import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq, and, or, isNull, lte, gte } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const experienceKey = searchParams.get('experience');
    const now = new Date();

    let expId: string | null = null;
    if (experienceKey) {
      const [exp] = await db
        .select({ id: schema.experiences.id })
        .from(schema.experiences)
        .where(eq(schema.experiences.key, experienceKey))
        .limit(1);
      if (exp) expId = exp.id;
    }

    // Query active sponsorship matching experienceId or general
    const rows = await db
      .select({
        id: schema.sponsorships.id,
        label: schema.sponsorships.label,
        sponsorId: schema.sponsors.id,
        sponsorName: schema.sponsors.name,
        sponsorLogoUrl: schema.sponsors.logoUrl,
        sponsorUrl: schema.sponsors.url,
      })
      .from(schema.sponsorships)
      .innerJoin(schema.sponsors, eq(schema.sponsorships.sponsorId, schema.sponsors.id))
      .where(
        and(
          eq(schema.sponsorships.isActive, true),
          or(isNull(schema.sponsorships.startsAt), lte(schema.sponsorships.startsAt, now)),
          or(isNull(schema.sponsorships.endsAt), gte(schema.sponsorships.endsAt, now)),
          expId
            ? or(eq(schema.sponsorships.experienceId, expId), isNull(schema.sponsorships.experienceId))
            : isNull(schema.sponsorships.experienceId)
        )
      )
      .limit(1);

    const activeSponsorship = rows[0] || null;

    return NextResponse.json({
      success: true,
      data: activeSponsorship,
    });
  } catch (err) {
    console.error('Error fetching active sponsorship:', err);
    return NextResponse.json({ error: 'Failed to fetch active sponsorship' }, { status: 500 });
  }
}
