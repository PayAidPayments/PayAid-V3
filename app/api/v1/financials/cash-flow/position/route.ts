/**
 * Cash Position API Endpoint
 * GET /api/v1/financials/cash-flow/position
 * 
 * Get current cash position
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { CashFlowAnalysisService } from '@/lib/services/financial/cash-flow-analysis'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const service = new CashFlowAnalysisService(tenantId)
    const position = await service.getCurrentCashPosition()

    return NextResponse.json(position)
  } catch (error: any) {
    console.error('Cash Position API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch cash position' },
      { status: 500 }
    )
  }
}
