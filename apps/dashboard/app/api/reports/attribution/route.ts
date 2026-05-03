/**
 * Attribution Report API
 * GET /api/reports/attribution - Get attribution analysis
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { AttributionEngineService } from '@/lib/reporting/attribution-engine'

// GET /api/reports/attribution - Get attribution summary
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { searchParams } = new URL(request.url)

    const contactId = searchParams.get('contactId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const source = searchParams.get('source') || undefined

    if (contactId) {
      // Get attribution for specific contact
      const report = await AttributionEngineService.getAttributionReport(
        tenantId,
        contactId
      )

      return NextResponse.json({
        success: true,
        data: report,
      })
    } else {
      // Get attribution summary
      const summary = await AttributionEngineService.getAttributionSummary(
        tenantId,
        {
          dateRange: startDate && endDate
            ? { start: new Date(startDate), end: new Date(endDate) }
            : undefined,
          source,
        }
      )

      return NextResponse.json({
        success: true,
        data: summary,
      })
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get attribution error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get attribution' },
      { status: 500 }
    )
  }
}
