import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq, inArray, desc } from 'drizzle-orm';
import { verifyPlayerToken, PLAYER_TOKEN_COOKIE } from '@/server/auth/playerToken';
import { SESSION_COOKIE_NAME } from '@/middleware';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(PLAYER_TOKEN_COOKIE)?.value;
    const currentSessionId = req.cookies.get(SESSION_COOKIE_NAME)?.value;

    let userId: string | null = null;
    if (token) {
      const payload = verifyPlayerToken(token);
      if (payload?.id) {
        userId = payload.id;
      }
    }

    // Collect all session IDs belonging to this user or current session
    const sessionIdsSet = new Set<string>();
    if (currentSessionId) {
      sessionIdsSet.add(currentSessionId);
    }

    if (userId) {
      const userSessions = await db
        .select({ id: schema.sessions.id })
        .from(schema.sessions)
        .where(eq(schema.sessions.userId, userId));

      for (const s of userSessions) {
        sessionIdsSet.add(s.id);
      }
    }

    const sessionIds = Array.from(sessionIdsSet);

    if (sessionIds.length === 0) {
      return NextResponse.json({
        success: true,
        stats: {
          totalPlayed: 0,
          streakDays: 0,
          bestReactionMs: null,
        },
        recentResults: [],
      });
    }

    // Query standard box results
    const rawResults = await db
      .select({
        id: schema.results.id,
        experienceId: schema.results.experienceId,
        score: schema.results.score,
        maxScore: schema.results.maxScore,
        label: schema.results.label,
        displayText: schema.results.displayText,
        createdAt: schema.results.createdAt,
        experienceKey: schema.experiences.key,
        experienceTitle: schema.experiences.title,
      })
      .from(schema.results)
      .leftJoin(schema.experiences, eq(schema.results.experienceId, schema.experiences.id))
      .where(inArray(schema.results.sessionId, sessionIds))
      .orderBy(desc(schema.results.createdAt))
      .limit(30);

    // Query reaction time results
    const rawReaction = await db
      .select({
        id: schema.reactionResults.id,
        ms: schema.reactionResults.ms,
        isDaily: schema.reactionResults.isDaily,
        createdAt: schema.reactionResults.createdAt,
      })
      .from(schema.reactionResults)
      .where(inArray(schema.reactionResults.sessionId, sessionIds))
      .orderBy(desc(schema.reactionResults.createdAt))
      .limit(20);

    // Calculate best reaction time
    let bestReactionMs: number | null = null;
    if (rawReaction.length > 0) {
      bestReactionMs = Math.min(...rawReaction.map((r) => r.ms));
    }

    // Calculate total played
    const totalPlayed = rawResults.length + rawReaction.length;

    // Calculate streak from active days
    const allDates = [
      ...rawResults.map((r) => r.createdAt),
      ...rawReaction.map((r) => r.createdAt),
    ]
      .filter((d): d is Date => d instanceof Date)
      .map((d) => d.toISOString().split('T')[0]);

    const uniqueDates = Array.from(new Set(allDates)).sort().reverse();

    let streakDays = 0;
    if (uniqueDates.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      // If user played today or yesterday, streak is currently active
      if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
        streakDays = 1;
        let expectedPrevDate = new Date(uniqueDates[0]);

        for (let i = 1; i < uniqueDates.length; i++) {
          expectedPrevDate = new Date(expectedPrevDate.getTime() - 86400000);
          const expectedStr = expectedPrevDate.toISOString().split('T')[0];
          if (uniqueDates[i] === expectedStr) {
            streakDays += 1;
          } else {
            break;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalPlayed,
        streakDays,
        bestReactionMs,
      },
      recentResults: rawResults.map((r) => ({
        id: r.id,
        experienceKey: r.experienceKey || 'unknown',
        experienceTitle: r.experienceTitle || 'NaijaBox Experience',
        score: r.score,
        maxScore: r.maxScore,
        label: r.label,
        displayText: r.displayText,
        createdAt: r.createdAt.toISOString(),
      })),
      recentReaction: rawReaction.map((r) => ({
        id: r.id,
        ms: r.ms,
        isDaily: r.isDaily,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error('Error fetching account history:', err);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
