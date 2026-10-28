import { NextRequest, NextResponse } from 'next/server';
import { SlangService } from '@/server/services/slangService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ term: string }> }
) {
  try {
    const { term } = await params;
    const slang = await SlangService.getTermBySlug(term);

    if (!slang) {
      return NextResponse.json({ error: 'Slang term not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: slang,
    });
  } catch (err) {
    console.error('Error fetching slang term:', err);
    return NextResponse.json({ error: 'Failed to fetch slang term' }, { status: 500 });
  }
}
