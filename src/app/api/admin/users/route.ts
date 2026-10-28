import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq, ne } from 'drizzle-orm';
import { auth } from '@/server/auth';
import { hashPassword } from '@/server/auth/password';
import { z } from 'zod';

/** Only the owner role can manage users. Returns 403 for moderators. */
async function requireOwner() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!role) return null;
  if (role !== 'owner') return 'forbidden';
  return 'ok';
}

// GET /api/admin/users — list all users (owner only)
export async function GET() {
  const check = await requireOwner();
  if (!check) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (check === 'forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const users = await db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        role: schema.users.role,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .orderBy(schema.users.createdAt);

    return NextResponse.json({ success: true, data: users });
  } catch (err) {
    console.error('Error listing users:', err);
    return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
  }
}

const createModeratorSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// POST /api/admin/users — create a moderator (owner only)
export async function POST(req: NextRequest) {
  const check = await requireOwner();
  if (!check) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (check === 'forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const json = await req.json();
    const parsed = createModeratorSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Check for existing user
    const [existing] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, email.toLowerCase()))
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: 'A user with that email already exists' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const [created] = await db
      .insert(schema.users)
      .values({ email: email.toLowerCase(), passwordHash, role: 'moderator' })
      .returning({ id: schema.users.id, email: schema.users.email, role: schema.users.role, createdAt: schema.users.createdAt });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err) {
    console.error('Error creating moderator:', err);
    return NextResponse.json({ error: 'Failed to create moderator' }, { status: 500 });
  }
}

// DELETE /api/admin/users?id=<uuid> — delete a moderator (owner only, cannot delete self or other owners)
export async function DELETE(req: NextRequest) {
  const check = await requireOwner();
  if (!check) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (check === 'forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'User id required' }, { status: 400 });

    // Cannot delete owner accounts (only moderators are deletable)
    const [target] = await db
      .select({ id: schema.users.id, role: schema.users.role })
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);

    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (target.role === 'owner') {
      return NextResponse.json({ error: 'Cannot delete an owner account' }, { status: 403 });
    }

    await db.delete(schema.users).where(eq(schema.users.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting user:', err);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

// Suppress unused import warning
void ne;
