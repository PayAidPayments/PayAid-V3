/**
 * Deal Rot Detection API
 * GET /api/crm/deals/rotting - Get list of rotting deals
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { detectRottingDeals, getSuggestedActions } from '@/lib/crm/deal-rot-detector'
import { z } from 'zod'

const rotConfigSchema = z.array(
  z.object({
    stage: z.string(),
    maxDaysWithoutActivity: z.number().positive(),
  })
).optional()

// GET /api/crm/deals/rotting - Get rotting deals
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const searchParams = request.nextUrl.searchParams
    const customThresholdsParam = searchParams.get('thresholds')

    let customThresholds
    if (customThresholdsParam) {
      try {
        customThresholds = rotConfigSchema.parse(JSON.parse(customThresholdsParam))
      } catch {
        // Invalid JSON, use defaults
      }
    }

    const result = await detectRottingDeals(tenantId, customThresholds)

    // Add suggested actions to each deal
    const dealsWithActions = result.rottingDeals.map((deal) => ({
      ...deal,
      suggestedActions: getSuggestedActions(deal),
    }))

    return NextResponse.json({
      success: true,
      data: {
        rottingDeals: dealsWithActions,
        totalCount: result.totalCount,
        byStage: result.byStage,
        totalValue: result.totalValue,
        totalValueFormatted: `₹${result.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Deal rot detection error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to detect rotting deals',
      },
      { status: 500 }
    )
  }
}
