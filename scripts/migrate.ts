import 'dotenv/config';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL or DATABASE_URL_UNPOOLED is required');

const sql = neon(connectionString);
const db = drizzle(sql);

async function main() {
  console.log('Running migrations on Neon via HTTP...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations complete.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
