import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { getAPIMetrics } from '@/lib/monitoring/api-monitoring'

/**
 * GET /api/monitoring/performance
 * Get API performance metrics
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { searchParams } = new URL(request.url)

    const startTime = searchParams.get('startTime')
      ? new Date(searchParams.get('startTime')!)
      : undefined
    const endTime = searchParams.get('endTime')
      ? new Date(searchParams.get('endTime')!)
      : undefined
    const endpoint = searchParams.get('endpoint') || undefined
    const method = searchParams.get('method') || undefined

    const metrics = getAPIMetrics({
      tenantId,
      endpoint,
      method,
      startTime,
      endTime,
    })

    return NextResponse.json({
      success: true,
      data: metrics,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Error fetching performance metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    )
  }
}
