/**
 * Anomaly Detection API Endpoint
 * GET /api/v1/financials/variance/anomalies/[accountId]
 * 
 * Detect statistical anomalies for an account
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { VarianceDetectionService } from '@/lib/services/financial/variance-detection'

export async function GET(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const searchParams = request.nextUrl.searchParams
    const monthsLookback = parseInt(searchParams.get('months') || '12')

    const service = new VarianceDetectionService(tenantId)
    const anomalies = await service.detectAnomalies(params.accountId, monthsLookback)

    return NextResponse.json(anomalies)
  } catch (error: any) {
    console.error('Anomaly Detection API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to detect anomalies' },
      { status: 500 }
    )
  }
}
