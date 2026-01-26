import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { PredictiveDealRoutingService } from '@/lib/ai/deal-routing'
import { z } from 'zod'

const routingSchema = z.object({
  dealValue: z.number().min(0),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  location: z.object({
    state: z.string().optional(),
    city: z.string().optional(),
  }).optional(),
  dealStage: z.string(),
  contactEmail: z.string().email().optional(),
  previousRepId: z.string().optional(),
})

/**
 * POST /api/crm/deals/route
 * Route deal to best sales rep using AI
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const context = routingSchema.parse(body)

    const recommendation = await PredictiveDealRoutingService.routeDeal(tenantId, context)

    if (!recommendation) {
      return NextResponse.json(
        { error: 'No available sales reps found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: recommendation,
    })
  } catch (error) {
    console.error('[Deal Routing] Error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return handleLicenseError(error)
  }
}
