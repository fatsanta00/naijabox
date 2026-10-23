import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { desc } from 'drizzle-orm';
import Link from 'next/link';
import { Card } from '@/components/ui';

export default async function AdminQuestionsPage() {
  const allQuestions = await db
    .select({
      id: schema.questions.id,
      text: schema.questions.text,
      status: schema.questions.status,
      difficulty: schema.questions.difficulty,
      source: schema.questions.source,
      experienceId: schema.questions.experienceId,
      createdAt: schema.questions.createdAt,
    })
    .from(schema.questions)
    .orderBy(desc(schema.questions.createdAt))
    .limit(100);

  const allExperiences = await db.select().from(schema.experiences);
  const expMap = new Map(allExperiences.map((e) => [e.id, e.title]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Questions Manager</h1>
          <p className="text-sm text-naija-muted mt-1">
            Create, edit, reorder, publish or unpublish question content. Zero redeploy required.
          </p>
        </div>
        <Link
          href="/admin/questions/new"
          className="h-11 min-h-[44px] px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium inline-flex items-center text-sm shadow-md"
        >
          + Add New Question
        </Link>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-naija-surface/80 border-b border-naija-border text-xs uppercase text-naija-muted">
            <tr>
              <th className="py-3 px-4">Question Text</th>
              <th className="py-3 px-4">Experience</th>
              <th className="py-3 px-4">Difficulty</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Source</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-naija-border/60">
            {allQuestions.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-naija-muted">
                  No questions found. Seed data or add a new question to get started.
                </td>
              </tr>
            ) : (
              allQuestions.map((q) => (
                <tr key={q.id} className="hover:bg-naija-surface/40 transition-colors">
                  <td className="py-3 px-4 font-medium text-white max-w-xs truncate">{q.text}</td>
                  <td className="py-3 px-4 text-gray-300">{expMap.get(q.experienceId) || 'Unknown'}</td>
                  <td className="py-3 px-4">
                    <span className="capitalize text-xs text-naija-muted">{q.difficulty || '—'}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                        q.status === 'published'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : q.status === 'pending'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-naija-card text-gray-400 border border-naija-border'
                      }`}
                    >
                      {q.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-naija-muted">{q.source}</td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/admin/questions/${q.id}`}
                      className="text-brand-400 hover:text-brand-300 font-medium text-xs px-2 py-1"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
