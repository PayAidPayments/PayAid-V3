/**
 * Financial Dashboard API
 * GET /api/v1/financials/dashboard
 * 
 * Returns complete financial dashboard snapshot
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { PLComputationService } from '@/lib/services/financial/pl-computation'
import { CashFlowAnalysisService } from '@/lib/services/financial/cash-flow-analysis'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const plService = new PLComputationService(tenantId)
    const cfService = new CashFlowAnalysisService(tenantId)

    // Get current month period
    const today = new Date()
    const periodStart = new Date(today.getFullYear(), today.getMonth(), 1)

    // Get P&L for current month
    const pAndL = await plService.getPLSummary(periodStart, today)

    // Get cash position
    const cashPosition = await cfService.getCurrentCashPosition()

    // Get cash flow forecast
    const cashFlowForecast = await cfService.forecastCashFlow(30)

    return NextResponse.json({
      p_and_l: pAndL,
      cash_position: cashPosition,
      cash_flow_forecast: cashFlowForecast,
      generated_at: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Financial dashboard error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch financial dashboard' },
      { status: 500 }
    )
  }
}
