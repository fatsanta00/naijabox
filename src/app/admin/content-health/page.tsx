import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getAllBoxes } from '@/boxes/registry';
import { Card } from '@/components/ui';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ContentHealthPage() {
  const allBoxes = getAllBoxes();
  const allExperiences = await db.select().from(schema.experiences);
  const expMap = new Map(allExperiences.map((e) => [e.key, e]));

  // Query published counts grouped by experienceId
  const counts = await db
    .select({
      experienceId: schema.questions.experienceId,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.questions)
    .where(eq(schema.questions.status, 'published'))
    .groupBy(schema.questions.experienceId);

  const countMap = new Map(counts.map((c) => [c.experienceId, c.count]));

  const reports = allBoxes.map((box) => {
    const dbExp = expMap.get(box.slug);
    const publishedCount = dbExp ? countMap.get(dbExp.id) || 0 : 0;
    const minRecommended = 10;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (!box.usesQuestionSystem) {
      status = 'healthy';
    } else if (publishedCount < 5) {
      status = 'critical';
    } else if (publishedCount < minRecommended) {
      status = 'warning';
    }

    return {
      title: box.title,
      slug: box.slug,
      badge: box.badge || '📦',
      experienceId: dbExp?.id,
      usesQuestionSystem: box.usesQuestionSystem,
      publishedCount,
      minRecommended: box.usesQuestionSystem ? minRecommended : 0,
      status,
    };
  });

  const questionBoxes = reports.filter((r) => r.usesQuestionSystem);
  const criticalCount = questionBoxes.filter((r) => r.status === 'critical').length;
  const warningCount = questionBoxes.filter((r) => r.status === 'warning').length;
  const healthyCount = questionBoxes.filter((r) => r.status === 'healthy').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Content Health Panel</h1>
        <p className="text-sm text-naija-muted mt-1">
          Monitor active question pools across experiences. Boxes below minimum pools risk repeating questions to players.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border-emerald-500/30 bg-emerald-950/20">
          <div className="text-xs uppercase font-bold tracking-wider text-emerald-400">
            Healthy Boxes (≥10 Questions)
          </div>
          <div className="text-3xl font-black text-white mt-2">{healthyCount}</div>
          <p className="text-xs text-emerald-300/80 mt-1">Sufficient variety for full sessions</p>
        </Card>

        <Card className="p-5 border-amber-500/30 bg-amber-950/20">
          <div className="text-xs uppercase font-bold tracking-wider text-amber-400">
            Warning Pool (5–9 Questions)
          </div>
          <div className="text-3xl font-black text-white mt-2">{warningCount}</div>
          <p className="text-xs text-amber-300/80 mt-1">May exhaust pool quickly on replays</p>
        </Card>

        <Card className="p-5 border-rose-500/30 bg-rose-950/20">
          <div className="text-xs uppercase font-bold tracking-wider text-rose-400">
            Critical Pool (&lt;5 Questions)
          </div>
          <div className="text-3xl font-black text-white mt-2">{criticalCount}</div>
          <p className="text-xs text-rose-300/80 mt-1">Below minimum viable pool size</p>
        </Card>
      </div>

      {/* Table of all boxes */}
      <Card className="p-0 overflow-x-auto border-naija-border/80">
        <table className="w-full text-left text-sm">
          <thead className="bg-naija-surface/90 border-b border-naija-border text-xs uppercase text-naija-muted">
            <tr>
              <th className="py-3 px-4">Box Experience</th>
              <th className="py-3 px-4">Content Type</th>
              <th className="py-3 px-4">Published Count</th>
              <th className="py-3 px-4">Min. Target</th>
              <th className="py-3 px-4">Health Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-naija-border/60">
            {reports.map((item) => (
              <tr key={item.slug} className="hover:bg-naija-surface/40 transition-colors">
                <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                  <span className="text-xl">{item.badge}</span>
                  <div>
                    <div>{item.title}</div>
                    <div className="text-xs text-naija-muted font-normal font-mono">/boxes/{item.slug}</div>
                  </div>
                </td>
                <td className="py-3 px-4 text-xs text-gray-300">
                  {item.usesQuestionSystem ? 'Dynamic Question Pool' : 'Standalone / Algorithmic'}
                </td>
                <td className="py-3 px-4 font-bold text-white text-base">
                  {item.usesQuestionSystem ? item.publishedCount : 'N/A'}
                </td>
                <td className="py-3 px-4 text-xs text-naija-muted">
                  {item.usesQuestionSystem ? `${item.minRecommended} questions` : '—'}
                </td>
                <td className="py-3 px-4">
                  {!item.usesQuestionSystem ? (
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-800 text-gray-300 border border-gray-700">
                      Standalone
                    </span>
                  ) : item.status === 'healthy' ? (
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      ✓ Healthy ({item.publishedCount})
                    </span>
                  ) : item.status === 'warning' ? (
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      ⚠️ Warning ({item.publishedCount}/{item.minRecommended})
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30">
                      🚨 Critical ({item.publishedCount})
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  {item.usesQuestionSystem ? (
                    <Link
                      href={`/admin/questions?experience_id=${item.experienceId || ''}`}
                      className="text-brand-400 hover:text-brand-300 text-xs font-semibold px-2 py-1"
                    >
                      Manage Questions →
                    </Link>
                  ) : (
                    <span className="text-xs text-naija-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
