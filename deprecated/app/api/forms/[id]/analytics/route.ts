/**
 * Form Analytics API
 * GET /api/forms/[id]/analytics - Get form analytics
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { FormAnalyticsService } from '@/lib/forms/form-analytics'

// GET /api/forms/[id]/analytics - Get form analytics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { searchParams } = new URL(request.url)

    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const dateRange = startDate && endDate
      ? { start: new Date(startDate), end: new Date(endDate) }
      : undefined

    const analytics = await FormAnalyticsService.getFormAnalytics(
      tenantId,
      params.id,
      dateRange
    )

    return NextResponse.json({
      success: true,
      data: analytics,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get form analytics error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get form analytics' },
      { status: 500 }
    )
  }
}
