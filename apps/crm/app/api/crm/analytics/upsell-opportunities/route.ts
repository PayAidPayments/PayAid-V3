import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { getUpsellOpportunities } from '@/lib/ai/upsell-detector'
import { z } from 'zod'

const UpsellQuerySchema = z.object({
  minOpportunityScore: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 50)),
})

/**
 * GET /api/crm/analytics/upsell-opportunities
 * Returns list of upsell opportunities
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { searchParams } = new URL(request.url)
    
    const query = UpsellQuerySchema.parse({
      minOpportunityScore: searchParams.get('minOpportunityScore'),
    })

    const opportunities = await getUpsellOpportunities(tenantId, query.minOpportunityScore)

    return NextResponse.json({
      success: true,
      count: opportunities.length,
      data: opportunities,
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
    console.error('Error fetching upsell opportunities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch upsell opportunities' },
      { status: 500 }
    )
  }
}
