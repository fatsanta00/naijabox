import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { events, responses, sessions } from '@/server/db/schema';
import { eq, sql, desc } from 'drizzle-orm';

/**
 * GET /api/admin/analytics/dashboard
 * Aggregates core business insight:
 * - Most opened box
 * - Experience starts vs completions (funnel/completion rate)
 * - Total events & unique visitor sessions
 * - Device breakdown (mobile vs desktop)
 * - Referrer source breakdown (WhatsApp, X, TikTok, Direct, etc.)
 * - Share clicks
 */
export async function GET() {
  try {
    // 1. Box Openings & Starts ("Which box gets opened the most?" - PRD AC)
    const boxPopularity = await db
      .select({
        experience: sql<string>`COALESCE(${events.props}->>'experience', ${events.path})`,
        count: sql<number>`count(*)`,
      })
      .from(events)
      .where(sql`${events.name} IN ('experience_started', 'box_opened')`)
      .groupBy(sql`COALESCE(${events.props}->>'experience', ${events.path})`)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    // 2. Completion Funnel (starts vs completions per experience)
    const startedCounts = await db
      .select({
        experience: sql<string>`${events.props}->>'experience'`,
        count: sql<number>`count(*)`,
      })
      .from(events)
      .where(eq(events.name, 'experience_started'))
      .groupBy(sql`${events.props}->>'experience'`);

    const completedCounts = await db
      .select({
        experience: sql<string>`${events.props}->>'experience'`,
        count: sql<number>`count(*)`,
      })
      .from(events)
      .where(eq(events.name, 'experience_completed'))
      .groupBy(sql`${events.props}->>'experience'`);

    const completedMap = new Map<string, number>();
    for (const c of completedCounts) {
      if (c.experience) completedMap.set(c.experience, Number(c.count));
    }

    const funnel = startedCounts.map((s) => {
      const exp = s.experience || 'unknown';
      const starts = Number(s.count);
      const completions = completedMap.get(exp) || 0;
      const completionRate = starts > 0 ? Math.round((completions / starts) * 100) : 0;
      return {
        experience: exp,
        starts,
        completions,
        completionRate,
      };
    });

    // 3. Traffic Sources (Referrer Breakdown)
    const trafficSources = await db
      .select({
        source: events.referrerSource,
        count: sql<number>`count(*)`,
      })
      .from(events)
      .groupBy(events.referrerSource)
      .orderBy(desc(sql`count(*)`));

    // 4. Device Class Breakdown (Mobile vs Desktop)
    const devices = await db
      .select({
        device: events.deviceClass,
        count: sql<number>`count(*)`,
      })
      .from(events)
      .groupBy(events.deviceClass)
      .orderBy(desc(sql`count(*)`));

    // 5. Shares breakdown
    const shares = await db
      .select({
        target: sql<string>`${events.props}->>'target'`,
        count: sql<number>`count(*)`,
      })
      .from(events)
      .where(eq(events.name, 'share_clicked'))
      .groupBy(sql`${events.props}->>'target'`)
      .orderBy(desc(sql`count(*)`));

    // 6. High-level counts
    const [totalEventsRow] = await db.select({ count: sql<number>`count(*)` }).from(events);
    const [totalSessionsRow] = await db.select({ count: sql<number>`count(*)` }).from(sessions);
    const [totalResponsesRow] = await db.select({ count: sql<number>`count(*)` }).from(responses);

    return NextResponse.json({
      summary: {
        totalEvents: Number(totalEventsRow?.count || 0),
        totalSessions: Number(totalSessionsRow?.count || 0),
        totalResponses: Number(totalResponsesRow?.count || 0),
      },
      mostOpenedBox: boxPopularity[0] || null,
      boxPopularity,
      funnel,
      trafficSources,
      devices,
      shares,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to query analytics';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
