/**
 * Working Capital API Endpoint
 * GET /api/v1/financials/cash-flow/working-capital
 * 
 * Get working capital analysis
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { CashFlowAnalysisService } from '@/lib/services/financial/cash-flow-analysis'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const service = new CashFlowAnalysisService(tenantId)
    const workingCapital = await service.getWorkingCapital()

    return NextResponse.json(workingCapital)
  } catch (error: any) {
    console.error('Working Capital API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch working capital' },
      { status: 500 }
    )
  }
}
