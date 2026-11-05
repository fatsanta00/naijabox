import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPlayerToken, PLAYER_TOKEN_COOKIE } from '@/server/auth/playerToken';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(PLAYER_TOKEN_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ success: false, user: null });
    }

    const payload = verifyPlayerToken(token);
    if (!payload?.id) {
      return NextResponse.json({ success: false, user: null });
    }

    const [user] = await db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        role: schema.users.role,
      })
      .from(schema.users)
      .where(eq(schema.users.id, payload.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ success: false, user: null });
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error('Error fetching current player:', err);
    return NextResponse.json({ success: false, user: null });
  }
}
