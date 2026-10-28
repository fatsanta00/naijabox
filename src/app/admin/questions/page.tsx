import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { desc } from 'drizzle-orm';
import { QuestionManagerClient, QuestionRow, ExperienceItem } from './QuestionManagerClient';

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
    .limit(200);

  const allExperiences = await db.select().from(schema.experiences);

  const formattedQuestions: QuestionRow[] = allQuestions.map((q) => ({
    id: q.id,
    text: q.text,
    status: q.status,
    difficulty: q.difficulty,
    source: q.source,
    experienceId: q.experienceId,
    createdAt: q.createdAt.toISOString(),
  }));

  const formattedExperiences: ExperienceItem[] = allExperiences.map((e) => ({
    id: e.id,
    title: e.title,
    slug: e.key,
  }));

  return (
    <QuestionManagerClient
      initialQuestions={formattedQuestions}
      experiences={formattedExperiences}
    />
  );
}
