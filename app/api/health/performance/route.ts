import { NextRequest, NextResponse } from 'next/server'
import { performanceTracker } from '@/lib/performance/performance-tracker'

/**
 * Performance metrics endpoint
 * GET /api/health/performance
 */
export async function GET(request: NextRequest) {
  try {
    const summary = performanceTracker.getSummary()
    return NextResponse.json(summary)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    )
  }
}
