/**
 * Check Alerts API Endpoint
 * POST /api/v1/financials/alerts/check
 * 
 * Manually trigger alert check
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { FinancialAlertSystem } from '@/lib/services/financial/alert-system'

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const alertSystem = new FinancialAlertSystem(tenantId)
    const triggeredAlerts = await alertSystem.checkAllAlerts()

    return NextResponse.json({
      triggered_count: triggeredAlerts.length,
      triggered_alerts: triggeredAlerts,
    })
  } catch (error: any) {
    console.error('Check Alerts API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check alerts' },
      { status: 500 }
    )
  }
}
