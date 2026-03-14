import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { getAPIUsageStats, getAPIKeyUsageStats } from '@/lib/middleware/api-analytics'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/analytics/api-usage
 * Get API usage statistics for the tenant
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'api-integration-hub')

    const { searchParams } = new URL(request.url)
    const apiKeyId = searchParams.get('apiKeyId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const start = startDate ? new Date(startDate) : undefined
    const end = endDate ? new Date(endDate) : undefined

    // If apiKeyId is provided, get stats for that specific API key
    if (apiKeyId) {
      // Verify the API key belongs to this tenant
      const apiKey = await prisma.apiKey.findFirst({
        where: {
          id: apiKeyId,
          orgId: tenantId,
        },
      })

      if (!apiKey) {
        return NextResponse.json(
          { error: 'API key not found' },
          { status: 404 }
        )
      }

      const stats = await getAPIKeyUsageStats(apiKeyId, start, end)
      return NextResponse.json({ stats })
    }

    // Get stats for all API usage for this tenant
    const stats = await getAPIUsageStats(tenantId, start, end)
    return NextResponse.json({ stats })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get API usage stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API usage statistics' },
      { status: 500 }
    )
  }
}

