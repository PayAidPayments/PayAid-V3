import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { getLeadSourceROI } from '@/lib/analytics/lead-source-tracking'

/**
 * GET /api/analytics/lead-sources
 * Get lead source ROI data
 */
export async function GET(request: NextRequest) {
  try {
    // Check Analytics module license
    const { tenantId } = await requireModuleAccess(request, 'analytics')

    const sources = await getLeadSourceROI(tenantId)

    return NextResponse.json({
      sources: sources.map((source) => ({
        id: source.id,
        name: source.name,
        type: source.type,
        leadsCount: source.leadsCount,
        conversionsCount: source.conversionsCount,
        conversionRate: (source.conversionRate * 100).toFixed(1) + '%',
        avgDealValue: source.avgDealValue,
        totalValue: source.totalValue,
        roi: source.roi.toFixed(0) + '%',
      })),
    })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get lead source ROI error:', error)
    return NextResponse.json(
      {
        error: 'Failed to get lead source ROI',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
