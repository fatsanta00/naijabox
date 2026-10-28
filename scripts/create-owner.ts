/**
 * scripts/create-owner.ts
 *
 * Safe first-run CLI script to create the initial owner admin account.
 * Reads credentials from environment variables or command-line flags.
 *
 * Usage:
 *   pnpm admin:create-owner
 *   ADMIN_EMAIL=owner@naijabox.app ADMIN_PASSWORD=StrongPassword123! pnpm admin:create-owner
 *   pnpm admin:create-owner --email=owner@naijabox.app --password=StrongPassword123!
 */

import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from '../src/server/db/schema';
import { hashPassword } from '../src/server/auth/password';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ Error: DATABASE_URL environment variable is required.');
  process.exit(1);
}

// Parse command line arguments (e.g. --email=... --password=...)
function getArg(flag: string): string | undefined {
  const arg = process.argv.find((a) => a.startsWith(`--${flag}=`));
  return arg ? arg.split('=')[1] : undefined;
}

const email = getArg('email') || process.env.ADMIN_EMAIL;
const password = getArg('password') || process.env.ADMIN_PASSWORD;

async function main() {
  console.log('🔒 NaijaBox: Initial Owner Account Setup');

  if (!email) {
    console.error('❌ Error: Admin email is required. Set ADMIN_EMAIL or pass --email=<email>');
    process.exit(1);
  }

  if (!password) {
    console.error('❌ Error: Admin password is required. Set ADMIN_PASSWORD or pass --password=<password>');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ Error: Password must be at least 8 characters long.');
    process.exit(1);
  }

  // Refuse default password in production
  const DEFAULT_DEV_PASSWORD = 'naijabox_admin_secret_123';
  if (process.env.NODE_ENV === 'production' && password === DEFAULT_DEV_PASSWORD) {
    console.error('❌ Error: Default password is NOT allowed in production. Choose a strong, unique password.');
    process.exit(1);
  }

  const connStr: string = connectionString!;
  const sql = postgres(connStr, { max: 1 });
  const db = drizzle(sql, { schema });

  try {
    // Check if an owner already exists
    const existingOwners = await db
      .select({ email: schema.users.email, id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.role, 'owner'))
      .limit(1);

    if (existingOwners.length > 0) {
      console.warn(`⚠️ Warning: An owner account already exists (${existingOwners[0].email}).`);
      console.warn('   Refusing to overwrite existing owner. To reset, update database credentials directly.');
      await sql.end();
      process.exit(0);
    }

    // Check if a user with this email exists with another role
    const existingUser = await db
      .select({ id: schema.users.id, role: schema.users.role })
      .from(schema.users)
      .where(eq(schema.users.email, email.toLowerCase().trim()))
      .limit(1);

    const passwordHash = await hashPassword(password);

    if (existingUser.length > 0) {
      // Promote existing user to owner
      await db
        .update(schema.users)
        .set({
          passwordHash,
          role: 'owner',
        })
        .where(eq(schema.users.id, existingUser[0].id));
      console.log(`✅ User ${email} promoted to owner role.`);
    } else {
      // Insert new owner
      await db.insert(schema.users).values({
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'owner',
      });
      console.log(`✅ Owner account successfully created: ${email}`);
    }

    console.log('\n--- Login Details ---');
    console.log(`URL:   ${process.env.SITE_URL || 'http://localhost:3000'}/admin/login`);
    console.log(`Email: ${email}`);
    console.log('Role:  owner (full administrative permissions)');
    console.log('\n💡 Security reminder: Store this password in a secure password manager.');
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error('❌ Fatal error creating owner:', err);
  process.exit(1);
});
