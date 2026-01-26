/**
 * Acknowledge Alert API Endpoint
 * POST /api/v1/financials/alerts/logs/[logId]/acknowledge
 * 
 * Acknowledge an alert
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { FinancialAlertSystem } from '@/lib/services/financial/alert-system'

export async function POST(
  request: NextRequest,
  { params }: { params: { logId: string } }
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'finance')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      )
    }

    const alertSystem = new FinancialAlertSystem(tenantId)
    await alertSystem.acknowledgeAlert(params.logId, userId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Acknowledge Alert API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to acknowledge alert' },
      { status: 500 }
    )
  }
}
