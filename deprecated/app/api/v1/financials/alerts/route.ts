/**
 * Financial Alerts API Endpoint
 * GET /api/v1/financials/alerts - Get all alerts
 * POST /api/v1/financials/alerts - Create new alert
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { FinancialAlertSystem } from '@/lib/services/financial/alert-system'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const searchParams = request.nextUrl.searchParams
    const includeInactive = searchParams.get('include_inactive') === 'true'

    const alertSystem = new FinancialAlertSystem(tenantId)
    const alerts = await alertSystem.getAlerts(includeInactive)

    return NextResponse.json({ alerts })
  } catch (error: any) {
    console.error('Alerts API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const body = await request.json()

    const alertSystem = new FinancialAlertSystem(tenantId)
    const result = await alertSystem.createAlert({
      alertName: body.alertName,
      alertType: body.alertType,
      conditionType: body.conditionType,
      conditionValue: body.conditionValue,
      conditionOperator: body.conditionOperator,
      appliesToAccountId: body.appliesToAccountId,
      appliesToAccountGroup: body.appliesToAccountGroup,
      notifyEmails: body.notifyEmails,
      notifySlack: body.notifySlack,
      notifyInApp: body.notifyInApp,
      triggerWorkflow: body.triggerWorkflow,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Create Alert API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create alert' },
      { status: 500 }
    )
  }
}
