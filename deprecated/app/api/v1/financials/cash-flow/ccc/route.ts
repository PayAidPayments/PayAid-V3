/**
 * Cash Conversion Cycle API Endpoint
 * GET /api/v1/financials/cash-flow/ccc
 * 
 * Get cash conversion cycle
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { CashFlowAnalysisService } from '@/lib/services/financial/cash-flow-analysis'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const service = new CashFlowAnalysisService(tenantId)
    const ccc = await service.getCashConversionCycle()

    return NextResponse.json(ccc)
  } catch (error: any) {
    console.error('CCC API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch cash conversion cycle' },
      { status: 500 }
    )
  }
}
