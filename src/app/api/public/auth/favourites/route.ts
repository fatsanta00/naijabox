import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyPlayerToken, PLAYER_TOKEN_COOKIE } from '@/server/auth/playerToken';
import { z } from 'zod';

const favSchema = z.object({
  boxSlug: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(PLAYER_TOKEN_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ success: true, favourites: [] });
    }

    const payload = verifyPlayerToken(token);
    if (!payload?.id) {
      return NextResponse.json({ success: true, favourites: [] });
    }

    const rows = await db
      .select({
        boxSlug: schema.userFavourites.boxSlug,
        createdAt: schema.userFavourites.createdAt,
      })
      .from(schema.userFavourites)
      .where(eq(schema.userFavourites.userId, payload.id));

    return NextResponse.json({
      success: true,
      favourites: rows.map((r) => r.boxSlug),
    });
  } catch (err) {
    console.error('Error fetching favourites:', err);
    return NextResponse.json({ error: 'Failed to fetch favourites' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(PLAYER_TOKEN_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Please sign in to save favourites' }, { status: 401 });
    }

    const payload = verifyPlayerToken(token);
    if (!payload?.id) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    const json = await req.json();
    const parsed = favSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid box slug' }, { status: 400 });
    }

    const { boxSlug } = parsed.data;

    // Check if already favourited
    const [existing] = await db
      .select({ id: schema.userFavourites.id })
      .from(schema.userFavourites)
      .where(
        and(
          eq(schema.userFavourites.userId, payload.id),
          eq(schema.userFavourites.boxSlug, boxSlug)
        )
      )
      .limit(1);

    if (existing) {
      // Toggle off / delete
      await db
        .delete(schema.userFavourites)
        .where(
          and(
            eq(schema.userFavourites.userId, payload.id),
            eq(schema.userFavourites.boxSlug, boxSlug)
          )
        );
      return NextResponse.json({ success: true, isFavourited: false });
    }

    // Insert
    await db.insert(schema.userFavourites).values({
      userId: payload.id,
      boxSlug,
    });

    return NextResponse.json({ success: true, isFavourited: true });
  } catch (err) {
    console.error('Error updating favourite:', err);
    return NextResponse.json({ error: 'Failed to update favourite' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get(PLAYER_TOKEN_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyPlayerToken(token);
    if (!payload?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const boxSlug = searchParams.get('boxSlug');
    if (!boxSlug) {
      return NextResponse.json({ error: 'Missing boxSlug parameter' }, { status: 400 });
    }

    await db
      .delete(schema.userFavourites)
      .where(
        and(
          eq(schema.userFavourites.userId, payload.id),
          eq(schema.userFavourites.boxSlug, boxSlug)
        )
      );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting favourite:', err);
    return NextResponse.json({ error: 'Failed to remove favourite' }, { status: 500 });
  }
}
