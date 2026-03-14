/**
 * Alert Logs API Endpoint
 * GET /api/v1/financials/alerts/logs
 * 
 * Get alert logs
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { FinancialAlertSystem } from '@/lib/services/financial/alert-system'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const searchParams = request.nextUrl.searchParams
    const alertId = searchParams.get('alert_id') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')

    const alertSystem = new FinancialAlertSystem(tenantId)
    const logs = await alertSystem.getAlertLogs(alertId, limit)

    return NextResponse.json({ logs })
  } catch (error: any) {
    console.error('Alert Logs API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch alert logs' },
      { status: 500 }
    )
  }
}
