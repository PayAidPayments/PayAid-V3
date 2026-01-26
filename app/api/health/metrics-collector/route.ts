import { NextRequest, NextResponse } from 'next/server'
import { metricsCollector } from '@/lib/monitoring/metrics-collector'

/**
 * Metrics collector endpoint
 * GET /api/health/metrics-collector?timeWindow=3600000
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeWindow = searchParams.get('timeWindow')
      ? parseInt(searchParams.get('timeWindow')!, 10)
      : undefined

    const summary = metricsCollector.getSummary(timeWindow)
    return NextResponse.json(summary)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}
