/**
 * P&L Trend API Endpoint
 * GET /api/v1/financials/p-and-l/trend/[fiscalYear]
 * 
 * Get P&L trend across all months of fiscal year
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { PLComputationService } from '@/lib/services/financial/pl-computation'

export async function GET(
  request: NextRequest,
  { params }: { params: { fiscalYear: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const fiscalYear = parseInt(params.fiscalYear)
    if (isNaN(fiscalYear)) {
      return NextResponse.json(
        { error: 'Invalid fiscal year' },
        { status: 400 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const currency = searchParams.get('currency') || 'INR'

    const service = new PLComputationService(tenantId)
    const trendData = await service.getPLTrend(fiscalYear, currency)

    return NextResponse.json(trendData)
  } catch (error: any) {
    console.error('P&L Trend API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch P&L trend' },
      { status: 500 }
    )
  }
}
