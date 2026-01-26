/**
 * Cash Flow Forecast API Endpoint
 * GET /api/v1/financials/cash-flow/forecast
 * 
 * Get cash flow forecast
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { CashFlowAnalysisService } from '@/lib/services/financial/cash-flow-analysis'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30')

    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'days must be between 1 and 365' },
        { status: 400 }
      )
    }

    const service = new CashFlowAnalysisService(tenantId)
    const forecast = await service.forecastCashFlow(days)

    return NextResponse.json(forecast)
  } catch (error: any) {
    console.error('Cash Flow Forecast API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch cash flow forecast' },
      { status: 500 }
    )
  }
}
