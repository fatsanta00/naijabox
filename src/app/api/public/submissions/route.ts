import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { SESSION_COOKIE_NAME } from '@/middleware';
import { eq, and, gte } from 'drizzle-orm';
import { z } from 'zod';

const submissionSchema = z.object({
  experience_key: z.string().min(1),
  text: z.string().min(5).max(500),
  category_id: z.string().uuid().nullable().optional(),
  options: z.record(z.unknown()).or(z.array(z.unknown())),
  correct: z.array(z.string()).nullable().optional(),
  explanation: z.string().max(500).nullable().optional(),
  author_name: z.string().max(64).nullable().optional(),
  show_attribution: z.boolean().default(false),
  // Honeypot field (ADR-014) - must be empty
  website: z.string().max(0, 'Spam detected').optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = submissionSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid submission data', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      experience_key,
      text,
      category_id,
      options,
      correct,
      explanation,
      author_name,
      show_attribution,
      website,
    } = parsed.data;

    // Honeypot check (ADR-014)
    if (website && website.length > 0) {
      // Silently discard or 400
      return NextResponse.json({ error: 'Spam detected' }, { status: 400 });
    }

    const sessionId = req.cookies.get(SESSION_COOKIE_NAME)?.value || 'anon_session';

    // Rate limit check: max 5 submissions per session per hour (ADR-014)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentSubmissions = await db
      .select({ id: schema.questions.id })
      .from(schema.questions)
      .where(
        and(
          eq(schema.questions.submittedBySession, sessionId),
          gte(schema.questions.createdAt, oneHourAgo)
        )
      );

    if (recentSubmissions.length >= 5) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a bit before submitting another question.' },
        { status: 429 }
      );
    }

    // Lookup experience ID
    const [exp] = await db
      .select({ id: schema.experiences.id })
      .from(schema.experiences)
      .where(eq(schema.experiences.key, experience_key))
      .limit(1);

    if (!exp) {
      return NextResponse.json({ error: 'Invalid experience specified' }, { status: 400 });
    }

    // Insert with status = 'pending', source = 'community'
    // HARD RULE: User submissions are NEVER public until approved.
    const [inserted] = await db
      .insert(schema.questions)
      .values({
        experienceId: exp.id,
        text,
        categoryId: category_id,
        options,
        correct,
        explanation,
        status: 'pending',
        source: 'community',
        authorName: author_name || null,
        showAttribution: show_attribution,
        submittedBySession: sessionId,
      })
      .returning();

    return NextResponse.json({
      success: true,
      id: inserted.id,
      message: "Thanks! It'll show up once it's reviewed.",
    });
  } catch (err) {
    console.error('Submission pipeline error:', err);
    return NextResponse.json({ error: 'Failed to submit question' }, { status: 500 });
  }
}
