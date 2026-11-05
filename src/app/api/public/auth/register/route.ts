import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/server/auth/password';
import { signPlayerToken, PLAYER_TOKEN_COOKIE } from '@/server/auth/playerToken';
import { SESSION_COOKIE_NAME } from '@/middleware';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().trim().max(50, 'Name must be 50 characters or less').optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = registerSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { email, password, name } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check existing
    const [existing] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, normalizedEmail))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const [newUser] = await db
      .insert(schema.users)
      .values({
        email: normalizedEmail,
        name: name || null,
        passwordHash,
        role: 'player',
      })
      .returning({
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        role: schema.users.role,
      });

    // Link current anonymous session if present
    const sessionId = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (sessionId) {
      try {
        await db
          .update(schema.sessions)
          .set({ userId: newUser.id })
          .where(eq(schema.sessions.id, sessionId));
      } catch (sessionErr) {
        console.warn('Could not link session on register:', sessionErr);
      }
    }

    const token = signPlayerToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    });

    const res = NextResponse.json(
      { success: true, user: newUser },
      { status: 201 }
    );

    res.cookies.set(PLAYER_TOKEN_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return res;
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
