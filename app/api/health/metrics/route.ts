import { NextRequest, NextResponse } from 'next/server'
import { HealthCheckService } from '@/lib/monitoring/health-check'

/**
 * Metrics endpoint
 * GET /api/health/metrics
 */
export async function GET(request: NextRequest) {
  try {
    const metrics = await HealthCheckService.getMetrics()
    return NextResponse.json(metrics)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}
