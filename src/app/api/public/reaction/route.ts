import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { reactionResults } from '@/server/db/schema';
import { lt, count, sql } from 'drizzle-orm';

const MIN_SAMPLE = Number(process.env.MIN_STATS_SAMPLE ?? 30);

function getToday(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

/** POST /api/public/reaction — store a reaction time result */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ms, is_daily, session_id } = body as {
      ms: unknown;
      is_daily: unknown;
      session_id: unknown;
    };

    if (
      typeof ms !== 'number' ||
      ms < 50 ||
      ms > 10_000 ||
      typeof session_id !== 'string' ||
      !session_id
    ) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const isDaily = Boolean(is_daily);
    const challengeDate = isDaily ? getToday() : null;

    const [inserted] = await db
      .insert(reactionResults)
      .values({
        sessionId: session_id,
        ms,
        isDaily,
        challengeDate: challengeDate ?? undefined,
      })
      .returning({ id: reactionResults.id });

    return NextResponse.json({ id: inserted.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** GET /api/public/reaction?ms=NNN — return percentile (gated by MIN_SAMPLE) */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const msParam = Number(searchParams.get('ms'));

    if (!msParam || isNaN(msParam) || msParam <= 0) {
      return NextResponse.json({ available: false }, { status: 200 });
    }

    // Total count of valid results in DB
    const [{ total }] = await db
      .select({ total: count() })
      .from(reactionResults);

    if (total < MIN_SAMPLE) {
      return NextResponse.json({ available: false }, { status: 200 });
    }

    // How many are SLOWER (higher ms) than the user's time → percentile = fasterThan / total
    const [{ slower }] = await db
      .select({ slower: count() })
      .from(reactionResults)
      .where(lt(reactionResults.ms, sql<number>`${msParam}`));

    const percentile = Math.round((Number(slower) / total) * 100);

    return NextResponse.json(
      {
        available: true,
        percentile,
        total,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ available: false }, { status: 200 });
  }
}
