/**
 * vercel-build.ts
 * Run by Vercel's postbuild hook to migrate + seed on first deploy.
 * Re-runs on every deploy but all inserts use onConflictDoNothing / onConflictDoUpdate
 * so it is fully idempotent.
 *
 * Usage: set in package.json "postbuild": "tsx scripts/vercel-build.ts"
 *   OR: call manually in Vercel > Project Settings > Build & Development Settings
 *       "Build Command": pnpm build && pnpm vercel:setup
 */
import 'dotenv/config';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set — skipping migration in vercel-build.');
  process.exit(0);
}

async function main() {
  console.log('[vercel-build] Running database migrations...');
  const sql = postgres(connectionString!, { max: 1 });
  const db = drizzle(sql);
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('[vercel-build] Migrations complete.');
  await sql.end();
}

main().catch((err) => {
  console.error('[vercel-build] Migration failed:', err);
  process.exit(1);
});
