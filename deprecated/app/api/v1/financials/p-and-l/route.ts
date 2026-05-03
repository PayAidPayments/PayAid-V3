/**
 * P&L API Endpoint
 * GET /api/v1/financials/p-and-l
 * 
 * Get Profit & Loss statement for date range
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { PLComputationService } from '@/lib/services/financial/pl-computation'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const currency = searchParams.get('currency') || 'INR'

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'start_date and end_date are required' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    const service = new PLComputationService(tenantId)
    const plData = await service.getPLSummary(start, end, currency)

    return NextResponse.json(plData)
  } catch (error: any) {
    console.error('P&L API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch P&L data' },
      { status: 500 }
    )
  }
}
