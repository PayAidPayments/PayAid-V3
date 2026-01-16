/**
 * System Alerts Endpoint
 * 
 * GET /api/system/alerts
 * Returns active alerts based on current metrics
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDashboardMetrics } from '@/lib/monitoring/dashboard'
import { checkAlerts } from '@/lib/monitoring/alerts'

export async function GET(request: NextRequest) {
  try {
    const metrics = await getDashboardMetrics()
    const alerts = checkAlerts(metrics)

    return NextResponse.json({
      alerts,
      count: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[Alerts] Error checking alerts:', error)
    return NextResponse.json(
      {
        error: 'Failed to check alerts',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
