import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { generateCombinedForecast } from '@/lib/ai/revenue-forecast'
import { z } from 'zod'

const ForecastQuerySchema = z.object({
  horizonDays: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 90)),
})

/**
 * GET /api/crm/analytics/revenue-forecast
 * Returns 90-day revenue forecast with scenarios
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { searchParams } = new URL(request.url)
    
    const query = ForecastQuerySchema.parse({
      horizonDays: searchParams.get('horizonDays'),
    })

    const forecast = await generateCombinedForecast(tenantId, query.horizonDays)

    return NextResponse.json({
      success: true,
      data: forecast,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Error generating revenue forecast:', error)
    return NextResponse.json(
      { error: 'Failed to generate revenue forecast' },
      { status: 500 }
    )
  }
}
