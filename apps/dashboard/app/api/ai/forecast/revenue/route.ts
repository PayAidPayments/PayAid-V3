import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { forecastRevenue } from '@/lib/ai/forecast-engine'
import { z } from 'zod'

const forecastSchema = z.object({
  horizonDays: z.number().min(1).max(365).optional().default(90),
  historicalDays: z.number().min(30).max(730).optional().default(180),
  includeConfidenceIntervals: z.boolean().optional().default(true),
})

/**
 * POST /api/ai/forecast/revenue
 * Generate revenue forecast for the tenant
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')

    const body = await request.json()
    const validated = forecastSchema.parse(body)

    const forecast = await forecastRevenue(tenantId, {
      horizonDays: validated.horizonDays,
      historicalDays: validated.historicalDays,
      includeConfidenceIntervals: validated.includeConfidenceIntervals,
    })

    return NextResponse.json({
      success: true,
      forecast,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Revenue forecast error:', error)
    return NextResponse.json(
      { error: 'Failed to generate revenue forecast', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * GET /api/ai/forecast/revenue
 * Get revenue forecast (uses default parameters)
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')

    const { searchParams } = new URL(request.url)
    const horizonDays = searchParams.get('horizonDays')
      ? parseInt(searchParams.get('horizonDays')!)
      : 90
    const historicalDays = searchParams.get('historicalDays')
      ? parseInt(searchParams.get('historicalDays')!)
      : 180

    const forecast = await forecastRevenue(tenantId, {
      horizonDays,
      historicalDays,
      includeConfidenceIntervals: true,
    })

    return NextResponse.json({
      success: true,
      forecast,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Revenue forecast error:', error)
    return NextResponse.json(
      { error: 'Failed to generate revenue forecast', details: String(error) },
      { status: 500 }
    )
  }
}
