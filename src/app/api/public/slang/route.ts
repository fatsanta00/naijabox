import { NextResponse } from 'next/server';
import { SlangService } from '@/server/services/slangService';

export async function GET() {
  try {
    const terms = await SlangService.getAllTerms();
    return NextResponse.json({
      success: true,
      count: terms.length,
      data: terms,
    });
  } catch (err) {
    console.error('Error fetching slang terms:', err);
    return NextResponse.json({ error: 'Failed to fetch slang dictionary' }, { status: 500 });
  }
}
