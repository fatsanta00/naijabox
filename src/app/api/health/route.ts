import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Ping the database
    await db.execute(sql`SELECT 1`);

    return NextResponse.json(
      {
        status: 'ok',
        db: 'connected',
        ts: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Health check DB error:', err);
    return NextResponse.json(
      {
        status: 'error',
        db: 'disconnected',
        ts: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
