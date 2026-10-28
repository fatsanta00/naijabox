import { ImageResponse } from 'next/og';
import { getBoxBySlug } from '@/boxes/registry';

export const runtime = 'edge';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const box = getBoxBySlug(slug);

    const title = box?.title || 'NaijaBox';
    const tagline = box?.tagline || 'A box full of things to do';
    const badge = box?.badge || '📦';

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
          position: 'relative',
        }}
      >
        {/* Brand top */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            display: 'flex',
            alignItems: 'center',
            fontSize: 28,
            fontWeight: 900,
            color: '#008751',
            letterSpacing: '-0.02em',
          }}
        >
          Naija<span style={{ color: '#FFFFFF' }}>Box</span>
        </div>

        {/* Icon / Badge */}
        <div
          style={{
            fontSize: 72,
            marginBottom: 20,
            display: 'flex',
          }}
        >
          {badge}
        </div>

        {/* Box Title */}
        <div
          style={{
            fontSize: 54,
            fontWeight: 900,
            color: '#FFFFFF',
            lineHeight: 1.15,
            marginBottom: 16,
            maxWidth: 960,
          }}
        >
          {title}
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 24,
            color: '#9CA3AF',
            maxWidth: 820,
            lineHeight: 1.4,
          }}
        >
          {tagline}
        </div>

        {/* Footer tag */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 18,
            color: '#6B7280',
          }}
        >
          <span>naijabox.app</span>
          <span>•</span>
          <span>No login needed</span>
          <span>•</span>
          <span>Play instantly</span>
        </div>
      </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (err) {
    console.error('Error generating box OG image:', err);
    return new Response('Failed to generate image', { status: 500 });
  }
}
