/**
 * System Metrics Endpoint
 * 
 * GET /api/system/metrics
 * Returns comprehensive system metrics for monitoring dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDashboardMetrics } from '@/lib/monitoring/dashboard'

export async function GET(request: NextRequest) {
  try {
    const metrics = await getDashboardMetrics()

    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error: any) {
    console.error('[Metrics] Error fetching metrics:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch metrics',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
