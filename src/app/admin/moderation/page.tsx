import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';

export default async function AdminModerationPage() {
  const pending = await db
    .select()
    .from(schema.questions)
    .where(eq(schema.questions.status, 'pending'))
    .orderBy(desc(schema.questions.createdAt));

  const reports = await db
    .select()
    .from(schema.questionReports)
    .where(eq(schema.questionReports.status, 'open'))
    .orderBy(desc(schema.questionReports.createdAt));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Moderation Queue</h1>
        <p className="text-sm text-naija-muted mt-1">
          Review user-submitted questions and community report flags. Submissions are invisible publicly until approved.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Submissions */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Pending Submissions
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
              {pending.length}
            </span>
          </h2>

          {pending.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-naija-muted text-sm">
                Queue is clear. No pending community submissions at this time.
              </CardContent>
            </Card>
          ) : (
            pending.map((q) => (
              <Card key={q.id} className="border-amber-500/30">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base text-white">{q.text}</CardTitle>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 uppercase font-mono">
                      {q.status}
                    </span>
                  </div>
                  <CardDescription>
                    Submitted by: {q.authorName || 'Anonymous'} {q.showAttribution && '(Attribution Requested)'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-2.5 rounded-lg bg-naija-surface text-xs text-gray-300 font-mono overflow-x-auto">
                    {JSON.stringify(q.options, null, 2)}
                  </div>
                  {q.explanation && (
                    <p className="text-xs text-naija-muted italic">Context: {q.explanation}</p>
                  )}
                  <div className="flex items-center space-x-2 pt-2 border-t border-naija-border/60">
                    <form
                      action={async () => {
                        'use server';
                        await db
                          .update(schema.questions)
                          .set({ status: 'published', publishedAt: new Date(), updatedAt: new Date() })
                          .where(eq(schema.questions.id, q.id));
                      }}
                    >
                      <button
                        type="submit"
                        className="h-9 min-h-[36px] px-3 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        Approve
                      </button>
                    </form>
                    <form
                      action={async () => {
                        'use server';
                        await db
                          .update(schema.questions)
                          .set({ status: 'rejected', updatedAt: new Date() })
                          .where(eq(schema.questions.id, q.id));
                      }}
                    >
                      <button
                        type="submit"
                        className="h-9 min-h-[36px] px-3 text-xs font-semibold rounded-lg bg-naija-card hover:bg-naija-border text-gray-300 border border-naija-border"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Question Reports */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Open Reports
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono">
              {reports.length}
            </span>
          </h2>

          {reports.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-naija-muted text-sm">
                No open community reports.
              </CardContent>
            </Card>
          ) : (
            reports.map((r) => (
              <Card key={r.id} className="border-rose-500/30">
                <CardHeader className="pb-1">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-semibold capitalize text-rose-300">
                      {r.reason}
                    </CardTitle>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
                      {r.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="text-xs text-naija-muted space-y-2">
                  {r.note && <p className="italic text-gray-300">&quot;{r.note}&quot;</p>}
                  <p className="text-[11px] text-gray-400">Question ID: {r.questionId}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
