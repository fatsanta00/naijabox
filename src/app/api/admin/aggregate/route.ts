import { NextRequest, NextResponse } from 'next/server';
import { runAggregationJob } from '@/server/services/aggregationService';

/**
 * POST /api/admin/aggregate
 * Manually trigger or schedule the aggregation job
 */
export async function POST(_req: NextRequest) {
  try {
    const result = await runAggregationJob();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Aggregation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
