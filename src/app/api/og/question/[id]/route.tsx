import { ImageResponse } from 'next/og';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [q] = await db
      .select({
        text: schema.questions.text,
      })
      .from(schema.questions)
      .where(eq(schema.questions.id, id))
      .limit(1);

    const questionText = q?.text || 'Would you rather?';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0D1117',
            color: '#FFFFFF',
            fontFamily: 'sans-serif',
            padding: '40px 60px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: 28,
              fontWeight: 900,
              color: '#008751',
              marginBottom: 24,
            }}
          >
            Naija<span style={{ color: '#FFFFFF' }}>Box</span>
          </div>

          <div
            style={{
              fontSize: 20,
              textTransform: 'uppercase',
              letterSpacing: 2,
              color: '#F59E0B',
              marginBottom: 16,
              fontWeight: 700,
            }}
          >
            QUESTION OF THE DAY
          </div>

          <div
            style={{
              fontSize: 46,
              fontWeight: 800,
              color: '#FFFFFF',
              lineHeight: 1.3,
              maxWidth: 900,
              marginBottom: 36,
            }}
          >
            &quot;{questionText}&quot;
          </div>

          <div
            style={{
              fontSize: 20,
              color: '#9CA3AF',
            }}
          >
            Vote now on NaijaBox &rarr;
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (err) {
    console.error('Question OG image generation error:', err);
    return new Response('Failed to generate image', { status: 500 });
  }
}
