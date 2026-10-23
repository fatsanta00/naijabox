import { NextRequest, NextResponse } from 'next/server';
import { QuestionService } from '@/server/services/questionService';
import { SESSION_COOKIE_NAME } from '@/middleware';
import { z } from 'zod';

const querySchema = z.object({
  experience: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  count: z.coerce.number().int().min(1).max(50).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      experience: searchParams.get('experience'),
      difficulty: searchParams.get('difficulty') || undefined,
      count: searchParams.get('count') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
    }

    const sessionId = req.cookies.get(SESSION_COOKIE_NAME)?.value;

    const questions = await QuestionService.getSessionSet(parsed.data.experience, {
      sessionId,
      difficulty: parsed.data.difficulty,
      count: parsed.data.count,
    });

    return NextResponse.json({
      success: true,
      data: questions,
      count: questions.length,
    });
  } catch (err) {
    console.error('Error fetching questions:', err);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}
