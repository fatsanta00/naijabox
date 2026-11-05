/**
 * scripts/update-owner.ts
 * One-shot script to update the owner account credentials.
 * Usage: pnpm tsx scripts/update-owner.ts
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../src/server/db/schema';
import { hashPassword } from '../src/server/auth/password';
import { eq } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

const NEW_EMAIL = 'stebassey00@gmail.com';
const NEW_PASSWORD = 'admin_991';

async function main() {
  const sql = neon(connectionString!);
  const db = drizzle(sql, { schema });

  // List current users
  const users = await db
    .select({ id: schema.users.id, email: schema.users.email, role: schema.users.role })
    .from(schema.users);
  console.log('Current users in DB:', JSON.stringify(users, null, 2));

  const hash = await hashPassword(NEW_PASSWORD);

  // Update existing owner row
  const result = await db
    .update(schema.users)
    .set({ email: NEW_EMAIL, passwordHash: hash })
    .where(eq(schema.users.role, 'owner'))
    .returning({ id: schema.users.id, email: schema.users.email });

  if (result.length === 0) {
    console.log('No owner found — inserting new owner...');
    await db.insert(schema.users).values({
      email: NEW_EMAIL,
      passwordHash: hash,
      role: 'owner',
    });
    console.log(`✅ New owner created: ${NEW_EMAIL}`);
  } else {
    console.log(`✅ Owner updated to: ${result[0].email}`);
  }
}

main().catch((err) => {
  console.error('❌ Fatal:', err);
  process.exit(1);
});
