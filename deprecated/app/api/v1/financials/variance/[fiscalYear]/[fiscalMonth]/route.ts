/**
 * Variance Analysis API Endpoint
 * GET /api/v1/financials/variance/[fiscalYear]/[fiscalMonth]
 * 
 * Get variance analysis for period
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { VarianceDetectionService } from '@/lib/services/financial/variance-detection'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fiscalYear: string; fiscalMonth: string }> | { fiscalYear: string; fiscalMonth: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')

    // Handle both Promise and direct params (Next.js 15 vs 14)
    const resolvedParams = params instanceof Promise ? await params : params
    const fiscalYear = parseInt(resolvedParams.fiscalYear)
    const fiscalMonth = parseInt(resolvedParams.fiscalMonth)

    if (isNaN(fiscalYear) || isNaN(fiscalMonth) || fiscalMonth < 1 || fiscalMonth > 12) {
      return NextResponse.json(
        { error: 'Invalid fiscal year or month' },
        { status: 400 }
      )
    }

    const service = new VarianceDetectionService(tenantId)
    const varianceSummary = await service.getVarianceSummary(fiscalYear, fiscalMonth)

    return NextResponse.json(varianceSummary)
  } catch (error: any) {
    console.error('Variance API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch variance analysis' },
      { status: 500 }
    )
  }
}
