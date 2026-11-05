import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { getDashboardOverview } from '@/server/services/dashboardService';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const data = await getDashboardOverview();
  const { analytics, content, activity, sponsors } = data;

  // Chart coordinate calculation for 7-day trends SVG
  const trendMax = Math.max(
    ...analytics.trends.map((t) => Math.max(t.visitors, t.pageViews)),
    5
  );
  const chartHeight = 160;
  const chartWidth = 500;
  const paddingX = 40;
  const paddingY = 20;
  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = chartHeight - paddingY * 2;

  const pointsVisitors = analytics.trends
    .map((t, idx) => {
      const x = paddingX + (idx / (analytics.trends.length - 1)) * usableWidth;
      const y = chartHeight - paddingY - (t.visitors / trendMax) * usableHeight;
      return `${x},${y}`;
    })
    .join(' ');

  const pointsPageViews = analytics.trends
    .map((t, idx) => {
      const x = paddingX + (idx / (analytics.trends.length - 1)) * usableWidth;
      const y = chartHeight - paddingY - (t.pageViews / trendMax) * usableHeight;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Welcome & Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-naija-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-white tracking-tight">NaijaBox Overview</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ● Live System
            </span>
          </div>
          <p className="text-sm text-naija-muted mt-1">
            Real-time analytics, content inventory, moderation queues, and operational tools.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] px-4 text-xs font-semibold rounded-xl bg-naija-card text-gray-300 hover:text-white border border-naija-border inline-flex items-center justify-center transition-colors"
          >
            Visit Public Site ↗
          </Link>
          <Link
            href="/admin/questions"
            className="min-h-[44px] px-4 text-xs font-semibold rounded-xl bg-brand-500 hover:bg-brand-600 text-white inline-flex items-center justify-center shadow-lg shadow-brand-500/20 transition-all"
          >
            Manage Content →
          </Link>
        </div>
      </div>

      {/* Notice on Data Integrity */}
      {!analytics.hasData && (
        <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/30 text-xs text-brand-300 flex items-start gap-3">
          <span className="text-base">📊</span>
          <div>
            <strong className="block text-white font-semibold mb-0.5">Real-time visitor tracking active</strong>
            Visitor statistics are calculated directly from recorded sessions. Metrics will populate automatically as public users visit and play. No fabricated numbers.
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. WEBSITE ANALYTICS OVERVIEW
         ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📈</span> Website Analytics
          </h2>
          <Link href="/admin/analytics" className="text-xs text-brand-400 hover:text-brand-300 font-medium">
            Detailed Funnels & Sources →
          </Link>
        </div>

        {/* Analytics KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Visitors */}
          <Card className="p-5 border-naija-border/80">
            <span className="text-xs font-semibold text-naija-muted uppercase tracking-wider">
              Total Visitors
            </span>
            <div className="text-3xl font-black text-white mt-1">
              {analytics.totalVisitors.toLocaleString()}
            </div>
            <div className="text-[11px] text-naija-muted mt-2 flex items-center gap-3">
              <span>7d: <strong className="text-brand-400">{analytics.uniqueVisitors7d}</strong></span>
              <span>30d: <strong className="text-brand-400">{analytics.uniqueVisitors30d}</strong></span>
            </div>
          </Card>

          {/* Visitors Today */}
          <Card className="p-5 border-naija-border/80">
            <span className="text-xs font-semibold text-naija-muted uppercase tracking-wider">
              Visitors Today
            </span>
            <div className="text-3xl font-black text-emerald-400 mt-1">
              {analytics.uniqueVisitorsToday.toLocaleString()}
            </div>
            <div className="text-[11px] text-naija-muted mt-2">
              Since 12:00 AM (UTC)
            </div>
          </Card>

          {/* Total Page Views */}
          <Card className="p-5 border-naija-border/80">
            <span className="text-xs font-semibold text-naija-muted uppercase tracking-wider">
              Page Views
            </span>
            <div className="text-3xl font-black text-white mt-1">
              {analytics.totalPageViews.toLocaleString()}
            </div>
            <div className="text-[11px] text-naija-muted mt-2">
              Today: <strong className="text-brand-400">{analytics.pageViewsToday.toLocaleString()}</strong> views
            </div>
          </Card>

          {/* Device Breakdown */}
          <Card className="p-5 border-naija-border/80">
            <span className="text-xs font-semibold text-naija-muted uppercase tracking-wider">
              Device Breakdown
            </span>
            <div className="mt-2 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-300">📱 Mobile: {analytics.deviceBreakdown.mobilePct}%</span>
                <span className="text-gray-300">💻 Desktop: {analytics.deviceBreakdown.desktopPct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-naija-surface overflow-hidden flex">
                <div
                  className="bg-brand-500 h-full transition-all"
                  style={{ width: `${analytics.deviceBreakdown.mobilePct || 50}%` }}
                />
                <div
                  className="bg-teal-500 h-full transition-all"
                  style={{ width: `${analytics.deviceBreakdown.desktopPct || 50}%` }}
                />
              </div>
              <p className="text-[10px] text-naija-muted text-right">
                {analytics.deviceBreakdown.mobile + analytics.deviceBreakdown.desktop} total detected
              </p>
            </div>
          </Card>
        </div>

        {/* 7-Day Trend Chart & Top Pages Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Line Chart */}
          <Card className="lg:col-span-2 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">7-Day Visitor & View Trends</CardTitle>
                <CardDescription className="text-xs">Daily unique visitors and pageviews</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-brand-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-500" /> Visitors
                </span>
                <span className="flex items-center gap-1.5 text-teal-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-400" /> Page Views
                </span>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44 text-xs">
                {/* Background grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                  const y = chartHeight - paddingY - pct * usableHeight;
                  return (
                    <g key={i}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={chartWidth - paddingX}
                        y2={y}
                        stroke="#1c4028"
                        strokeDasharray="3 3"
                        strokeWidth="1"
                      />
                      <text x={paddingX - 6} y={y + 3} textAnchor="end" fill="#84a994" fontSize="9">
                        {Math.round(trendMax * pct)}
                      </text>
                    </g>
                  );
                })}

                {/* Pageviews Line */}
                <polyline
                  fill="none"
                  stroke="#2dd4bf"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={pointsPageViews}
                />

                {/* Visitors Line */}
                <polyline
                  fill="none"
                  stroke="#008751"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={pointsVisitors}
                />

                {/* Data Points */}
                {analytics.trends.map((t, idx) => {
                  const x = paddingX + (idx / (analytics.trends.length - 1)) * usableWidth;
                  const yV = chartHeight - paddingY - (t.visitors / trendMax) * usableHeight;
                  const yP = chartHeight - paddingY - (t.pageViews / trendMax) * usableHeight;
                  return (
                    <g key={idx}>
                      <circle cx={x} cy={yP} r="3" fill="#2dd4bf" />
                      <circle cx={x} cy={yV} r="3.5" fill="#008751" stroke="#ffffff" strokeWidth="1" />
                      <text
                        x={x}
                        y={chartHeight - 4}
                        textAnchor="middle"
                        fill="#84a994"
                        fontSize="9"
                      >
                        {t.label.split(',')[0]}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </Card>

          {/* Top Visited Pages & Games */}
          <Card className="p-6 space-y-4">
            <CardTitle className="text-base">Top Visited Pages & Boxes</CardTitle>
            <CardDescription className="text-xs">Most requested URLs across all sessions</CardDescription>

            <div className="space-y-2 pt-1">
              {analytics.mostVisitedPages.length === 0 ? (
                <p className="text-xs text-naija-muted py-6 text-center">No page visit records yet.</p>
              ) : (
                analytics.mostVisitedPages.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-naija-border/40 last:border-0">
                    <span className="font-mono text-gray-200 truncate max-w-[170px]" title={p.path}>
                      {p.path}
                    </span>
                    <span className="font-bold text-brand-400 px-2 py-0.5 rounded bg-brand-500/10">
                      {p.count.toLocaleString()} views
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. CONTENT OVERVIEW
         ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📦</span> Content Inventory
          </h2>
          <Link href="/admin/questions" className="text-xs text-brand-400 hover:text-brand-300 font-medium">
            Manage All Questions →
          </Link>
        </div>

        {/* Content KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 border-naija-border/80">
            <span className="text-xs text-naija-muted uppercase font-semibold">Total Experiences</span>
            <div className="text-2xl font-black text-white mt-1">
              {content.totalBoxes} <span className="text-xs font-normal text-naija-muted">boxes</span>
            </div>
            <p className="text-[11px] text-naija-muted mt-1">
              {content.totalGames} Games • {content.totalQuizzes} Quizzes • {content.totalTools} Tools
            </p>
          </Card>

          <Card className="p-4 border-naija-border/80">
            <span className="text-xs text-naija-muted uppercase font-semibold">Published Questions</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {content.questionsPublished}
            </div>
            <p className="text-[11px] text-naija-muted mt-1">
              Active in public rotation
            </p>
          </Card>

          <Card className="p-4 border-naija-border/80">
            <span className="text-xs text-naija-muted uppercase font-semibold">Pending Approval</span>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {content.questionsPending}
            </div>
            <p className="text-[11px] text-naija-muted mt-1">
              Awaiting review in queue
            </p>
          </Card>

          <Card className="p-4 border-naija-border/80">
            <span className="text-xs text-naija-muted uppercase font-semibold">Taxonomy Categories</span>
            <div className="text-2xl font-black text-white mt-1">
              {content.categoriesCount}
            </div>
            <p className="text-[11px] text-naija-muted mt-1">
              Active content groupings
            </p>
          </Card>
        </div>

        {/* Recently Added/Updated Questions Table */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Recently Updated Content</CardTitle>
              <CardDescription className="text-xs">Latest modifications in the question repository</CardDescription>
            </div>
            <Link href="/admin/questions" className="text-xs text-brand-400 hover:text-brand-300 font-medium">
              View All Questions ({content.questionsTotal}) →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-naija-muted border-b border-naija-border/40 pb-2">
                  <th className="pb-2 font-semibold">Question Text</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold">Author</th>
                  <th className="pb-2 text-right font-semibold">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-naija-border/20">
                {content.recentlyUpdatedQuestions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-naija-muted">
                      No question records found.
                    </td>
                  </tr>
                ) : (
                  content.recentlyUpdatedQuestions.map((q) => (
                    <tr key={q.id} className="hover:bg-naija-surface/30">
                      <td className="py-2.5 font-medium text-white max-w-md truncate pr-4">
                        {q.text}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase ${
                            q.status === 'published'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : q.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {q.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-naija-muted">{q.authorName || 'System'}</td>
                      <td className="py-2.5 text-right text-naija-muted">{q.updatedAt}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. ACTIVITY & MODERATION OVERVIEW
         ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>🛡️</span> Moderation & Live Activity
          </h2>
          <Link href="/admin/moderation" className="text-xs text-brand-400 hover:text-brand-300 font-medium">
            Open Full Queue →
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Submissions / Reports Preview */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  Pending UGC Submissions
                  {activity.pendingSubmissionsCount > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                      {activity.pendingSubmissionsCount} Pending
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="text-xs">Community questions awaiting approval</CardDescription>
              </div>
              <Link href="/admin/moderation" className="text-xs text-amber-400 hover:underline">
                Review Queue →
              </Link>
            </div>

            <div className="space-y-2">
              {activity.recentSubmissions.length === 0 ? (
                <p className="text-xs text-naija-muted py-8 text-center">
                  ✅ Moderation queue is clear. No pending submissions.
                </p>
              ) : (
                activity.recentSubmissions.map((s) => (
                  <div key={s.id} className="p-3 rounded-xl bg-naija-surface border border-naija-border/60 flex items-center justify-between gap-3 text-xs">
                    <div className="truncate">
                      <p className="text-white font-medium truncate">{s.text}</p>
                      <span className="text-[11px] text-naija-muted">By {s.authorName || 'Anonymous'} • {s.createdAt}</span>
                    </div>
                    <Link
                      href="/admin/moderation"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium shrink-0"
                    >
                      Review
                    </Link>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Live System Interaction Stream */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Activity Stream
                </CardTitle>
                <CardDescription className="text-xs">Latest events recorded from user sessions</CardDescription>
              </div>
              <span className="text-[10px] text-naija-muted font-mono">Real-time</span>
            </div>

            <div className="space-y-2">
              {activity.liveEventsStream.length === 0 ? (
                <p className="text-xs text-naija-muted py-8 text-center">
                  Waiting for first public event...
                </p>
              ) : (
                activity.liveEventsStream.map((ev) => (
                  <div key={ev.id} className="p-2.5 rounded-lg bg-naija-surface/80 border border-naija-border/40 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-brand-400 uppercase text-[10px] px-1.5 py-0.5 rounded bg-brand-500/10">
                        {ev.name}
                      </span>
                      <span className="text-gray-300 truncate font-mono text-[11px]">
                        {ev.path || '/'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-naija-muted text-[10px]">
                      <span>{ev.deviceClass || 'web'}</span>
                      <span>•</span>
                      <span>{ev.createdAt}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. DASHBOARD PREVIEWS & NAVIGATION CARDS
         ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span>⚡</span> Quick Management Tools
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Questions Pool */}
          <Link href="/admin/questions" className="group">
            <Card interactive className="h-full border-naija-border/80 group-hover:border-brand-500/40 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Questions Repository</CardTitle>
                  <span className="text-xs font-mono text-brand-400 font-bold">{content.questionsTotal} Qs</span>
                </div>
                <CardDescription className="text-xs">
                  Create, edit, reorder, and tag questions across all quizzes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-xs text-brand-400 font-semibold group-hover:underline">
                  Open Question Manager →
                </span>
              </CardContent>
            </Card>
          </Link>

          {/* Moderation Queue */}
          <Link href="/admin/moderation" className="group">
            <Card interactive className="h-full border-naija-border/80 group-hover:border-amber-500/40 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Moderation Queue</CardTitle>
                  <span className="text-xs font-mono text-amber-400 font-bold">
                    {activity.pendingSubmissionsCount} Pending
                  </span>
                </div>
                <CardDescription className="text-xs">
                  Approve community submissions and investigate user reports.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-xs text-amber-400 font-semibold group-hover:underline">
                  Review Queue ({activity.pendingSubmissionsCount + activity.openReportsCount}) →
                </span>
              </CardContent>
            </Card>
          </Link>

          {/* Content Health */}
          <Link href="/admin/content-health" className="group">
            <Card interactive className="h-full border-naija-border/80 group-hover:border-rose-500/40 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Content Health</CardTitle>
                  <span className="text-xs font-mono text-emerald-400 font-bold">Auditor</span>
                </div>
                <CardDescription className="text-xs">
                  Detect stale items, dead ends, and question repetition issues.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-xs text-rose-400 font-semibold group-hover:underline">
                  Run Health Checks →
                </span>
              </CardContent>
            </Card>
          </Link>

          {/* Sponsors & Ads */}
          <Link href="/admin/sponsors" className="group">
            <Card interactive className="h-full border-naija-border/80 group-hover:border-purple-500/40 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Sponsors & Ads</CardTitle>
                  <span className="text-xs font-mono text-purple-400 font-bold">
                    {sponsors.activeSponsorsCount} Active
                  </span>
                </div>
                <CardDescription className="text-xs">
                  Configure paid placements and native sponsorship banners.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-xs text-purple-400 font-semibold group-hover:underline">
                  Manage Placements →
                </span>
              </CardContent>
            </Card>
          </Link>

          {/* Deep Analytics */}
          <Link href="/admin/analytics" className="group">
            <Card interactive className="h-full border-naija-border/80 group-hover:border-teal-500/40 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Deep Analytics</CardTitle>
                  <span className="text-xs font-mono text-teal-400 font-bold">Funnels</span>
                </div>
                <CardDescription className="text-xs">
                  Explore drop-off rates, viral share clicks, and traffic referrers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-xs text-teal-400 font-semibold group-hover:underline">
                  View Analytics →
                </span>
              </CardContent>
            </Card>
          </Link>

          {/* System Settings */}
          <Link href="/admin/settings" className="group">
            <Card interactive className="h-full border-naija-border/80 group-hover:border-blue-500/40 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">System Settings</CardTitle>
                  <span className="text-xs font-mono text-blue-400 font-bold">Config</span>
                </div>
                <CardDescription className="text-xs">
                  Randomization modes, pool limits, and categories taxonomy.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-xs text-blue-400 font-semibold group-hover:underline">
                  Configure System →
                </span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  );
}
