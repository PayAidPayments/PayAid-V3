import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { runScenario } from '@/lib/ai/scenario-planner'
import { z } from 'zod'

const ScenarioSchema = z.object({
  scenarioType: z.enum(['close-deals', 'lose-customers', 'upsell-customers', 'improve-closure-rate']),
  parameters: z.object({
    dealIds: z.array(z.string()).optional(),
    contactIds: z.array(z.string()).optional(),
    closureRateImprovement: z.number().optional(),
  }),
})

/**
 * POST /api/crm/analytics/scenarios
 * Runs a what-if scenario analysis
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    
    const validatedData = ScenarioSchema.parse(body)

    const result = await runScenario({
      tenantId,
      ...validatedData,
    })

    return NextResponse.json({
      success: true,
      data: result,
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
    console.error('Error running scenario:', error)
    return NextResponse.json(
      { error: 'Failed to run scenario' },
      { status: 500 }
    )
  }
}
