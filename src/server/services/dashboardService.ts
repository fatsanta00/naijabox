import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { sql, desc, eq, gte } from 'drizzle-orm';
import { getAllBoxes } from '@/boxes/registry';

export interface DashboardData {
  analytics: {
    totalVisitors: number;
    uniqueVisitorsToday: number;
    uniqueVisitors7d: number;
    uniqueVisitors30d: number;
    totalPageViews: number;
    pageViewsToday: number;
    mostVisitedPages: Array<{ path: string; count: number }>;
    mostVisitedGames: Array<{ experience: string; count: number }>;
    trends: Array<{
      date: string;
      label: string;
      visitors: number;
      pageViews: number;
    }>;
    deviceBreakdown: {
      mobile: number;
      desktop: number;
      mobilePct: number;
      desktopPct: number;
    };
    trackingStartedAt: string | null;
    hasData: boolean;
  };
  content: {
    totalGames: number;
    totalQuizzes: number;
    totalTools: number;
    totalBoxes: number;
    questionsTotal: number;
    questionsPublished: number;
    questionsPending: number;
    questionsRejected: number;
    categoriesCount: number;
    recentlyUpdatedQuestions: Array<{
      id: string;
      text: string;
      status: string;
      authorName: string | null;
      updatedAt: string;
    }>;
  };
  activity: {
    pendingSubmissionsCount: number;
    openReportsCount: number;
    recentSubmissions: Array<{
      id: string;
      text: string;
      authorName: string | null;
      createdAt: string;
    }>;
    recentReports: Array<{
      id: string;
      reason: string;
      note: string | null;
      createdAt: string;
    }>;
    liveEventsStream: Array<{
      id: number;
      name: string;
      path: string | null;
      deviceClass: string | null;
      createdAt: string;
    }>;
  };
  sponsors: {
    activeSponsorsCount: number;
  };
}

export async function getDashboardOverview(): Promise<DashboardData> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 1. Content Overview from Box Registry & Database
  const allBoxes = getAllBoxes();
  const totalGames = allBoxes.filter((b) => b.kind === 'game').length;
  const totalQuizzes = allBoxes.filter((b) => b.kind === 'quiz' || b.kind === 'test').length;
  const totalTools = allBoxes.filter((b) => b.kind === 'tool').length;

  // Question stats by status
  const questionStatusCounts = await db
    .select({
      status: schema.questions.status,
      count: sql<number>`count(*)`,
    })
    .from(schema.questions)
    .groupBy(schema.questions.status);

  let questionsPublished = 0;
  let questionsPending = 0;
  let questionsRejected = 0;
  let questionsTotal = 0;

  for (const row of questionStatusCounts) {
    const c = Number(row.count);
    questionsTotal += c;
    if (row.status === 'published') questionsPublished = c;
    if (row.status === 'pending') questionsPending = c;
    if (row.status === 'rejected') questionsRejected = c;
  }

  // Categories count
  const [categoriesRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.categories);

  // Recently updated questions
  const recentlyUpdatedQuestions = await db
    .select({
      id: schema.questions.id,
      text: schema.questions.text,
      status: schema.questions.status,
      authorName: schema.questions.authorName,
      updatedAt: schema.questions.updatedAt,
    })
    .from(schema.questions)
    .orderBy(desc(schema.questions.updatedAt))
    .limit(5);

  // 2. Moderation Activity
  const pendingSubmissions = await db
    .select({
      id: schema.questions.id,
      text: schema.questions.text,
      authorName: schema.questions.authorName,
      createdAt: schema.questions.createdAt,
    })
    .from(schema.questions)
    .where(eq(schema.questions.status, 'pending'))
    .orderBy(desc(schema.questions.createdAt))
    .limit(5);

  const openReports = await db
    .select({
      id: schema.questionReports.id,
      reason: schema.questionReports.reason,
      note: schema.questionReports.note,
      createdAt: schema.questionReports.createdAt,
    })
    .from(schema.questionReports)
    .where(eq(schema.questionReports.status, 'open'))
    .orderBy(desc(schema.questionReports.createdAt))
    .limit(5);

  const [openReportsCountRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.questionReports)
    .where(eq(schema.questionReports.status, 'open'));

  // Active sponsors
  const [sponsorsCountRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.sponsors);

  // 3. Website Analytics
  // Unique visitors total (all-time)
  const [totalVisitorsRow] = await db
    .select({ count: sql<number>`count(distinct ${schema.events.sessionId})` })
    .from(schema.events);

  // Visitors today
  const [visitorsTodayRow] = await db
    .select({ count: sql<number>`count(distinct ${schema.events.sessionId})` })
    .from(schema.events)
    .where(gte(schema.events.createdAt, todayStart));

  // Visitors last 7 days
  const [visitors7dRow] = await db
    .select({ count: sql<number>`count(distinct ${schema.events.sessionId})` })
    .from(schema.events)
    .where(gte(schema.events.createdAt, sevenDaysAgo));

  // Visitors last 30 days
  const [visitors30dRow] = await db
    .select({ count: sql<number>`count(distinct ${schema.events.sessionId})` })
    .from(schema.events)
    .where(gte(schema.events.createdAt, thirtyDaysAgo));

  // Total Pageviews
  const [totalPageViewsRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.events)
    .where(eq(schema.events.name, 'page_view'));

  // Pageviews today
  const [pageViewsTodayRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.events)
    .where(sql`${schema.events.name} = 'page_view' AND ${schema.events.createdAt} >= ${todayStart}`);

  // Earliest recorded event timestamp
  const [earliestEventRow] = await db
    .select({ earliest: sql<string>`min(${schema.events.createdAt})` })
    .from(schema.events);

  // Most visited pages
  const mostVisitedPages = await db
    .select({
      path: sql<string>`COALESCE(${schema.events.path}, '/')`,
      count: sql<number>`count(*)`,
    })
    .from(schema.events)
    .where(sql`${schema.events.path} IS NOT NULL`)
    .groupBy(sql`COALESCE(${schema.events.path}, '/')`)
    .orderBy(desc(sql`count(*)`))
    .limit(6);

  // Most played games / experiences
  const mostVisitedGames = await db
    .select({
      experience: sql<string>`COALESCE(${schema.events.props}->>'experience', ${schema.events.path})`,
      count: sql<number>`count(*)`,
    })
    .from(schema.events)
    .where(sql`${schema.events.name} IN ('box_opened', 'experience_started')`)
    .groupBy(sql`COALESCE(${schema.events.props}->>'experience', ${schema.events.path})`)
    .orderBy(desc(sql`count(*)`))
    .limit(6);

  // Device breakdown
  const deviceCounts = await db
    .select({
      device: schema.events.deviceClass,
      count: sql<number>`count(*)`,
    })
    .from(schema.events)
    .where(sql`${schema.events.deviceClass} IS NOT NULL`)
    .groupBy(schema.events.deviceClass);

  let mobileCount = 0;
  let desktopCount = 0;
  for (const d of deviceCounts) {
    if (d.device === 'mobile') mobileCount += Number(d.count);
    if (d.device === 'desktop') desktopCount += Number(d.count);
  }
  const totalDevices = mobileCount + desktopCount;
  const mobilePct = totalDevices > 0 ? Math.round((mobileCount / totalDevices) * 100) : 0;
  const desktopPct = totalDevices > 0 ? 100 - mobilePct : 0;

  // 7-day visitor & pageview trends
  const dailyTrends = await db
    .select({
      day: sql<string>`TO_CHAR(${schema.events.createdAt}, 'YYYY-MM-DD')`,
      visitors: sql<number>`COUNT(DISTINCT ${schema.events.sessionId})`,
      pageViews: sql<number>`COUNT(CASE WHEN ${schema.events.name} = 'page_view' THEN 1 END)`,
    })
    .from(schema.events)
    .where(gte(schema.events.createdAt, sevenDaysAgo))
    .groupBy(sql`TO_CHAR(${schema.events.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`TO_CHAR(${schema.events.createdAt}, 'YYYY-MM-DD')`);

  // Build a continuous 7-day series so chart has no missing dates
  const trendsMap = new Map(dailyTrends.map((d) => [d.day, d]));
  const trends: Array<{ date: string; label: string; visitors: number; pageViews: number }> = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
    const match = trendsMap.get(dayStr);
    trends.push({
      date: dayStr,
      label: dayLabel,
      visitors: match ? Number(match.visitors) : 0,
      pageViews: match ? Number(match.pageViews) : 0,
    });
  }

  // Live real-time stream of latest 6 events
  const liveEventsStream = await db
    .select({
      id: schema.events.id,
      name: schema.events.name,
      path: schema.events.path,
      deviceClass: schema.events.deviceClass,
      createdAt: schema.events.createdAt,
    })
    .from(schema.events)
    .orderBy(desc(schema.events.createdAt))
    .limit(6);

  const totalVisitors = Number(totalVisitorsRow?.count || 0);

  return {
    analytics: {
      totalVisitors,
      uniqueVisitorsToday: Number(visitorsTodayRow?.count || 0),
      uniqueVisitors7d: Number(visitors7dRow?.count || 0),
      uniqueVisitors30d: Number(visitors30dRow?.count || 0),
      totalPageViews: Number(totalPageViewsRow?.count || 0),
      pageViewsToday: Number(pageViewsTodayRow?.count || 0),
      mostVisitedPages: mostVisitedPages.map((p) => ({ path: p.path, count: Number(p.count) })),
      mostVisitedGames: mostVisitedGames.map((g) => ({ experience: g.experience || 'General', count: Number(g.count) })),
      trends,
      deviceBreakdown: {
        mobile: mobileCount,
        desktop: desktopCount,
        mobilePct,
        desktopPct,
      },
      trackingStartedAt: earliestEventRow?.earliest ? new Date(earliestEventRow.earliest).toLocaleDateString() : null,
      hasData: totalVisitors > 0,
    },
    content: {
      totalGames,
      totalQuizzes,
      totalTools,
      totalBoxes: allBoxes.length,
      questionsTotal,
      questionsPublished,
      questionsPending,
      questionsRejected,
      categoriesCount: Number(categoriesRow?.count || 0),
      recentlyUpdatedQuestions: recentlyUpdatedQuestions.map((q) => ({
        id: q.id,
        text: q.text,
        status: q.status,
        authorName: q.authorName,
        updatedAt: new Date(q.updatedAt).toLocaleDateString(),
      })),
    },
    activity: {
      pendingSubmissionsCount: pendingSubmissions.length,
      openReportsCount: Number(openReportsCountRow?.count || 0),
      recentSubmissions: pendingSubmissions.map((s) => ({
        id: s.id,
        text: s.text,
        authorName: s.authorName,
        createdAt: new Date(s.createdAt).toLocaleDateString(),
      })),
      recentReports: openReports.map((r) => ({
        id: r.id,
        reason: r.reason,
        note: r.note,
        createdAt: new Date(r.createdAt).toLocaleDateString(),
      })),
      liveEventsStream: liveEventsStream.map((e) => ({
        id: e.id,
        name: e.name,
        path: e.path,
        deviceClass: e.deviceClass,
        createdAt: new Date(e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })),
    },
    sponsors: {
      activeSponsorsCount: Number(sponsorsCountRow?.count || 0),
    },
  };
}
