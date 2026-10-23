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
    const [result] = await db
      .select({
        label: schema.results.label,
        displayText: schema.results.displayText,
        score: schema.results.score,
      })
      .from(schema.results)
      .where(eq(schema.results.id, id))
      .limit(1);

    const label = result?.label || 'NaijaBox Result';
    const desc = result?.displayText || 'Check out my result on NaijaBox!';

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
              color: '#9CA3AF',
              marginBottom: 12,
            }}
          >
            I GOT
          </div>

          <div
            style={{
              fontSize: 54,
              fontWeight: 900,
              color: '#FFFFFF',
              lineHeight: 1.2,
              maxWidth: 900,
              marginBottom: 20,
            }}
          >
            &quot;{label}&quot;
          </div>

          <div
            style={{
              fontSize: 24,
              color: '#D1D5DB',
              maxWidth: 800,
              marginBottom: 40,
            }}
          >
            {desc}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: 18,
              color: '#008751',
              fontWeight: 700,
              backgroundColor: 'rgba(0, 135, 81, 0.15)',
              padding: '10px 24px',
              borderRadius: 30,
              border: '1px solid rgba(0, 135, 81, 0.3)',
            }}
          >
            Can you beat this? Open the box &rarr;
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (err) {
    console.error('OG image generation error:', err);
    return new Response('Failed to generate image', { status: 500 });
  }
}
