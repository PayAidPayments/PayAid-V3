/**
 * Template Analytics API
 * GET /api/crm/templates/analytics - Get template performance metrics
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { getTemplateAnalytics, getTemplatePerformance } from '@/lib/crm/template-analytics'

// GET /api/crm/templates/analytics - Get template analytics
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const searchParams = request.nextUrl.searchParams
    const templateId = searchParams.get('templateId')

    if (templateId) {
      // Get analytics for specific template
      const analytics = await getTemplateAnalytics(tenantId, templateId)
      if (!analytics) {
        return NextResponse.json(
          { success: false, error: 'Template not found or not applied' },
          { status: 404 }
        )
      }
      return NextResponse.json({ success: true, analytics })
    } else {
      // Get performance overview
      const performance = await getTemplatePerformance(tenantId)
      return NextResponse.json({ success: true, performance })
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get template analytics error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get analytics',
      },
      { status: 500 }
    )
  }
}
